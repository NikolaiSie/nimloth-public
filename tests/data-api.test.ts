import { vi } from "vitest";

describe("data api integration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns a degraded snapshot when credentials are missing", async () => {
    delete process.env.NIMLOTH_DATA_API_BASE_URL;
    delete process.env.NIMLOTH_DATA_API_KEY;
    const { getMarketSnapshot } = await import("@/lib/data-api");

    await expect(getMarketSnapshot()).resolves.toMatchObject({
      status: "degraded",
      headline: "Momentum API unavailable in local",
    });
  });

  it("loads metadata and the latest matrix in local mode", async () => {
    process.env.NIMLOTH_DATA_API_BASE_URL = "https://data.example.internal";
    process.env.NIMLOTH_DATA_API_KEY = "top-secret";

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          latest_date: "2026-07-25",
          dates: ["2026-07-24", "2026-07-25"],
          countries: ["ALL", "US"],
          caps: ["ALL", "LC"],
          aggregations: ["mean", "median"],
          sort_features: ["momentum_1d"],
          target_horizons: ["forward_return_1d"],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          date: "2026-07-25",
          country: "ALL",
          cap: "ALL",
          aggregation: "mean",
          rows: ["Value", "Quality"],
          columns: ["Momentum", "Volatility"],
          values: [
            [0.125, -0.25],
            [0.04, null],
          ],
          q1_values: [],
          q5_values: [],
          sort_feature_families: {
            Value: "family",
          },
          n_total: [[248, 247]],
          n_q1: [[49, 48]],
          n_q5: [[50, 49]],
          min_sort_value_q1: [[-1.2, -1.1]],
          max_sort_value_q1: [[0.1, 0.2]],
          min_sort_value_q5: [[0.9, 0.8]],
          max_sort_value_q5: [[2.1, 2.2]],
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    const { getMarketSnapshot } = await import("@/lib/data-api");
    const result = await getMarketSnapshot();

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://data.example.internal/v1/momentum-matrix/metadata",
      expect.objectContaining({
        method: "GET",
        headers: {
          "X-API-Key": "top-secret",
        },
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://data.example.internal/v1/momentum-matrix/latest?country=ALL&cap=ALL&aggregation=mean",
      expect.objectContaining({
        method: "GET",
        headers: {
          "X-API-Key": "top-secret",
        },
      }),
    );
    expect(result.headline).toBe("Latest momentum matrix loaded in local");
    expect(result.points).toContain("Date: 2026-07-25");
    expect(result.points).toContain("Matrix size: 2 x 2");
    expect(result.points).toContain("Strongest absolute spread: -0.2500");
  });

  it("detects nonprod from the cloud project id", async () => {
    process.env.GOOGLE_CLOUD_PROJECT = "nimloth-public-nonprod";
    process.env.NIMLOTH_DATA_API_BASE_URL = "https://data.example.internal";
    process.env.NIMLOTH_DATA_API_KEY = "top-secret";

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            latest_date: "2026-07-25",
            dates: ["2026-07-25"],
            countries: ["ALL"],
            caps: ["ALL"],
            aggregations: ["mean"],
            sort_features: ["momentum_1d"],
            target_horizons: ["forward_return_1d"],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            date: "2026-07-25",
            country: "ALL",
            cap: "ALL",
            aggregation: "mean",
            rows: ["Value"],
            columns: ["Momentum"],
            values: [[0.22]],
            q1_values: [],
            q5_values: [],
            sort_feature_families: {
              Value: "family",
            },
            n_total: [[100]],
            n_q1: [[20]],
            n_q5: [[20]],
            min_sort_value_q1: [[-1]],
            max_sort_value_q1: [[0]],
            min_sort_value_q5: [[1]],
            max_sort_value_q5: [[2]],
          }),
        }),
    );

    const { getMarketSnapshot } = await import("@/lib/data-api");
    const result = await getMarketSnapshot();

    expect(result.headline).toBe("Latest momentum matrix loaded in nonprod");
  });

  it("surfaces auth failure clearly", async () => {
    process.env.NIMLOTH_DATA_API_BASE_URL = "https://data.example.internal";
    process.env.NIMLOTH_DATA_API_KEY = "top-secret";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "unauthorized",
      }),
    );

    const { getMarketSnapshot } = await import("@/lib/data-api");

    await expect(getMarketSnapshot()).resolves.toMatchObject({
      status: "degraded",
      headline: "Momentum API auth failed in local",
    });
  });

  it("includes latest-slice unavailable messaging for 404 responses", async () => {
    process.env.NIMLOTH_DATA_API_BASE_URL = "https://data.example.internal";
    process.env.NIMLOTH_DATA_API_KEY = "top-secret";

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            latest_date: "2026-07-25",
            dates: ["2026-07-25"],
            countries: ["ALL"],
            caps: ["ALL"],
            aggregations: ["mean"],
            sort_features: ["momentum_1d"],
            target_horizons: ["forward_return_1d"],
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: async () => "not found",
        }),
    );

    const { getMarketSnapshot } = await import("@/lib/data-api");

    await expect(getMarketSnapshot()).resolves.toMatchObject({
      status: "degraded",
      headline: "Latest momentum slice unavailable in local",
    });
  });
});
