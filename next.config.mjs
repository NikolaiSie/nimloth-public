// React uses eval() in development only, to rebuild error call stacks. Production never allows it.
const scriptSrc =
  process.env.NODE_ENV === "development"
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";

const renamedPosts = {
  "cleaning-the-covariance-matrix": "risk-without-factors",
  momentum: "momentum-in-global-data",
  "why-i-am-building-nimloth": "systematics-from-end-to-end",
};

/** @type {import("next").NextConfig} */
const contentSecurityPolicy = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // Posts were renamed to match their titles. Keep links shared under the old slugs working.
  async redirects() {
    return Object.entries(renamedPosts).flatMap(([from, to]) => [
      { source: `/research/${from}`, destination: `/research/${to}`, permanent: true },
      { source: `/blog/${from}`, destination: `/research/${to}`, permanent: true },
      { source: `/blog/${from}/:file`, destination: `/blog/${to}/:file`, permanent: true },
    ]);
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
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
        ],
      },
    ];
  },
};

export default nextConfig;
