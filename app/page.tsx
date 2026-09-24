import Link from "next/link";
import { ArticleCard } from "@/components/article-card";
import { SectionHeading } from "@/components/section-heading";
import { compareBlogCardOrder, getFeaturedPosts } from "@/lib/content";

export default async function HomePage() {
  const [featuredPosts, featuredResearch] = await Promise.all([
    getFeaturedPosts("blog", 2),
    getFeaturedPosts("research", 2),
  ]);
  const featuredEntries = [...featuredResearch, ...featuredPosts].sort(
    compareBlogCardOrder,
  );

  return (
    <>
      <section className="hero">
        <div className="container hero__grid hero__grid--single">
          <div className="hero-card">
            <h1>
              Market insights
              <span>with academic rigor.</span>
            </h1>
            <p>
              Nimloth Capital is a research program in market data, artificial intelligence,
              and quantitative trading. This is the public record of the work: methods,
              results, and the systems beneath them.
            </p>
            <div className="hero-actions">
              <Link className="button-link" href="/research">
                Read the blog
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--mandate" id="about">
        <div className="container mandate">
          <div className="mandate__heading">
            <p className="eyebrow">About</p>
            <h2>Building Nimloth</h2>
            <img
              className="mandate__portrait"
              src="/C0BAA8F7-94F3-42CE-9D08-5E2A5F4D3E3A.jpeg"
              alt="Nikolai Sie"
            />
            <a className="mandate__email" href="mailto:nikolai.sie@gmail.com">
              nikolai.sie@gmail.com
            </a>
          </div>
          <div className="mandate__intro">
            <p>
              I spent the past 8 years trading and managing a $15 billion
              Emerging Markets equity portfolio for Norway&apos;s $2 trillion
              Sovereign Wealth Fund. Now I&apos;m returning to school to create my
              own quantitative equity strategy. Columbia&apos;s dual MBA and MS
              Engineering program will be my place to experiment and build
              before returning to the workforce, and this site is the place
              where I write about any novel problems that come up along the way.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            title="Blog"
            description="Live projects, field notes, and engineering updates from the work."
            link={{ href: "/research", label: "View blog" }}
          />
          <div className="article-list">
            {featuredEntries.map((article) => (
              <ArticleCard
                key={article.slug}
                article={article}
                basePath="research"
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
