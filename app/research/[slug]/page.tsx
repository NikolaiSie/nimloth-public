import { notFound } from "next/navigation";
import { ArticlePage } from "@/components/article-page";
import { getContentBySlug, getContentIndex } from "@/lib/content";

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

  return <ArticlePage article={article} sectionLabel="Blog" />;
}
