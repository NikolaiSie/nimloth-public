import { GoogleAuth } from "google-auth-library";
import { z } from "zod";

const envSchema = z.object({
  DATA_API_MODE: z.enum(["mock", "live"]).default("mock"),
  DATA_API_BASE_URL: z.string().url().optional(),
  DATA_API_AUDIENCE: z.string().optional(),
  DATA_API_BEARER_TOKEN: z.string().optional(),
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
    DATA_API_BASE_URL: process.env.DATA_API_BASE_URL,
    DATA_API_AUDIENCE: process.env.DATA_API_AUDIENCE,
    DATA_API_BEARER_TOKEN: process.env.DATA_API_BEARER_TOKEN,
  });
}

async function buildAuthHeaders(targetAudience: string) {
  const auth = new GoogleAuth();
  const client = await auth.getIdTokenClient(targetAudience);
  const headers = await client.getRequestHeaders();
  return headers;
}

async function getLiveSnapshot() {
  const env = readEnv();

  if (!env.DATA_API_BASE_URL) {
    throw new Error("DATA_API_BASE_URL must be configured in live mode.");
  }

  const headers = new Headers({
    "content-type": "application/json",
  });

  if (env.DATA_API_BEARER_TOKEN) {
    headers.set("authorization", `Bearer ${env.DATA_API_BEARER_TOKEN}`);
  } else if (env.DATA_API_AUDIENCE) {
    const authHeaders = await buildAuthHeaders(env.DATA_API_AUDIENCE);
    Object.entries(authHeaders).forEach(([key, value]) => {
      if (value) {
        headers.set(key, value);
      }
    });
  }

  const response = await fetch(`${env.DATA_API_BASE_URL}/public/market-snapshot`, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Data API returned ${response.status}.`);
  }

  return (await response.json()) as MarketSnapshot;
}

export async function getMarketSnapshot() {
  const env = readEnv();
  if (env.DATA_API_MODE === "mock") {
    return mockSnapshot;
  }

  return getLiveSnapshot();
}
