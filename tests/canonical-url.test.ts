import { getCanonicalRedirectUrl } from "@/lib/canonical-url";

describe("getCanonicalRedirectUrl", () => {
  const requestUrl = new URL(
    "https://nimloth-public-prod-site.web.app/research?date=latest",
  );

  it("does not redirect outside production", () => {
    expect(
      getCanonicalRedirectUrl({
        requestHost: "localhost:3000",
        requestUrl,
      }),
    ).toBeNull();
  });

  it("does not redirect the canonical host", () => {
    expect(
      getCanonicalRedirectUrl({
        canonicalOrigin: "https://nimlothcapital.com",
        requestHost: "nimlothcapital.com",
        requestUrl,
      }),
    ).toBeNull();
  });

  it("redirects generated hosts while preserving path and query", () => {
    expect(
      getCanonicalRedirectUrl({
        canonicalOrigin: "https://nimlothcapital.com",
        requestHost: "nimloth-public-prod-site.web.app",
        requestUrl,
      })?.toString(),
    ).toBe("https://nimlothcapital.com/research?date=latest");
  });

  it("uses the first forwarded host supplied by a proxy", () => {
    expect(
      getCanonicalRedirectUrl({
        canonicalOrigin: "https://nimlothcapital.com",
        requestHost: "nimlothcapital.com, nimloth-public-web.a.run.app",
        requestUrl,
      }),
    ).toBeNull();
  });
});
