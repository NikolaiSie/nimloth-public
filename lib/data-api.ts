import { z } from "zod";

const envSchema = z.object({
  DATA_API_MODE: z.enum(["mock", "live"]).default("mock"),
  NIMLOTH_DATA_API_BASE_URL: z.string().url().optional(),
  NIMLOTH_DATA_API_KEY: z.string().min(1).optional(),
});

export type MarketSnapshot = {
  status: "loading" | "healthy" | "degraded";
  asOf: string;
  headline: string;
  summary: string;
  points: string[];
};

const mockSnapshot: MarketSnapshot = {
  status: "healthy",
  asOf: "2026-07-26T08:00:00.000Z",
  headline: "Mock market signal path is online",
  summary:
    "Local development is using a deterministic snapshot so the site remains fully runnable without the private data platform.",
  points: [
    "Factor pipelines are represented but not queried in local mode.",
    "Secure server-side calls replace direct browser access in deployed environments.",
    "The public route is intentionally read-only and narrow.",
  ],
};

function readEnv() {
  return envSchema.parse({
    DATA_API_MODE: process.env.DATA_API_MODE,
    NIMLOTH_DATA_API_BASE_URL: process.env.NIMLOTH_DATA_API_BASE_URL,
    NIMLOTH_DATA_API_KEY: process.env.NIMLOTH_DATA_API_KEY,
  });
}

async function getLiveSnapshot() {
  const env = readEnv();

  if (!env.NIMLOTH_DATA_API_BASE_URL) {
    throw new Error("NIMLOTH_DATA_API_BASE_URL must be configured in live mode.");
  }

  if (!env.NIMLOTH_DATA_API_KEY) {
    throw new Error("NIMLOTH_DATA_API_KEY must be configured in live mode.");
  }

  const metadataResponse = await fetch(
    `${env.NIMLOTH_DATA_API_BASE_URL}/v1/momentum-matrix/metadata`,
    {
      method: "GET",
      headers: {
        "X-API-Key": env.NIMLOTH_DATA_API_KEY,
      },
      cache: "no-store",
    },
  );

  if (!metadataResponse.ok) {
    throw new Error(`Data API metadata request returned ${metadataResponse.status}.`);
  }

  const metadata = (await metadataResponse.json()) as {
    updated_at?: string;
    latest_date?: string;
    available_dates?: string[];
  };

  const latestResponse = await fetch(
    `${env.NIMLOTH_DATA_API_BASE_URL}/v1/momentum-matrix/latest?country=ALL&cap=ALL&aggregation=mean`,
    {
      method: "GET",
      headers: {
        "X-API-Key": env.NIMLOTH_DATA_API_KEY,
      },
      cache: "no-store",
    },
  );

  if (!latestResponse.ok) {
    throw new Error(`Data API latest request returned ${latestResponse.status}.`);
  }

  const latestPayload = (await latestResponse.json()) as {
    date?: string;
    aggregation?: string;
    country?: string;
    cap?: string;
    value?: number | null;
    signal?: number | null;
    observations?: number | null;
  };

  return {
    status: "healthy",
    asOf:
      metadata.updated_at ??
      latestPayload.date ??
      metadata.latest_date ??
      new Date().toISOString(),
    headline: "Momentum matrix latest snapshot",
    summary: `Latest ${latestPayload.aggregation ?? "mean"} view for ${
      latestPayload.country ?? "ALL"
    } / ${latestPayload.cap ?? "ALL"}.`,
    points: [
      `Value: ${formatMetric(latestPayload.value)}`,
      `Signal: ${formatMetric(latestPayload.signal)}`,
      `Observations: ${formatCount(latestPayload.observations)}`,
      `Latest date: ${metadata.latest_date ?? latestPayload.date ?? "unavailable"}`,
    ],
  } satisfies MarketSnapshot;
}

function formatCount(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "unavailable";
  }

  return new Intl.NumberFormat("en-US").format(value);
}

function formatMetric(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "unavailable";
  }

  return value.toFixed(4);
}

export async function getMarketSnapshot() {
  const env = readEnv();
  if (env.DATA_API_MODE === "mock") {
    return mockSnapshot;
  }

  return getLiveSnapshot();
}
