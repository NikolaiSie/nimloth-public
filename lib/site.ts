/** The production address. Link previews and share links always point here, even from nonprod. */
export const SITE_URL = "https://nimlothcapital.com";

export function articleUrl(slug: string) {
  return `${SITE_URL}/research/${slug}`;
}
