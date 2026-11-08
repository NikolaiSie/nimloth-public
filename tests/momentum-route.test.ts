import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const originalEnv = process.env;

const metadataPayload = {
  latest_date: "2026-09-10",
  dates: ["2026-09-08", "2026-09-10"],
  countries: ["ALL", "US", "DE", "XX"],
  country_names: { ALL: "All countries", US: "United States", DE: "Germany", XX: null },
  caps: ["ALL", "LC"],
  aggregations: ["mean", "median", "weighted_mean"],
  sort_features: ["momentum_1d"],
  target_horizons: ["forward_return_1d", "forward_return_1m"],
};

function matrixPayload(date: string | null) {
  return {
    schema_version: "v1",
    date,
    country: "ALL",
    cap: "ALL",
    aggregation: "median",
    rows: ["momentum_1d"],
    columns: ["forward_return_1d"],
    sort_feature_families: { momentum_1d: "momentum" },
    as_of_dates: [[date]],
    values: [[0.12]],
    q1_values: [[-0.03]],
    q5_values: [[0.09]],
    n_total: [[100]],
    n_q1: [[20]],
    n_q5: [[20]],
    min_sort_value_q1: [[-0.5]],
    max_sort_value_q1: [[-0.2]],
    min_sort_value_q5: [[0.2]],
    max_sort_value_q5: [[0.6]],
  };
}

async function loadRoute() {
  const route = await import("@/app/api/research/momentum/route");
  return route.GET;
}

/**
 * Serves metadata and slices. Like the data API, every "Latest" response lists
 * the countries with data (`withData`; null mimics an API that does not).
 */
function stubApi(slice: () => unknown, withData: string[] | null = ["ALL", "US"]) {
  const fetchMock = vi.fn(async (url: string) => {
    const parsed = new URL(url);
    if (parsed.pathname.endsWith("/metadata")) {
      return { ok: true, json: async () => metadataPayload };
    }
    const isLatest = parsed.pathname.endsWith("/latest");
    return {
      ok: true,
      json: async () => ({
        ...(slice() as object),
        ...(isLatest && withData ? { countries_with_data: withData } : {}),
      }),
    };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("momentum research route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      NODE_ENV: "test",
      NIMLOTH_DATA_API_BASE_URL: "https://data.example.internal",
      NIMLOTH_DATA_API_KEY: "top-secret",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("uses the latest private endpoint when no date is selected", async () => {
    const fetchMock = stubApi(() => ({
          ...matrixPayload(null),
          mode: "latest_available",
          latest_date: "2026-09-10",
        }));

    const GET = await loadRoute();
    const response = await GET(
      new NextRequest("https://site.example/api/research/momentum?country=ALL&cap=ALL&aggregation=median"),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://data.example.internal/v1/momentum-matrix/latest?country=ALL&cap=ALL&aggregation=median",
      expect.objectContaining({ method: "GET" }),
    );
    expect(payload.filters.date).toBeNull();
  });

  it("treats date=LATEST as the latest private endpoint", async () => {
    const fetchMock = stubApi(() => ({
          ...matrixPayload(null),
          mode: "latest_available",
          latest_date: "2026-09-10",
        }));

    const GET = await loadRoute();
    const response = await GET(
      new NextRequest("https://site.example/api/research/momentum?date=LATEST&country=ALL&cap=ALL&aggregation=median"),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://data.example.internal/v1/momentum-matrix/latest?country=ALL&cap=ALL&aggregation=median",
      expect.objectContaining({ method: "GET" }),
    );
    expect(payload.filters.date).toBeNull();
  });

  it("uses the historical private endpoint when a concrete date is selected", async () => {
    const fetchMock = stubApi(() => ({
          ...matrixPayload("2026-09-08"),
          mode: "date_snapshot",
          latest_date: null,
        }));

    const GET = await loadRoute();
    const response = await GET(
      new NextRequest("https://site.example/api/research/momentum?date=2026-09-08&country=ALL&cap=ALL&aggregation=median"),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://data.example.internal/v1/momentum-matrix?date=2026-09-08&country=ALL&cap=ALL&aggregation=median",
      expect.objectContaining({ method: "GET" }),
    );
    expect(payload.filters.date).toBe("2026-09-08");
    expect(payload.matrix.date).toBe("2026-09-08");
  });
  it("passes weighted_mean aggregation through to the data API", async () => {
    const fetchMock = stubApi(() => ({
          ...matrixPayload(null),
          aggregation: "weighted_mean",
          mode: "latest_available",
          latest_date: "2026-09-10",
        }));

    const GET = await loadRoute();
    const response = await GET(
      new NextRequest("https://site.example/api/research/momentum?country=ALL&cap=ALL&aggregation=weighted_mean"),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://data.example.internal/v1/momentum-matrix/latest?country=ALL&cap=ALL&aggregation=weighted_mean",
      expect.objectContaining({ method: "GET" }),
    );
    expect(payload.filters.aggregation).toBe("weighted_mean");
    expect(payload.matrix.aggregation).toBe("weighted_mean");
  });

  it("lists only countries with data in the Latest call, reusing that call", async () => {
    const fetchMock = stubApi(() => ({ ...matrixPayload(null), mode: "latest_available" }));

    const GET = await loadRoute();
    const response = await GET(new NextRequest("https://site.example/api/research/momentum"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.metadata.countries).toEqual(["ALL", "US"]);
    expect(payload.metadata.country_names).toEqual({ ALL: "All countries", US: "United States" });
    const latestCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes("/latest"));
    expect(latestCalls).toHaveLength(1);
  });

  it("takes the country list from the default Latest call for a dated view", async () => {
    const fetchMock = stubApi(() => matrixPayload("2026-09-08"));

    const GET = await loadRoute();
    const response = await GET(
      new NextRequest("https://site.example/api/research/momentum?date=2026-09-08&country=US"),
    );
    const payload = await response.json();

    expect(payload.metadata.countries).toEqual(["ALL", "US"]);
    const latestCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes("/latest"));
    expect(latestCalls).toHaveLength(1);
    expect(Object.fromEntries(new URL(String(latestCalls[0][0])).searchParams)).toEqual({
      country: "ALL",
      cap: "ALL",
      aggregation: "weighted_mean",
    });
  });

  it("keeps every country when the Latest call does not list them", async () => {
    stubApi(() => ({ ...matrixPayload(null), mode: "latest_available" }), null);

    const GET = await loadRoute();
    const response = await GET(new NextRequest("https://site.example/api/research/momentum"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.metadata.countries).toEqual(["ALL", "US", "DE", "XX"]);
  });
});
