import { vi } from "vitest";

const requestHeadersMock = vi.fn();
const getIdTokenClientMock = vi.fn();

vi.mock("google-auth-library", () => ({
  GoogleAuth: vi.fn().mockImplementation(() => ({
    getIdTokenClient: getIdTokenClientMock,
  })),
}));

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
    process.env.DATA_API_BASE_URL = "https://data.example.internal";
    process.env.DATA_API_AUDIENCE = "https://data.example.internal";

    requestHeadersMock.mockResolvedValue({
      authorization: "Bearer id-token",
    });
    getIdTokenClientMock.mockResolvedValue({
      getRequestHeaders: requestHeadersMock,
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "healthy",
        asOf: "2026-07-26T00:00:00.000Z",
        headline: "Live snapshot",
        summary: "Loaded from private API",
        points: [],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const { getMarketSnapshot } = await import("@/lib/data-api");
    const result = await getMarketSnapshot();

    expect(getIdTokenClientMock).toHaveBeenCalledWith("https://data.example.internal");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://data.example.internal/public/market-snapshot",
      expect.objectContaining({
        method: "GET",
      }),
    );
    expect(result.headline).toBe("Live snapshot");
  });
});
