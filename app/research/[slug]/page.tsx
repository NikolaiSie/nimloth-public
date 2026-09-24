import { notFound } from "next/navigation";
import { ArticlePage } from "@/components/article-page";
import {
  MomentumOverview,
  type MomentumOverviewPayload,
} from "@/components/momentum-overview";
import { getContentBySlug, getContentIndex } from "@/lib/content";
import { getLatestMomentumMatrix, getMomentumMetadata } from "@/lib/nimloth-api";
import { normalizeMomentumMatrixColumns } from "@/lib/momentum-matrix";

type ResearchArticlePageProps = {
  params: {
    slug: string;
  };
};

export async function generateStaticParams() {
  const [research, posts] = await Promise.all([
    getContentIndex("research"),
    getContentIndex("blog"),
  ]);
  const slugs = new Set([...research, ...posts].map((article) => article.slug));
  return Array.from(slugs, (slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ResearchArticlePageProps) {
  const { slug } = params;
  const article =
    (await getContentBySlug("research", slug)) ??
    (await getContentBySlug("blog", slug));

  if (!article) {
    return {};
  }

  return {
    title: article.title,
    description: article.summary,
  };
}

export default async function ResearchArticlePage({
  params,
}: ResearchArticlePageProps) {
  const { slug } = params;
  const article =
    (await getContentBySlug("research", slug)) ??
    (await getContentBySlug("blog", slug));

  if (!article) {
    notFound();
  }

  if (slug !== "momentum") {
    return <ArticlePage article={article} sectionLabel="Blog" />;
  }

  let initialPayload: MomentumOverviewPayload | null = null;
  let initialError: string | null = null;

  try {
    const metadata = await getMomentumMetadata();
    const matrix = await getLatestMomentumMatrix({
      country: "ALL",
      cap: "ALL",
      aggregation: "median",
    });

    initialPayload = {
      metadata,
      matrix: normalizeMomentumMatrixColumns(matrix, metadata),
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
    <ArticlePage article={article} sectionLabel="Blog">
      <MomentumOverview
        initialPayload={initialPayload}
        initialError={initialError}
      />
    </ArticlePage>
  );
}
