import { NextResponse } from "next/server";
import { getMarketSnapshot } from "@/lib/data-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await getMarketSnapshot();
    return NextResponse.json(snapshot, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: "degraded",
        asOf: new Date().toISOString(),
        headline: "Market snapshot unavailable",
        summary: "The upstream data API is currently unavailable.",
        points: [],
      },
      { status: 503 },
    );
  }
}
