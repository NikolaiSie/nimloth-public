describe("next config security headers", () => {
  it("defines a baseline CSP and related browser hardening headers", async () => {
    // @ts-expect-error Next config is a JavaScript ESM file without a TypeScript declaration.
    const { default: nextConfig } = await import("../next.config.mjs");
    const headerRules = await nextConfig.headers();

    expect(headerRules).toHaveLength(1);
    expect(headerRules[0].source).toBe("/(.*)");
    expect(headerRules[0].headers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "Content-Security-Policy",
          value: expect.stringContaining("default-src 'self'"),
        }),
        expect.objectContaining({
          key: "Content-Security-Policy",
          value: expect.stringContaining("object-src 'none'"),
        }),
        expect.objectContaining({
          key: "Content-Security-Policy",
          value: expect.stringContaining("frame-ancestors 'none'"),
        }),
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
      ]),
    );
  });
});
