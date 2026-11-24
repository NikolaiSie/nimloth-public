import { renderSocialCard, SOCIAL_CARD_SIZE, SOCIAL_CARD_TYPE } from "@/lib/social-card";

// The link preview for every page without its own card (home, the article lists, about).
export const alt = "Nimloth Capital: independent quantitative research and engineering";
export const size = SOCIAL_CARD_SIZE;
export const contentType = SOCIAL_CARD_TYPE;

export default async function Image() {
  return renderSocialCard({
    title: "Systematic investing, from data to trading",
    summary: "Independent quantitative research and engineering: data, infrastructure, research, risk, optimization and trading.",
  });
}
