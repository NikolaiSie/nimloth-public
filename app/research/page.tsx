import { ArticleCard } from "@/components/article-card";
import { getContentIndex } from "@/lib/content";

export const metadata = {
  title: "Research",
  description: "Long-form public research from Nimloth Capital.",
};

export default async function ResearchIndexPage() {
  const research = await getContentIndex("research");

  return (
    <div className="container">
      <section className="page-hero">
        <p className="eyebrow" style={{ color: "var(--accent)" }}>
          Research
        </p>
        <h1>Long-form work, not just updates.</h1>
        <p>
          Research pieces are where assumptions are forced into the open. This
          is where infrastructure and quantitative ideas are meant to withstand
          scrutiny.
        </p>
      </section>
      <section className="section">
        <div className="article-list">
          {research.map((article) => (
            <ArticleCard
              key={article.slug}
              article={article}
              basePath="research"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
