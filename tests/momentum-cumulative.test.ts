import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildCumulativeSeries,
  formatCapLabel,
  formatSignalLabel,
  marketOptions,
  monthlyReturnsFromSeries,
} from "@/lib/momentum-cumulative";

describe("buildCumulativeSeries", () => {
  it("compounds monthly spreads", () => {
    const { points } = buildCumulativeSeries([
      { date: "2010-01-04", spread: 0.1 },
      { date: "2010-02-01", spread: -0.1 },
      { date: "2010-03-01", spread: 0.05 },
    ]);

    expect(points.map((point) => point.cumulative)).toEqual([
      expect.closeTo(0.1, 10),
      expect.closeTo(-0.01, 10),
      expect.closeTo(0.0395, 10),
    ]);
  });

  it("drops leading and trailing gaps and reports gaps in the middle", () => {
    const series = buildCumulativeSeries([
      { date: "2010-01-04", spread: null },
      { date: "2010-02-01", spread: 0.1 },
      { date: "2010-03-01", spread: null },
      { date: "2010-04-01", spread: 0.1 },
      { date: "2010-05-03", spread: null },
    ]);

    expect(series.points.map((point) => point.date)).toEqual(["2010-02-01", "2010-04-01"]);
    expect(series.points.at(-1)?.cumulative).toBeCloseTo(0.21, 10);
    expect(series.skippedDates).toEqual(["2010-03-01"]);
  });
});

describe("monthlyReturnsFromSeries", () => {
  const series = {
    dates: ["2009-12-01", "2010-01-04", "2010-02-01"],
    signals: ["momentum_1m", "momentum_12m_ex_1m"],
    values: [
      [0.5, 0.5, 0.5],
      [0.2, 0.1, null],
    ],
  };

  it("reads one signal's spreads from the start date on", () => {
    expect(monthlyReturnsFromSeries(series, "momentum_12m_ex_1m", "2010-01-01")).toEqual([
      { date: "2010-01-04", spread: 0.1 },
      { date: "2010-02-01", spread: null },
    ]);
  });

  it("returns nothing for a signal the series does not publish", () => {
    expect(monthlyReturnsFromSeries(series, "skewness_1y", "2000-01-01")).toEqual([]);
  });
});

describe("labels", () => {
  it("spells out signals", () => {
    expect(formatSignalLabel("momentum_12m_ex_1m")).toBe("12 months ex 1 month");
    expect(formatSignalLabel("momentum_1d")).toBe("1 day return");
    expect(formatSignalLabel("momentum_2w")).toBe("2 weeks return");
    expect(formatSignalLabel("momentum_5y")).toBe("5 years return");
    expect(formatSignalLabel("skewness_1y")).toBe("1 year return skewness");
    expect(formatSignalLabel("ma_20d_to_100d")).toBe("MA 20d / 100d");
  });

  it("names markets from the published country names, all countries first", () => {
    expect(
      marketOptions(["ALL", "US", "KR", "XX"], { ALL: "All countries", US: "United States", KR: "South Korea" }),
    ).toEqual([
      { value: "ALL", label: "All countries" },
      { value: "KR", label: "South Korea" },
      { value: "US", label: "United States" },
      { value: "XX", label: "XX" },
    ]);
    expect(marketOptions(["ALL"])).toEqual([{ value: "ALL", label: "All countries" }]);
    expect(formatCapLabel("LC")).toBe("Large caps");
  });
});

const originalEnv = process.env;

const metadataPayload = {
  latest_date: "2010-04-15",
  dates: ["2010-01-04", "2010-04-15"],
  countries: ["ALL", "US"],
  country_names: { ALL: "All countries", US: "United States" },
  caps: ["ALL", "LC"],
  aggregations: ["mean", "median", "weighted_mean"],
  sort_features: ["momentum_12m_ex_1m", "level_to_ma_200d"],
  target_horizons: ["forward_return_1d", "forward_return_1m"],
};

