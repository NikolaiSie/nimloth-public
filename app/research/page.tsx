import {
  MomentumOverview,
  type MomentumOverviewPayload,
} from "@/components/momentum-overview";
import { getLatestMomentumMatrix, getMomentumMetadata } from "@/lib/nimloth-api";
import { normalizeMomentumMatrixColumns } from "@/lib/momentum-matrix";

export const metadata = {
  title: "Research",
  description: "Long-form public research from Nimloth Capital.",
};

export default async function ResearchIndexPage() {
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
        <p className="eyebrow">Research / Evidence</p>
        <div className="page-hero__grid">
          <h2>
            Research on the core market phenomena that build the foundation of Nimloth strategies.
          </h2>
        </div>
      </section>
      <MomentumOverview
        initialPayload={initialPayload}
        initialError={initialError}
      />
    </div>
  );
}
