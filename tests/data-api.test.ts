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

  it("returns mock data by default", async () => {
    delete process.env.DATA_API_MODE;
    const { getMarketSnapshot } = await import("@/lib/data-api");

    await expect(getMarketSnapshot()).resolves.toMatchObject({
      status: "healthy",
      headline: "Mock market signal path is online",
    });
  });

  it("uses an identity token in live mode when an audience is configured", async () => {
    process.env.DATA_API_MODE = "live";
    process.env.NIMLOTH_DATA_API_BASE_URL = "https://data.example.internal";
    process.env.NIMLOTH_DATA_API_KEY = "top-secret";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        latest_date: "2026-07-25",
        updated_at: "2026-07-26T00:00:00.000Z",
      }),
    });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        latest_date: "2026-07-25",
        updated_at: "2026-07-26T00:00:00.000Z",
      }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        date: "2026-07-25",
        aggregation: "mean",
        country: "ALL",
        cap: "ALL",
        value: 0.1234,
        signal: -0.4567,
        observations: 250,
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const { getMarketSnapshot } = await import("@/lib/data-api");
    const result = await getMarketSnapshot();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://data.example.internal/v1/momentum-matrix/metadata",
      expect.objectContaining({
        method: "GET",
        headers: {
          "X-API-Key": "top-secret",
        },
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://data.example.internal/v1/momentum-matrix/latest?country=ALL&cap=ALL&aggregation=mean",
      expect.objectContaining({
        method: "GET",
        headers: {
          "X-API-Key": "top-secret",
        },
      }),
    );
    expect(result.headline).toBe("Momentum matrix latest snapshot");
    expect(result.points).toContain("Value: 0.1234");
  });
});
