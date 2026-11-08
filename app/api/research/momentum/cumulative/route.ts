import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getMomentumMetadata,
  getMomentumSeries,
  NimlothApiError,
} from "@/lib/nimloth-api";
import { MOMENTUM_AGGREGATIONS } from "@/lib/momentum-aggregations";
import {
  buildCumulativeSeries,
  CUMULATIVE_DEFAULT_SIGNAL,
  CUMULATIVE_DEFAULT_START,
  CUMULATIVE_HORIZON,
  isPublicSortFeature,
  monthlyReturnsFromSeries,
} from "@/lib/momentum-cumulative";

export const dynamic = "force-dynamic";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/u);

const querySchema = z.object({
  country: z.string().default("ALL"),
  cap: z.enum(["ALL", "SC", "MC", "LC"]).default("ALL"),
  aggregation: z.enum(MOMENTUM_AGGREGATIONS).default("weighted_mean"),
  signal: z.string().default(CUMULATIVE_DEFAULT_SIGNAL),
  start: isoDate.default(CUMULATIVE_DEFAULT_START),
});

function badRequest(message: string) {
  return NextResponse.json({ message }, { status: 400 });
}

function toErrorResponse(error: unknown) {
  if (error instanceof NimlothApiError && error.status === 401) {
    return NextResponse.json({ message: "Momentum API authentication failed." }, { status: 502 });
  }
  if (error instanceof NimlothApiError && error.status === 404) {
    return NextResponse.json(
      { message: "No monthly returns are published for that market and cap bucket." },
      { status: 404 },
    );
  }
  return NextResponse.json(
    { message: "The cumulative momentum data could not be loaded." },
    { status: 503 },
  );
}

/**
 * One data-API request per filter change: the monthly series for the selected
 * market, cap bucket and aggregation, from which the chosen signal is compounded.
 */
export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(
    Object.fromEntries(
      ["country", "cap", "aggregation", "signal", "start"].flatMap((key) => {
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
    if (metadata.countries.length > 0 && !metadata.countries.includes(query.country)) {
      return badRequest(`Unknown market: ${query.country}.`);
    }

    const series = await getMomentumSeries({
      country: query.country,
      cap: query.cap,
      aggregation: query.aggregation,
      horizon: CUMULATIVE_HORIZON,
    });
    const signals = series.signals.filter(isPublicSortFeature);
    if (!signals.includes(query.signal)) {
      return badRequest(`Unknown momentum signal: ${query.signal}.`);
    }

    const cumulative = buildCumulativeSeries(
      monthlyReturnsFromSeries(series, query.signal, query.start),
    );

    return NextResponse.json({
      filters: query,
      options: {
        countries: metadata.countries,
        countryNames: metadata.country_names ?? {},
        caps: metadata.caps,
        aggregations: metadata.aggregations,
        signals,
        firstDate: series.dates[0] ?? null,
        lastDate: series.dates.at(-1) ?? null,
      },
      points: cumulative.points,
      skippedDates: cumulative.skippedDates,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
