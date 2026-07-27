import { NextResponse } from "next/server";
import { getMarketSnapshot } from "@/lib/data-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await getMarketSnapshot();
    return NextResponse.json(snapshot, { status: 200 });
  } catch (error) {
    console.error("Market snapshot upstream error", error);
    return NextResponse.json(
      {
        status: "degraded",
        asOf: new Date().toISOString(),
        headline: "Data API metadata auth failed",
        summary:
          "The website could not authenticate to or load upstream momentum metadata.",
        points: [],
      },
      { status: 503 },
    );
  }
}
