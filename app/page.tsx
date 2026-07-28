import Link from "next/link";
import { ArticleCard } from "@/components/article-card";
import { MarketPanel } from "@/components/market-panel";
import { SectionHeading } from "@/components/section-heading";
import { getFeaturedPosts, getFeaturedResearch } from "@/lib/content";

export default async function HomePage() {
  const [featuredPosts, featuredResearch] = await Promise.all([
    getFeaturedPosts("blog", 2),
    getFeaturedResearch("research", 2),
  ]);

  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero-card">
            <p className="eyebrow">Independent quantitative research / 2026</p>
            <h1>
              Markets observed.
              <span>Systems explained.</span>
            </h1>
            <p>
              Nimloth Capital is a two-year research program in market data,
              machine learning, and quantitative trading. This is the public
              record of the work: methods, results, and the systems beneath
              them.
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

      <section className="section section--mandate">
        <div className="container mandate">
          <div className="mandate__heading">
            <p className="eyebrow">The mandate</p>
            <h2>Build the evidence. Test the thesis. Publish the record.</h2>
          </div>
          <div className="mandate__grid">
            <div className="mandate__item">
              <span>01</span>
              <h3>Data foundations</h3>
              <p>
                Reproducible pipelines and explicit data contracts before any
                model earns attention.
              </p>
            </div>
            <div className="mandate__item">
              <span>02</span>
              <h3>Empirical discipline</h3>
              <p>
                Results are judged against assumptions, failure modes, and what
                would falsify them.
              </p>
            </div>
            <div className="mandate__item">
              <span>03</span>
              <h3>Public record</h3>
              <p>
                Useful methods and conclusions are published without exposing
                private data or execution logic.
              </p>
            </div>
          </div>
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
            description="Long-form work connecting market questions, methodology, and infrastructure."
            link={{ href: "/research", label: "View research" }}
          />
          <div className="article-list">
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
