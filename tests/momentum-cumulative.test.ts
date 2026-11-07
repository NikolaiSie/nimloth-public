import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildCumulativeSeries,
  pickMonthlyRebalanceDates,
} from "@/lib/momentum-cumulative";

describe("pickMonthlyRebalanceDates", () => {
  it("picks the first usable date per month inside the range", () => {
    const dates = [
      "2010-01-01", // Jan 1 holiday, excluded
      "2010-01-02", // Saturday, excluded
      "2010-01-04",
      "2010-01-05",
      "2010-02-01",
      "2010-02-02",
      "2010-03-01",
    ];

    expect(pickMonthlyRebalanceDates(dates, "2010-01-01", "2010-02-28")).toEqual([
      "2010-01-04",
      "2010-02-01",
    ]);
  });

  it("never picks Dec 25 or weekends, and sorts unsorted input", () => {
    const dates = ["2020-12-28", "2020-12-25", "2020-12-26", "2021-01-04"];

    expect(pickMonthlyRebalanceDates(dates, "2020-12-01", "2021-01-31")).toEqual([
      "2020-12-28",
      "2021-01-04",
    ]);
  });
});

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

const originalEnv = process.env;

const metadataPayload = {
  latest_date: "2010-04-15",
  dates: ["2010-01-04", "2010-01-05", "2010-02-01", "2010-03-01", "2010-04-01", "2010-04-15"],
  countries: ["ALL", "US"],
  caps: ["ALL", "LC"],
  aggregations: ["mean", "median", "weighted_mean"],
  sort_features: ["momentum_12m_ex_1m", "level_to_ma_200d"],
  target_horizons: ["forward_return_1d", "forward_return_1m"],
};

const spreadsByDate: Record<string, number | null> = {
  "2010-01-04": 0.1,
  "2010-02-01": 0.1,
  "2010-03-01": -0.5,
  "2010-04-01": null,
};

function matrixPayload(date: string) {
  return {
    date,
    country: "ALL",
    cap: "ALL",
    aggregation: "weighted_mean",
    rows: ["momentum_12m_ex_1m"],
    columns: ["forward_return_1d", "forward_return_1m"],
    values: [[0.001, spreadsByDate[date] ?? null]],
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
      return { ok: true, json: async () => matrixPayload(parsed.searchParams.get("date") ?? "") };
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  async function get(query: string) {
    const { GET } = await import("@/app/api/research/momentum/cumulative/route");
    return GET(new NextRequest(`https://site.example/api/research/momentum/cumulative?${query}`));
  }

  it("defaults to ALL / ALL / weighted_mean from 2010 and compounds one date per month", async () => {
    const fetchMock = stubApi();
    const response = await get("");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.filters).toMatchObject({
      country: "ALL",
      cap: "ALL",
      aggregation: "weighted_mean",
      signal: "momentum_12m_ex_1m",
      start: "2010-01-01",
      end: "2010-04-15",
    });
    expect(body.options.signals).toEqual(["momentum_12m_ex_1m"]);

    const requestedDates = fetchMock.mock.calls
      .map(([url]) => new URL(url).searchParams.get("date"))
      .filter(Boolean)
      .sort();
    expect(requestedDates).toEqual(["2010-01-04", "2010-02-01", "2010-03-01", "2010-04-01"]);
    expect(fetchMock.mock.calls.every(([url]) => !String(url).includes("2010-01-05"))).toBe(true);

    expect(body.points.map((point: { date: string }) => point.date)).toEqual([
      "2010-01-04",
      "2010-02-01",
      "2010-03-01",
    ]);
    expect(body.points.at(-1).cumulative).toBeCloseTo(1.1 * 1.1 * 0.5 - 1, 10);
  });

  it("rejects unknown signals and inverted ranges", async () => {
    stubApi();
    expect((await get("signal=level_to_ma_200d")).status).toBe(400);
    expect((await get("start=2010-03-01&end=2010-02-01")).status).toBe(400);
    expect((await get("start=not-a-date")).status).toBe(400);
  });
});
