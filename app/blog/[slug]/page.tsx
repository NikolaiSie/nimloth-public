import { redirect } from "next/navigation";
import { getContentIndex } from "@/lib/content";

type BlogArticlePageProps = {
  params: {
    slug: string;
  };
};

export async function generateStaticParams() {
  const posts = await getContentIndex("blog");
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = params;
  redirect(`/research/${slug}`);
}
