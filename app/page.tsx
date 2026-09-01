import Link from "next/link";
import { ArticleCard } from "@/components/article-card";
import { EntryCard } from "@/components/entry-card";
import { MarketPanel } from "@/components/market-panel";
import { SectionHeading } from "@/components/section-heading";
import { getFeaturedPosts } from "@/lib/content";

export default async function HomePage() {
  const [featuredPosts, featuredResearch] = await Promise.all([
    getFeaturedPosts("blog", 2),
    getFeaturedPosts("research", 1),
  ]);

  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero-card">
            <p className="eyebrow">Independent market research / 2026</p>
            <h1>
              Soft insight.
              <span>Hard rigor.</span>
            </h1>
            <p>
              Nimloth Capital is a two-year research program in market data, artificial intelligence,
              and quantitative trading that aims to spin into an Equity Fund by 2028. This is
              the public record of the work: methods, results, and the systems beneath them.
            </p>
            <div className="hero-actions">
              <Link className="button-link" href="/research">
                Explore research
              </Link>
              <Link className="button-link--secondary" href="/blog">
                Read the journal
              </Link>
            </div>
          </div>
          <div className="hero-side">
            <div className="hero-side__label">
              <span>Current observation</span>
              <span>Server-side data</span>
            </div>
            <MarketPanel />
          </div>
        </div>
        <div className="container hero__footer">
          <span>01 / Research</span>
          <span>02 / Engineering</span>
          <span>03 / Publication</span>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            title="Field notes"
            description="Short entries from the research and engineering process."
            link={{ href: "/blog", label: "View journal" }}
          />
          <div className="article-list">
            {featuredPosts.map((post) => (
              <ArticleCard key={post.slug} article={post} basePath="blog" />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            title="Research ledger"
            description="Live momentum research connecting market questions, methodology, and evidence."
            link={{ href: "/research#momentum", label: "View momentum research" }}
          />
          <div className="article-list">
            <EntryCard
              href="/research#momentum"
              meta={["Live research", "Interactive matrix"]}
              title="Global stock momentum snapshot"
              summary="Explore how recent stock momentum relates to forward returns across markets, capitalization groups, and time horizons."
              tags={["momentum", "global equities"]}
              ctaLabel="Explore project"
            />
            {featuredResearch.map((article) => (
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
