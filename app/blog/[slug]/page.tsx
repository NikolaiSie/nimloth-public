import { notFound } from "next/navigation";
import { ArticlePage } from "@/components/article-page";
import { getContentBySlug, getContentIndex } from "@/lib/content";

type BlogArticlePageProps = {
  params: {
    slug: string;
  };
};

export async function generateStaticParams() {
  const posts = await getContentIndex("blog");
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogArticlePageProps) {
  const { slug } = params;
  const post = await getContentBySlug("blog", slug);

  if (!post) {
    return {};
  }

  return {
    title: post.title,
    description: post.summary,
  };
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = params;
  const post = await getContentBySlug("blog", slug);

  if (!post) {
    notFound();
  }

  return <ArticlePage article={post} sectionLabel="Blog" />;
}
