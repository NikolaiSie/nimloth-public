/**
 * Cumulative return of a monthly-rebalanced momentum strategy (Q5 − Q1 spread).
 *
 * One rebalance date is picked per calendar month from the dates the data API
 * publishes. The strategy earns that date's 1-month forward Q5 − Q1 spread, then
 * rolls into the next month's spread, compounding as it goes. The 1-month
 * horizon and the gap between monthly picks can differ by a day or two; that
 * drift is accepted.
 */

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

function isExcludedDate(date: string) {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  const monthDay = date.slice(5, 10);
  return day === 0 || day === 6 || monthDay === "01-01" || monthDay === "12-25";
}

/**
 * Picks the first usable date in each calendar month within [start, end].
 * Dates that fall on weekends, Jan 1, or Dec 25 are never picked.
 */
export function pickMonthlyRebalanceDates(
  availableDates: string[],
  start: string,
  end: string,
) {
  const picked = new Map<string, string>();

  for (const date of [...availableDates].sort()) {
    if (date < start || date > end || isExcludedDate(date)) {
      continue;
    }

    const month = date.slice(0, 7);
    if (!picked.has(month)) {
      picked.set(month, date);
    }
  }

  return [...picked.values()];
}

/**
 * Compounds monthly spreads into a cumulative return series. Trailing months
 * whose forward return has not completed yet are dropped; a missing month in
 * the middle is skipped (treated as flat) and reported.
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