function seriesPayload(country: string, cap: string, aggregation: string) {
  return {
    schema_version: "v1",
    country,
    country_name: "All countries",
    cap,
    aggregation,
    target_horizon: "forward_return_1m",
    rebalance: "first_trading_day_of_month",
    dates: ["2009-12-01", "2010-01-04", "2010-02-01", "2010-03-01", "2010-04-01"],
    signals: ["momentum_12m_ex_1m", "level_to_ma_200d"],
    values: [
      [0.9, 0.1, 0.1, -0.5, null],
      [0, 0, 0, 0, null],
    ],
    n_total: [
      [1, 1, 1, 1, null],
      [1, 1, 1, 1, null],
    ],
  };
}

/** A "Latest" slice with one value, so the probed country counts as having data. */
function latestPayload(country: string) {
  return {
    date: null,
    country,
    cap: "ALL",
    aggregation: "weighted_mean",
    rows: ["momentum_12m_ex_1m"],
    columns: ["forward_return_1m"],
    values: [[0.01]],
  };
}

describe("cumulative momentum route", () => {
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

  function stubApi() {
    const fetchMock = vi.fn(async (url: string) => {
      const parsed = new URL(url);
      if (parsed.pathname.endsWith("/metadata")) {
        return { ok: true, json: async () => metadataPayload };
      }
      const params = parsed.searchParams;
      if (parsed.pathname.endsWith("/latest")) {
        return { ok: true, json: async () => latestPayload(params.get("country") ?? "") };
      }
      return {
        ok: true,
        json: async () =>
          seriesPayload(params.get("country") ?? "", params.get("cap") ?? "", params.get("aggregation") ?? ""),
      };
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  async function get(query: string) {
    const { GET } = await import("@/app/api/research/momentum/cumulative/route");
    return GET(new NextRequest(`https://site.example/api/research/momentum/cumulative?${query}`));
  }

  it("defaults to 2010 / ALL / ALL / 12-1 / weighted_mean with one series request", async () => {
    const fetchMock = stubApi();
    const response = await get("");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.filters).toEqual({
      country: "ALL",
      cap: "ALL",
      aggregation: "weighted_mean",
      signal: "momentum_12m_ex_1m",
      start: "2010-01-01",
    });
    expect(body.options.signals).toEqual(["momentum_12m_ex_1m"]);
    expect(body.options.countryNames).toEqual({ ALL: "All countries", US: "United States" });

    const seriesCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes("/series"));
    expect(seriesCalls).toHaveLength(1);
    const params = new URL(String(seriesCalls[0][0])).searchParams;
    expect(Object.fromEntries(params)).toEqual({
      country: "ALL",
      cap: "ALL",
      aggregation: "weighted_mean",
      horizon: "forward_return_1m",
    });

    // 2009-12 is before the start; 2010-04 has no completed forward return yet.
    expect(body.points.map((point: { date: string }) => point.date)).toEqual([
      "2010-01-04",
      "2010-02-01",
      "2010-03-01",
    ]);
    expect(body.points.at(-1).cumulative).toBeCloseTo(1.1 * 1.1 * 0.5 - 1, 10);
  });

  it("rejects hidden or unknown signals, unknown markets and bad dates", async () => {
    stubApi();
    expect((await get("signal=level_to_ma_200d")).status).toBe(400);
    expect((await get("signal=momentum_99y")).status).toBe(400);
    expect((await get("country=ZZ")).status).toBe(400);
    expect((await get("start=not-a-date")).status).toBe(400);
  });

  it("reports a missing series as unavailable for that slice", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        String(url).includes("/metadata")
          ? { ok: true, json: async () => metadataPayload }
          : String(url).includes("/latest")
            ? { ok: true, json: async () => latestPayload(new URL(url).searchParams.get("country") ?? "") }
            : { ok: false, status: 404, text: async () => "Series not found" },
      ),
    );
    const response = await get("country=US&cap=LC");
    expect(response.status).toBe(404);
  });
});
