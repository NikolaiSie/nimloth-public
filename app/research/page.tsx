import { ArticleCard } from "@/components/article-card";
import {
  MomentumOverview,
  type MomentumOverviewPayload,
} from "@/components/momentum-overview";
import { getContentIndex } from "@/lib/content";
import { getLatestMomentumMatrix, getMomentumMetadata } from "@/lib/nimloth-api";
import { normalizeMomentumMatrixColumns } from "@/lib/momentum-matrix";

export const metadata = {
  title: "Research",
  description: "Long-form public research from Nimloth Capital.",
};

export default async function ResearchIndexPage() {
  const research = await getContentIndex("research");
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
      <MomentumOverview
        initialPayload={initialPayload}
        initialError={initialError}
      />
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
