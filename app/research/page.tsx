import { ArticleCard } from "@/components/article-card";
import { compareBlogCardOrder, getContentIndex } from "@/lib/content";

export const metadata = {
  title: "Blog",
  description: "Public projects and field notes from Nimloth Capital.",
};

export default async function ResearchIndexPage() {
  const [research, posts] = await Promise.all([
    getContentIndex("research"),
    getContentIndex("blog"),
  ]);
  const entries = [...research, ...posts].sort(compareBlogCardOrder);

  return (
    <div className="container">
      <section className="page-hero">
        <p className="eyebrow">Blog / Evidence / Field notes</p>
        <div className="page-hero__grid">
          <h2>
            Notes on market phenomena, implementation work, and the evidence trail behind Nimloth strategies.
          </h2>
        </div>
      </section>
      {entries.length > 0 ? (
        <section className="section blog-index__entries">
          <div className="article-list">
            {entries.map((article) => (
              <ArticleCard
                key={article.slug}
                article={article}
                basePath="research"
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
