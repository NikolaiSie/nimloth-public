function normalizeHost(host: string) {
  return host.split(",")[0].trim().toLowerCase();
}

export function getCanonicalRedirectUrl({
  canonicalOrigin,
  requestHost,
  requestUrl,
}: {
  canonicalOrigin?: string;
  requestHost: string | null;
  requestUrl: URL;
}) {
  if (!canonicalOrigin || !requestHost) {
    return null;
  }

  const canonicalUrl = new URL(canonicalOrigin);

  if (normalizeHost(requestHost) === canonicalUrl.host.toLowerCase()) {
    return null;
  }

  canonicalUrl.pathname = requestUrl.pathname;
  canonicalUrl.search = requestUrl.search;
  canonicalUrl.hash = "";

  return canonicalUrl;
}
