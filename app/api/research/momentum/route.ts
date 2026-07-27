import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getLatestMomentumMatrix,
  getMomentumMatrix,
  getMomentumMetadata,
  NimlothApiError,
} from "@/lib/nimloth-api";
import { normalizeMomentumMatrixColumns } from "@/lib/momentum-matrix";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  date: z.string().optional(),
  country: z.string().default("ALL"),
  cap: z.enum(["ALL", "SC", "MC", "LC"]).default("ALL"),
  aggregation: z.enum(["mean", "median"]).default("median"),
});

function toErrorResponse(error: unknown) {
  if (error instanceof NimlothApiError) {
    if (error.status === 401) {
      return NextResponse.json(
        { message: "Momentum API authentication failed." },
        { status: 502 },
      );
    }

    if (error.status === 404) {
      return NextResponse.json(
        { message: "Momentum data is unavailable for that filter set." },
        { status: 404 },
      );
    }

    if (error.status === 503) {
      return NextResponse.json(
        { message: "Momentum data is temporarily unavailable." },
        { status: 503 },
      );
    }
  }

  return NextResponse.json(
    { message: "The momentum research data could not be loaded." },
    { status: 503 },
  );
}

export async function GET(request: NextRequest) {
  const parsed = querySchema.parse({
    date: request.nextUrl.searchParams.get("date") ?? undefined,
    country: request.nextUrl.searchParams.get("country") ?? undefined,
    cap: request.nextUrl.searchParams.get("cap") ?? undefined,
    aggregation: request.nextUrl.searchParams.get("aggregation") ?? undefined,
  });

  try {
    const metadata = await getMomentumMetadata();
    const rawMatrix = parsed.date
      ? await getMomentumMatrix({
          ...parsed,
          date: parsed.date,
        })
      : await getLatestMomentumMatrix(parsed);

    if (!rawMatrix) {
      return NextResponse.json(
        { message: "Momentum data is unavailable because no latest date was published." },
        { status: 503 },
      );
    }

    const matrix = normalizeMomentumMatrixColumns(rawMatrix, metadata);

    return NextResponse.json({
      metadata,
      matrix,
      filters: {
        country: parsed.country,
        cap: parsed.cap,
        aggregation: parsed.aggregation,
        date: parsed.date ?? null,
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
