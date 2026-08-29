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
        <p className="eyebrow">Journal / Field notes</p>
        <div className="page-hero__grid">
          <h1>Notes from the workbench.</h1>
          <p>
            Lessons from building a quantitative research platform, and short notes on the novel complications in the work.
          </p>
        </div>
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
