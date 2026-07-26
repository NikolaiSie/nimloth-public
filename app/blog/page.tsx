import { ArticleCard } from "@/components/article-card";
import { getContentIndex } from "@/lib/content";

export const metadata = {
  title: "Blog",
  description: "Short-form updates from Nimloth Capital.",
};

export default async function BlogIndexPage() {
  const posts = await getContentIndex("blog");

  return (
    <div className="container">
      <section className="page-hero">
        <p className="eyebrow" style={{ color: "var(--accent)" }}>
          Blog
        </p>
        <h1>Short notes from the build.</h1>
        <p>
          This section is for implementation updates, infrastructure choices,
          and shorter lessons that do not need a full research treatment.
        </p>
      </section>
      <section className="section">
        <div className="article-list">
          {posts.map((post) => (
            <ArticleCard key={post.slug} article={post} basePath="blog" />
          ))}
        </div>
      </section>
    </div>
  );
}
