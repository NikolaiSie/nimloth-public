import {
  getLatestMomentumMatrix,
  getMomentumMetadata,
  NimlothApiError,
  type MomentumMatrixSlice,
} from "@/lib/nimloth-api";
import { z } from "zod";

const deploymentEnvSchema = z.object({
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

function readDeploymentEnv() {
  return deploymentEnvSchema.parse({
    GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT,
    GCP_PROJECT: process.env.GCP_PROJECT,
    K_SERVICE: process.env.K_SERVICE,
    NIMLOTH_PUBLIC_ENV: process.env.NIMLOTH_PUBLIC_ENV,
  });
}

function detectDeploymentEnvironment(
  env: ReturnType<typeof readDeploymentEnv>,
): DeploymentEnvironment {
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

function findStrongestAbsoluteValue(values: MomentumMatrixSlice["values"]) {
  let strongest: number | null = null;

  for (const row of values) {
    for (const value of row) {
      if (typeof value !== "number" || Number.isNaN(value)) {
        continue;
      }

      if (strongest === null || Math.abs(value) > Math.abs(strongest)) {
        strongest = value;
      }
    }
  }

  return strongest;
}

function firstMatrixValue(values: Array<Array<number | null | undefined>>) {
  for (const row of values) {
    for (const value of row) {
      if (typeof value === "number" && !Number.isNaN(value)) {
        return value;
      }
    }
  }

  return null;
}

function formatMetric(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "unavailable";
  }

  return value.toFixed(4);
}

function formatCount(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "unavailable";
  }

  return new Intl.NumberFormat("en-US").format(value);
}

function buildUnavailableSnapshot(): MarketSnapshot {
  const now = new Date().toISOString();
  return {
    status: "degraded",
    asOf: now,
    headline: "Momentum data temporarily unavailable",
    summary:
      "The website could not load the latest momentum snapshot from server-side data sources.",
    points: [],
  };
}

function logMarketSnapshotFailure(
  environment: DeploymentEnvironment,
  error: unknown,
) {
  if (error instanceof NimlothApiError) {
    console.error("Market snapshot upstream failure", {
      environment,
      status: error.status,
      kind: error.kind,
      body: error.body,
    });
    return;
  }

  if (error instanceof Error) {
    console.error("Market snapshot internal failure", {
      environment,
      message: error.message,
      stack: error.stack,
    });
    return;
  }

  console.error("Market snapshot unknown failure", {
    environment,
    error,
  });
}

export async function getMarketSnapshot() {
  const environment = detectDeploymentEnvironment(readDeploymentEnv());

  try {
    const metadata = await getMomentumMetadata();
    const latest = await getLatestMomentumMatrix({
      country: "ALL",
      cap: "ALL",
      aggregation: "mean",
    });

    const strongestValue = findStrongestAbsoluteValue(latest.values);

    return {
      status: "healthy",
      asOf: new Date().toISOString(),
      headline: `Latest momentum matrix loaded in ${environment}`,
      summary:
        "The website authenticated successfully and loaded the latest ALL / ALL / mean momentum slice.",
      points: [
        `Date: ${latest.date}`,
        `Matrix size: ${latest.rows.length} x ${latest.columns.length}`,
        `Strongest absolute spread: ${formatMetric(strongestValue)}`,
        `Observations: ${formatCount(firstMatrixValue(latest.n_total ?? []))}`,
        `Latest metadata date: ${metadata.latest_date ?? "unavailable"}`,
      ],
    } satisfies MarketSnapshot;
  } catch (error) {
    logMarketSnapshotFailure(environment, error);
    return buildUnavailableSnapshot();
  }
}
