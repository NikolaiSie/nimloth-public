import { notFound } from "next/navigation";
import { ArticlePage } from "@/components/article-page";
import { getContentBySlug, getContentIndex } from "@/lib/content";

type ResearchArticlePageProps = {
  params: {
    slug: string;
  };
};

export async function generateStaticParams() {
  const research = await getContentIndex("research");
  return research.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: ResearchArticlePageProps) {
  const { slug } = params;
  const article = await getContentBySlug("research", slug);

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
  const article = await getContentBySlug("research", slug);

  if (!article) {
    notFound();
  }

  return <ArticlePage article={article} sectionLabel="Research" />;
}
