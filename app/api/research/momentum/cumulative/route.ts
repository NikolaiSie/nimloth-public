import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getHistoricalMomentumMatrix,
  getMomentumMetadata,
  NimlothApiError,
  type MomentumMatrixSlice,
} from "@/lib/nimloth-api";
import { MOMENTUM_AGGREGATIONS } from "@/lib/momentum-aggregations";
import {
  buildCumulativeSeries,
  CUMULATIVE_DEFAULT_SIGNAL,
  CUMULATIVE_DEFAULT_START,
  CUMULATIVE_HORIZON,
  isPublicSortFeature,
  pickMonthlyRebalanceDates,
  type MonthlyReturn,
} from "@/lib/momentum-cumulative";

export const dynamic = "force-dynamic";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/u);

const querySchema = z.object({
  country: z.string().default("ALL"),
  cap: z.enum(["ALL", "SC", "MC", "LC"]).default("ALL"),
  aggregation: z.enum(MOMENTUM_AGGREGATIONS).default("weighted_mean"),
  signal: z.string().default(CUMULATIVE_DEFAULT_SIGNAL),
  start: isoDate.default(CUMULATIVE_DEFAULT_START),
  end: isoDate.optional(),
});

const FETCH_CONCURRENCY = 8;

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
) {
  const results = new Array<R>(items.length);
  let next = 0;

  async function run() {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

function readSpread(slice: MomentumMatrixSlice, signal: string) {
  const rowIndex = slice.rows.indexOf(signal);
  const columnIndex = slice.columns.indexOf(CUMULATIVE_HORIZON);
  if (rowIndex < 0 || columnIndex < 0) {
    return null;
  }
  const value = slice.values[rowIndex]?.[columnIndex];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function badRequest(message: string) {
  return NextResponse.json({ message }, { status: 400 });
}

function toErrorResponse(error: unknown) {
  if (error instanceof NimlothApiError && error.status === 401) {
    return NextResponse.json(
      { message: "Momentum API authentication failed." },
      { status: 502 },
    );
  }

  return NextResponse.json(
    { message: "The cumulative momentum data could not be loaded." },
    { status: 503 },
  );
}

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(
    Object.fromEntries(
      ["country", "cap", "aggregation", "signal", "start", "end"].flatMap((key) => {
        const value = request.nextUrl.searchParams.get(key);
        return value ? [[key, value]] : [];
      }),
    ),
  );

  if (!parsed.success) {
    return badRequest("Invalid filters for the cumulative momentum plot.");
  }

  const query = parsed.data;

  try {
    const metadata = await getMomentumMetadata();
    const signals = metadata.sort_features.filter(isPublicSortFeature);

    if (metadata.countries.length > 0 && !metadata.countries.includes(query.country)) {
      return badRequest(`Unknown market: ${query.country}.`);
    }
    if (signals.length > 0 && !signals.includes(query.signal)) {
      return badRequest(`Unknown momentum signal: ${query.signal}.`);
    }

    const sortedDates = [...metadata.dates].sort();
    const end = query.end ?? metadata.latest_date ?? sortedDates.at(-1) ?? query.start;
    if (end < query.start) {
      return badRequest("The end date must be after the start date.");
    }

    const rebalanceDates = pickMonthlyRebalanceDates(sortedDates, query.start, end);
    const monthly = await mapWithConcurrency(
      rebalanceDates,
      FETCH_CONCURRENCY,
      async (date): Promise<MonthlyReturn> => {
        try {
          const slice = await getHistoricalMomentumMatrix({
            date,
            country: query.country,
            cap: query.cap,
            aggregation: query.aggregation,
          });
          return { date, spread: readSpread(slice, query.signal) };
        } catch (error) {
          // A single missing slice becomes a gap; anything else fails the request.
          if (error instanceof NimlothApiError && error.status === 404) {
            return { date, spread: null };
          }
          throw error;
        }
      },
    );

    const series = buildCumulativeSeries(monthly);

    return NextResponse.json({
      filters: { ...query, end },
      options: {
        countries: metadata.countries,
        caps: metadata.caps,
        aggregations: metadata.aggregations,
        signals,
        firstDate: sortedDates[0] ?? null,
        lastDate: metadata.latest_date ?? sortedDates.at(-1) ?? null,
      },
      points: series.points,
      skippedDates: series.skippedDates,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
