import Link from "next/link";
import { ArticleCard } from "@/components/article-card";
import { EntryCard } from "@/components/entry-card";
import { MarketPanel } from "@/components/market-panel";
import { SectionHeading } from "@/components/section-heading";
import { getFeaturedPosts } from "@/lib/content";

export default async function HomePage() {
  const [featuredPosts, featuredResearch] = await Promise.all([
    getFeaturedPosts("blog", 2),
    getFeaturedPosts("research", 2),
  ]);
  const featuredEntries = [...featuredResearch, ...featuredPosts];

  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero-card">
            <h1>
              Turning evidence
              <span>into instruments.</span>
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
          <div className="hero-side">
            <div className="hero-side__label">
              <span>Current observation</span>
              <span>Server-side data</span>
            </div>
            <MarketPanel />
          </div>
        </div>
        <div className="container hero__footer">
          <span>01 / Blog</span>
          <span>02 / About</span>
          <span>03 / Publication</span>
        </div>
      </section>

      <section className="section section--mandate" id="about">
        <div className="container mandate">
          <div className="mandate__heading">
            <p className="eyebrow">About</p>
            <h2>What Nimloth is building.</h2>
            <img
              className="mandate__portrait"
              src="/C0BAA8F7-94F3-42CE-9D08-5E2A5F4D3E3A.jpeg"
              alt="Nikolai Sie"
            />
          </div>
          <div className="mandate__grid">
            <div className="mandate__item">
              <span>01</span>
              <h3>Research program</h3>
              <p>
                A two-year investigation into market data, artificial intelligence,
                and quantitative trading systems.
              </p>
            </div>
            <div className="mandate__item">
              <span>02</span>
              <h3>Public record</h3>
              <p>
                Methods, results, and engineering notes are published as the work
                develops, so the path to conviction is visible.
              </p>
            </div>
            <div className="mandate__item">
              <span>03</span>
              <h3>Operating discipline</h3>
              <p>
                The work favors tested evidence, reproducible systems, and
                instruments that can be inspected under changing market conditions.
              </p>
            </div>
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
            <EntryCard
              href="/research#momentum"
              meta={["Live project", "Interactive matrix"]}
              title="Global stock momentum snapshot"
              summary="Explore how recent stock momentum relates to forward returns across markets, capitalization groups, and time horizons."
              tags={["momentum", "global equities"]}
              ctaLabel="Explore project"
            />
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
