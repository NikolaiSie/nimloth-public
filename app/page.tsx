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
          <div className="hero-card card">
            <p className="eyebrow">Nimloth Capital</p>
            <h1>Publishing the research stack behind a two-year experiment.</h1>
            <p>
              Nimloth Capital is the public face of a deeper data and ML
              platform. The goal is straightforward: build the infrastructure,
              run quantitative research, and publish what survives first
              principles scrutiny.
            </p>
            <div className="hero-actions">
              <Link className="button-link" href="/research">
                Read research
              </Link>
              <Link className="button-link--secondary" href="/blog">
                Browse the blog
              </Link>
            </div>
            <ul className="pill-list">
              <li>Quantitative trading notes</li>
              <li>Research operations</li>
              <li>Cloud-native engineering</li>
            </ul>
          </div>
          <div className="hero-side">
            <MarketPanel />
            <div className="metric-card card">
              <h2>Operating principles</h2>
              <div className="stat-row">
                <span className="tag">Readable by design</span>
                <span className="tag">Infrastructure as code</span>
                <span className="tag">Security first</span>
              </div>
              <p>
                The public website stays intentionally narrow. It showcases the
                ideas, exposes selected outputs, and keeps all sensitive
                analytics behind a server-side boundary.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            title="What this site is for"
            description="A compact front end for public-facing writing, architecture notes, and selected market observations."
            link={{ href: "/research", label: "See the research archive" }}
          />
          <div className="article-list">
            <div className="banner">
              <h2>Welcome page</h2>
              <p>
                A clear introduction to the project, the operating constraints,
                and why the public repository exists.
              </p>
            </div>
            <div className="banner">
              <h2>Blog</h2>
              <p>
                Shorter updates about infrastructure, experiments, and lessons
                learned while building the stack.
              </p>
            </div>
            <div className="banner">
              <h2>Research</h2>
              <p>
                Longer form writing where system design, data quality, and
                trading questions can be laid out without compression.
              </p>
            </div>
            <div className="banner">
              <h2>Secure integration</h2>
              <p>
                Public visitors see a narrow read-only surface. Calls into the
                private data platform stay server-side.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            title="From the blog"
            description="Shorter entries intended to keep the public trail current while the deeper platform evolves."
            link={{ href: "/blog", label: "Open the blog" }}
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
            title="Research tracks"
            description="Longer pieces that connect infrastructure, methodology, and trading questions."
            link={{ href: "/research", label: "Open research" }}
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
