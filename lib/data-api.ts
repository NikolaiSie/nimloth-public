import { z } from "zod";

const envSchema = z.object({
  NIMLOTH_DATA_API_BASE_URL: z.string().url().optional(),
  NIMLOTH_DATA_API_KEY: z.string().min(1).optional(),
  GOOGLE_CLOUD_PROJECT: z.string().optional(),
  GCP_PROJECT: z.string().optional(),
  K_SERVICE: z.string().optional(),
  NIMLOTH_PUBLIC_ENV: z.enum(["local", "nonprod", "prod"]).optional(),
});

export type DeploymentEnvironment = "local" | "nonprod" | "prod";

export type MarketSnapshot = {
  status: "loading" | "healthy" | "degraded";
  asOf: string;
  headline: string;
  summary: string;
  points: string[];
};

type NimlothMetadataResponse = {
  available_aggregations?: string[];
  available_caps?: string[];
  available_countries?: string[];
  available_dates?: string[];
  latest_date?: string;
  updated_at?: string;
};

function readEnv() {
  return envSchema.parse({
    NIMLOTH_DATA_API_BASE_URL: process.env.NIMLOTH_DATA_API_BASE_URL,
    NIMLOTH_DATA_API_KEY: process.env.NIMLOTH_DATA_API_KEY,
    GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT,
    GCP_PROJECT: process.env.GCP_PROJECT,
    K_SERVICE: process.env.K_SERVICE,
    NIMLOTH_PUBLIC_ENV: process.env.NIMLOTH_PUBLIC_ENV,
  });
}

function detectDeploymentEnvironment(env: ReturnType<typeof readEnv>): DeploymentEnvironment {
  if (env.NIMLOTH_PUBLIC_ENV) {
    return env.NIMLOTH_PUBLIC_ENV;
  }

  const projectId = env.GOOGLE_CLOUD_PROJECT ?? env.GCP_PROJECT ?? "";

  if (projectId === "nimloth-public-prod") {
    return "prod";
  }

  if (projectId === "nimloth-public-nonprod" || env.K_SERVICE) {
    return "nonprod";
  }

  return "local";
}

function resolveApiConfig(env: ReturnType<typeof readEnv>) {
  const environment = detectDeploymentEnvironment(env);

  return {
    environment,
    baseUrl: env.NIMLOTH_DATA_API_BASE_URL,
    apiKey: env.NIMLOTH_DATA_API_KEY,
  };
}

function requireApiConfig(config: ReturnType<typeof resolveApiConfig>) {
  if (!config.baseUrl) {
    throw new Error(
      `NIMLOTH_DATA_API_BASE_URL is required for ${config.environment} environment.`,
    );
  }

  if (!config.apiKey) {
    throw new Error(
      `NIMLOTH_DATA_API_KEY is required for ${config.environment} environment.`,
    );
  }
}

async function fetchNimlothApiJson<T>(path: string, config: ReturnType<typeof resolveApiConfig>) {
  requireApiConfig(config);

  const response = await fetch(`${config.baseUrl}${path}`, {
    method: "GET",
    headers: {
      "X-API-Key": config.apiKey!,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Nimloth API error ${response.status}: ${body}`);
  }

  return (await response.json()) as T;
}

async function getApiMetadataSmokeSnapshot() {
  const env = readEnv();
  const config = resolveApiConfig(env);
  const now = new Date().toISOString();

  if (!config.baseUrl || !config.apiKey) {
    return {
      status: "degraded",
      asOf: now,
      headline: `Data API health check unavailable in ${config.environment}`,
      summary: "The server-side API base URL or API key is not configured.",
      points: [
        `Environment: ${config.environment}`,
        `Base URL configured: ${config.baseUrl ? "yes" : "no"}`,
        `API key configured: ${config.apiKey ? "yes" : "no"}`,
      ],
    } satisfies MarketSnapshot;
  }

  const metadata = await fetchNimlothApiJson<NimlothMetadataResponse>(
    "/v1/momentum-matrix/metadata",
    config,
  );

  return {
    status: "healthy",
    asOf: metadata.updated_at ?? now,
    headline: `Data API metadata auth passed in ${config.environment}`,
    summary:
      "The website can authenticate server-side and load upstream momentum metadata.",
    points: [
      `Environment: ${config.environment}`,
      `Endpoint: ${config.baseUrl}/v1/momentum-matrix/metadata`,
      `Latest date: ${metadata.latest_date ?? "unavailable"}`,
      `Dates available: ${metadata.available_dates?.length ?? 0}`,
      `Default filters: country=ALL, cap=ALL, aggregation=mean`,
    ],
  } satisfies MarketSnapshot;
}

export async function getMarketSnapshot() {
  return getApiMetadataSmokeSnapshot();
}
