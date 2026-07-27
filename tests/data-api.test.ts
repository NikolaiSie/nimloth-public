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
    delete process.env.NIMLOTH_DATA_API_BASE_URL;
    delete process.env.NIMLOTH_DATA_API_KEY;
    const { getMarketSnapshot } = await import("@/lib/data-api");

    await expect(getMarketSnapshot()).resolves.toMatchObject({
      status: "degraded",
      headline: "Data API health check unavailable in local",
    });
  });

  it("checks the metadata endpoint with the shared secret in local mode", async () => {
    process.env.NIMLOTH_DATA_API_BASE_URL = "https://data.example.internal";
    process.env.NIMLOTH_DATA_API_KEY = "top-secret";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        latest_date: "2026-07-25",
        available_dates: ["2026-07-24", "2026-07-25"],
        updated_at: "2026-07-27T02:00:00.000Z",
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
    expect(result.headline).toBe("Data API metadata auth passed in local");
    expect(result.points).toContain("Latest date: 2026-07-25");
  });

  it("detects nonprod from the cloud project id", async () => {
    process.env.GOOGLE_CLOUD_PROJECT = "nimloth-public-nonprod";
    process.env.NIMLOTH_DATA_API_BASE_URL = "https://data.example.internal";
    process.env.NIMLOTH_DATA_API_KEY = "top-secret";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          latest_date: "2026-07-25",
          available_dates: ["2026-07-25"],
        }),
      }),
    );

    const { getMarketSnapshot } = await import("@/lib/data-api");
    const result = await getMarketSnapshot();

    expect(result.headline).toBe("Data API metadata auth passed in nonprod");
  });

  it("includes upstream status code and body in server-side errors", async () => {
    process.env.NIMLOTH_DATA_API_BASE_URL = "https://data.example.internal";
    process.env.NIMLOTH_DATA_API_KEY = "top-secret";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => "forbidden",
      }),
    );

    const { getMarketSnapshot } = await import("@/lib/data-api");

    await expect(getMarketSnapshot()).rejects.toThrow(
      "Nimloth API error 403: forbidden",
    );
  });
});
