import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const originalEnv = process.env;

const metadataPayload = {
  latest_date: "2026-09-10",
  dates: ["2026-09-08", "2026-09-10"],
  countries: ["ALL", "US"],
  caps: ["ALL", "LC"],
  aggregations: ["mean", "median"],
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
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => metadataPayload,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...matrixPayload(null),
          mode: "latest_available",
          latest_date: "2026-09-10",
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const GET = await loadRoute();
    const response = await GET(
      new NextRequest("https://site.example/api/research/momentum?country=ALL&cap=ALL&aggregation=median"),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://data.example.internal/v1/momentum-matrix/latest?country=ALL&cap=ALL&aggregation=median",
      expect.objectContaining({ method: "GET" }),
    );
    expect(payload.filters.date).toBeNull();
  });

  it("treats date=LATEST as the latest private endpoint", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => metadataPayload,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...matrixPayload(null),
          mode: "latest_available",
          latest_date: "2026-09-10",
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const GET = await loadRoute();
    const response = await GET(
      new NextRequest("https://site.example/api/research/momentum?date=LATEST&country=ALL&cap=ALL&aggregation=median"),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://data.example.internal/v1/momentum-matrix/latest?country=ALL&cap=ALL&aggregation=median",
      expect.objectContaining({ method: "GET" }),
    );
    expect(payload.filters.date).toBeNull();
  });

  it("uses the historical private endpoint when a concrete date is selected", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => metadataPayload,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...matrixPayload("2026-09-08"),
          mode: "date_snapshot",
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const GET = await loadRoute();
    const response = await GET(
      new NextRequest("https://site.example/api/research/momentum?date=2026-09-08&country=ALL&cap=ALL&aggregation=median"),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://data.example.internal/v1/momentum-matrix?date=2026-09-08&country=ALL&cap=ALL&aggregation=median",
      expect.objectContaining({ method: "GET" }),
    );
    expect(payload.filters.date).toBe("2026-09-08");
    expect(payload.matrix.date).toBe("2026-09-08");
  });
});
