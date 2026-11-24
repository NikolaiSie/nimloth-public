import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePage } from "@/components/article-page";
import { MomentumCumulative } from "@/components/momentum-cumulative";
import {
  MomentumOverview,
  type MomentumOverviewPayload,
} from "@/components/momentum-overview";
import { getContentBySlug, getContentIndex } from "@/lib/content";
import {
  DEFAULT_LATEST_QUERY,
  getLatestMomentumMatrix,
  getMomentumMetadataWithLatestCountries,
} from "@/lib/nimloth-api";
import { normalizeMomentumMatrixColumns } from "@/lib/momentum-matrix";

type ResearchArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
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
  const { slug } = await params;
  const article =
    (await getContentBySlug("research", slug)) ??
    (await getContentBySlug("blog", slug));

  if (!article) {
    return {};
  }

  // Open Graph and Twitter fields replace the layout's rather than merging, so the site-wide ones
  // are repeated here. The card image comes from opengraph-image.tsx next to this page.
  return {
    title: article.title,
    description: article.summary,
    openGraph: {
      type: "article",
      siteName: "Nimloth Capital",
      locale: "en_US",
      title: article.title,
      description: article.summary,
      url: `/research/${slug}`,
      publishedTime: article.publishedAt,
      tags: article.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.summary,
    },
  } satisfies Metadata;
}

export default async function ResearchArticlePage({
  params,
}: ResearchArticlePageProps) {
  const { slug } = await params;
  const article =
    (await getContentBySlug("research", slug)) ??
    (await getContentBySlug("blog", slug));

  if (!article) {
    notFound();
  }

  if (slug !== "momentum-in-global-data") {
    return <ArticlePage article={article} sectionLabel="Blog" />;
  }

  let initialPayload: MomentumOverviewPayload | null = null;
  let initialError: string | null = null;

  try {
    const matrix = await getLatestMomentumMatrix(DEFAULT_LATEST_QUERY);
    const metadata = await getMomentumMetadataWithLatestCountries(matrix);

    initialPayload = {
      metadata,
      matrix: normalizeMomentumMatrixColumns(matrix, metadata),
      filters: {
        country: "ALL" as const,
        cap: "ALL" as const,
        aggregation: "weighted_mean" as const,
        date: null,
      },
    };
  } catch {
    initialError = "The latest momentum overview is temporarily unavailable.";
  }

  return (
    <ArticlePage
      article={article}
      sectionLabel="Blog"
      embeds={{
        heatmap: (
          <MomentumOverview
            initialPayload={initialPayload}
            initialError={initialError}
          />
        ),
        cumulative: <MomentumCumulative />,
      }}
    />
  );
}
