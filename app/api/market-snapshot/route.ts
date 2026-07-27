import { NextResponse } from "next/server";
import { getMarketSnapshot } from "@/lib/data-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await getMarketSnapshot();
  const statusCode = snapshot.status === "healthy" ? 200 : 503;
  return NextResponse.json(snapshot, { status: statusCode });
}
