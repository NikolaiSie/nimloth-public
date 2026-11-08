/**
 * Cumulative return of a monthly-rebalanced momentum strategy (Q5 − Q1 spread).
 *
 * The data API publishes, per market / cap bucket / aggregation, every signal's
 * 1-month forward Q5 − Q1 spread on each month's first trading day. The
 * strategy earns that spread, then rolls into the next month's, compounding.
 */

import type { MomentumSeries } from "@/lib/nimloth-api";

export const CUMULATIVE_HORIZON = "forward_return_1m";
export const CUMULATIVE_DEFAULT_START = "2010-01-01";
export const CUMULATIVE_DEFAULT_SIGNAL = "momentum_12m_ex_1m";

export type MonthlyReturn = {
  /** Rebalance date: the strategy is formed on this date's ranking. */
  date: string;
  /** 1-month forward Q5 − Q1 spread from this date, or null if unavailable. */
  spread: number | null;
};

export type CumulativePoint = {
  /** Rebalance date the period starts on. */
  date: string;
  /** Spread earned over the period starting on `date`. */
  spread: number;
  /** Compounded return through the end of this period. */
  cumulative: number;
};

export type CumulativeSeries = {
  points: CumulativePoint[];
  /** Rebalance dates inside the range whose spread was missing mid-series. */
  skippedDates: string[];
};

/** Monthly spreads of one signal from `start` on; empty if the signal is absent. */
export function monthlyReturnsFromSeries(
  series: Pick<MomentumSeries, "dates" | "signals" | "values">,
  signal: string,
  start: string,
): MonthlyReturn[] {
  const row = series.signals.indexOf(signal);
  if (row < 0) {
    return [];
  }
  const values = series.values[row] ?? [];
  return series.dates.flatMap((date, index) => {
    if (date < start) {
      return [];
    }
    const value = values[index];
    return [{ date, spread: typeof value === "number" && Number.isFinite(value) ? value : null }];
  });
}

/**
 * Compounds monthly spreads into a cumulative return series. Months before the
 * signal has data and trailing months whose forward return has not completed
 * are dropped; a missing month in the middle is skipped (held flat) and reported.
 */
export function buildCumulativeSeries(monthly: MonthlyReturn[]): CumulativeSeries {
  const sorted = [...monthly].sort((left, right) => left.date.localeCompare(right.date));
  let lastAvailable = -1;
  sorted.forEach((entry, index) => {
    if (typeof entry.spread === "number" && Number.isFinite(entry.spread)) {
      lastAvailable = index;
    }
  });

  const points: CumulativePoint[] = [];
  const skippedDates: string[] = [];
  let growth = 1;

  for (const entry of sorted.slice(0, lastAvailable + 1)) {
    if (typeof entry.spread !== "number" || !Number.isFinite(entry.spread)) {
      if (points.length > 0) {
        skippedDates.push(entry.date);
      }
      continue;
    }

    growth *= 1 + entry.spread;
    points.push({ date: entry.date, spread: entry.spread, cumulative: growth - 1 });
  }

  return { points, skippedDates };
}

/** Rows the public widgets show; level-to-MA features are hidden as in the heatmap. */
export function isPublicSortFeature(feature: string) {
  return !feature.toLowerCase().startsWith("level_to_ma_");
}

const UNIT_NAMES: Record<string, [string, string]> = {
  d: ["day", "days"],
  w: ["week", "weeks"],
  m: ["month", "months"],
  y: ["year", "years"],
};

function spellPeriod(period: string) {
  const match = /^(\d+)([dwmy])$/u.exec(period);
  if (!match) {
    return period;
  }
  const count = Number(match[1]);
  const [singular, plural] = UNIT_NAMES[match[2]];
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Reader-facing signal name, e.g. momentum_12m_ex_1m -> "12 months ex 1 month". */
export function formatSignalLabel(signal: string) {
  const excluding = /^momentum_(\d+[dwmy])_ex_(\d+[dwmy])$/u.exec(signal);
  if (excluding) {
    return `${spellPeriod(excluding[1])} ex ${spellPeriod(excluding[2])}`;
  }
  const momentum = /^momentum_(\d+[dwmy])$/u.exec(signal);
  if (momentum) {
    return `${spellPeriod(momentum[1])} return`;
  }
  const skewness = /^skewness_(\d+[dwmy])$/u.exec(signal);
  if (skewness) {
    return `${spellPeriod(skewness[1])} return skewness`;
  }
  const crossover = /^ma_(\d+[dwmy])_to_(\d+[dwmy])$/u.exec(signal);
  if (crossover) {
    return `MA ${crossover[1]} / ${crossover[2]}`;
  }
  return signal.replaceAll("_", " ");
}

export type MarketOption = { value: string; label: string };

/** Markets for the picker: all countries first, then by name, labelled "Name (CODE)". */
export function marketOptions(
  countries: string[],
  names: Record<string, string | null | undefined> = {},
): MarketOption[] {
  const label = (code: string) => {
    if (code === "ALL") {
      return names.ALL ?? "All countries";
    }
    const name = names[code];
    return name ? `${name} (${code})` : code;
  };
  const rest = countries
    .filter((code) => code !== "ALL")
    .map((code) => ({ value: code, label: label(code) }))
    .sort((left, right) => left.label.localeCompare(right.label));
  return [{ value: "ALL", label: label("ALL") }, ...rest];
}

/** Display name for a cap bucket code. */
export function formatCapLabel(cap: string) {
  return ({ ALL: "All caps", SC: "Small caps", MC: "Mid caps", LC: "Large caps" } as Record<string, string>)[cap] ?? cap;
}
