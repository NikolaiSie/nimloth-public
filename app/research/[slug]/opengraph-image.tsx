import { getContentBySlug, getContentIndex } from "@/lib/content";
import { renderSocialCard, SOCIAL_CARD_SIZE, SOCIAL_CARD_TYPE } from "@/lib/social-card";

// Each post's link preview: its title and summary on a Nimloth card, generated at build time.
export const alt = "Nimloth Capital research article";
export const size = SOCIAL_CARD_SIZE;
export const contentType = SOCIAL_CARD_TYPE;

export async function generateStaticParams() {
  const [research, posts] = await Promise.all([getContentIndex("research"), getContentIndex("blog")]);
  const slugs = new Set([...research, ...posts].map((article) => article.slug));
  return Array.from(slugs, (slug) => ({ slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = (await getContentBySlug("research", slug)) ?? (await getContentBySlug("blog", slug));

  if (!article) {
    return renderSocialCard({ title: "Nimloth Capital", summary: "Independent quantitative research and engineering." });
  }

  return renderSocialCard({
    // The site labels every post "Blog" (see page.tsx).
    eyebrow: `Blog · ${article.publishedAtLabel}`,
    title: article.title,
    summary: article.summary,
  });
}
