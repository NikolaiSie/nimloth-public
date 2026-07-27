import { unstable_cache } from "next/cache";
import { z } from "zod";

const envSchema = z.object({
  NIMLOTH_DATA_API_BASE_URL: z.string().url().optional(),
  NIMLOTH_DATA_API_KEY: z.string().min(1).optional(),
});

export type MomentumMetadata = {
  schema_version?: string;
  latest_date?: string;
  dates: string[];
  countries: string[];
  caps: string[];
  aggregations: string[];
  sort_features: string[];
  target_horizons: string[];
};

export type MomentumMatrixQuery = {
  date?: string;
  country: string;
  cap: "ALL" | "SC" | "MC" | "LC";
  aggregation: "mean" | "median";
};

export type MomentumMatrixSlice = {
  schema_version?: string;
  mode?: "latest_available";
  date: string | null;
  latest_date?: string;
  country: string;
  cap: string;
  aggregation: string;
  rows: string[];
  columns: string[];
  sort_feature_families: Record<string, string>;
  as_of_dates: Array<Array<string | null>>;
  values: Array<Array<number | null>>;
  q1_values: Array<Array<number | null>>;
  q5_values: Array<Array<number | null>>;
  n_total: Array<Array<number | null>>;
  n_q1: Array<Array<number | null>>;
  n_q5: Array<Array<number | null>>;
  min_sort_value_q1: Array<Array<number | null>>;
  max_sort_value_q1: Array<Array<number | null>>;
  min_sort_value_q5: Array<Array<number | null>>;
  max_sort_value_q5: Array<Array<number | null>>;
};

const metadataSchema = z.object({
  schema_version: z.string().optional(),
  latest_date: z.string().optional(),
  dates: z.array(z.string()).default([]),
  countries: z.array(z.string()).default([]),
  caps: z.array(z.string()).default([]),
  aggregations: z.array(z.string()).default([]),
  sort_features: z.array(z.string()).default([]),
  target_horizons: z.array(z.string()).default([]),
});

const matrixQuerySchema = z.object({
  date: z.string().optional(),
  country: z.string().default("ALL"),
  cap: z.enum(["ALL", "SC", "MC", "LC"]).default("ALL"),
  aggregation: z.enum(["mean", "median"]).default("mean"),
});

const matrixSliceSchema = z.object({
  schema_version: z.string().optional(),
  mode: z.literal("latest_available").optional(),
  date: z.string().nullable(),
  latest_date: z.string().optional(),
  country: z.string(),
  cap: z.string(),
  aggregation: z.string(),
  rows: z.array(z.string()),
  columns: z.array(z.string()),
  sort_feature_families: z.record(z.string(), z.string()).default({}),
  as_of_dates: z.array(z.array(z.string().nullable())).default([]),
  values: z.array(z.array(z.number().nullable())),
  q1_values: z.array(z.array(z.number().nullable())).default([]),
  q5_values: z.array(z.array(z.number().nullable())).default([]),
  n_total: z.array(z.array(z.number().nullable())).default([]),
  n_q1: z.array(z.array(z.number().nullable())).default([]),
  n_q5: z.array(z.array(z.number().nullable())).default([]),
  min_sort_value_q1: z.array(z.array(z.number().nullable())).default([]),
  max_sort_value_q1: z.array(z.array(z.number().nullable())).default([]),
  min_sort_value_q5: z.array(z.array(z.number().nullable())).default([]),
  max_sort_value_q5: z.array(z.array(z.number().nullable())).default([]),
});

export class NimlothApiError extends Error {
  status: number;
  body: string;
  kind: "auth" | "unavailable" | "temporary" | "upstream";

  constructor(status: number, body: string) {
    super(`Nimloth API error ${status}: ${body}`);
    this.status = status;
    this.body = body;
    this.kind =
      status === 401
        ? "auth"
        : status === 404
          ? "unavailable"
          : status === 503
            ? "temporary"
            : "upstream";
  }
}

function readEnv() {
  return envSchema.parse({
    NIMLOTH_DATA_API_BASE_URL: process.env.NIMLOTH_DATA_API_BASE_URL,
    NIMLOTH_DATA_API_KEY: process.env.NIMLOTH_DATA_API_KEY,
  });
}

function getApiConfig() {
  const env = readEnv();

  if (!env.NIMLOTH_DATA_API_BASE_URL) {
    throw new Error("NIMLOTH_DATA_API_BASE_URL is required.");
  }

  if (!env.NIMLOTH_DATA_API_KEY) {
    throw new Error("NIMLOTH_DATA_API_KEY is required.");
  }

  return {
    baseUrl: env.NIMLOTH_DATA_API_BASE_URL,
    apiKey: env.NIMLOTH_DATA_API_KEY,
  };
}

async function nimlothFetchJson<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: { timeoutMs?: number },
) {
  const { baseUrl, apiKey } = getApiConfig();
  const controller = new AbortController();
  const timeoutMs = init?.timeoutMs ?? 8_000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new NimlothApiError(response.status, body);
    }

    const payload = await response.json();
    return schema.parse(payload);
  } finally {
    clearTimeout(timeout);
  }
}

const getCachedMomentumMetadata = unstable_cache(
  async () =>
    nimlothFetchJson("/v1/momentum-matrix/metadata", metadataSchema, {
      timeoutMs: 8_000,
    }),
  ["nimloth-momentum-metadata"],
  {
    revalidate: 300,
  },
);

export async function getMomentumMetadata(): Promise<MomentumMetadata> {
  if (process.env.NODE_ENV === "test") {
    return (await nimlothFetchJson(
      "/v1/momentum-matrix/metadata",
      metadataSchema,
      {
        timeoutMs: 8_000,
      },
    )) as MomentumMetadata;
  }

  return (await getCachedMomentumMetadata()) as MomentumMetadata;
}

export async function getLatestMomentumMatrix(
  query?: Partial<MomentumMatrixQuery>,
): Promise<MomentumMatrixSlice> {
  const parsed = matrixQuerySchema.parse(query ?? {});
  const params = new URLSearchParams({
    country: parsed.country,
    cap: parsed.cap,
    aggregation: parsed.aggregation,
  });

  return (await nimlothFetchJson(
    `/v1/momentum-matrix/latest?${params.toString()}`,
    matrixSliceSchema,
    { timeoutMs: 8_000 },
  )) as MomentumMatrixSlice;
}

export async function getMomentumMatrix(
  query: MomentumMatrixQuery,
): Promise<MomentumMatrixSlice> {
  const parsed = matrixQuerySchema.parse(query);

  if (!parsed.date) {
    throw new Error("date is required when requesting a historical momentum matrix.");
  }

  const params = new URLSearchParams({
    date: parsed.date,
    country: parsed.country,
    cap: parsed.cap,
    aggregation: parsed.aggregation,
  });

  return (await nimlothFetchJson(
    `/v1/momentum-matrix?${params.toString()}`,
    matrixSliceSchema,
    { timeoutMs: 8_000 },
  )) as MomentumMatrixSlice;
}
