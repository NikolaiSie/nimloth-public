import { ArticleCard } from "@/components/article-card";
import {
  MomentumOverview,
  type MomentumOverviewPayload,
} from "@/components/momentum-overview";
import { getContentIndex } from "@/lib/content";
import { getLatestMomentumMatrix, getMomentumMetadata } from "@/lib/nimloth-api";
import { normalizeMomentumMatrixColumns } from "@/lib/momentum-matrix";

export const metadata = {
  title: "Blog",
  description: "Public projects and field notes from Nimloth Capital.",
};

export default async function ResearchIndexPage() {
  const [research, posts] = await Promise.all([
    getContentIndex("research"),
    getContentIndex("blog"),
  ]);
  const entries = [...research, ...posts].sort((left, right) =>
    left.publishedAt < right.publishedAt ? 1 : -1,
  );
  let initialPayload: MomentumOverviewPayload | null = null;
  let initialError: string | null = null;

  try {
    const metadata = await getMomentumMetadata();
    const matrix = await getLatestMomentumMatrix({
      country: "ALL",
      cap: "ALL",
      aggregation: "median",
    });

    const normalizedMatrix = normalizeMomentumMatrixColumns(matrix, metadata);

    initialPayload = {
      metadata,
      matrix: normalizedMatrix,
      filters: {
        country: "ALL" as const,
        cap: "ALL" as const,
        aggregation: "median" as const,
        date: null,
      },
    };
  } catch {
    initialError = "The latest momentum overview is temporarily unavailable.";
  }

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
      <MomentumOverview
        initialPayload={initialPayload}
        initialError={initialError}
      />
      {entries.length > 0 ? (
        <section className="section">
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
