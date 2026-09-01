import { EntryCard } from "@/components/entry-card";
import type { ContentIndexEntry } from "@/lib/content";

type ArticleCardProps = {
  article: ContentIndexEntry;
  basePath: "blog" | "research";
};

export function ArticleCard({ article, basePath }: ArticleCardProps) {
  return (
    <EntryCard
      href={`/${basePath}/${article.slug}`}
      meta={[article.publishedAtLabel, article.readingTimeLabel]}
      title={article.title}
      summary={article.summary}
      tags={article.tags}
      ctaLabel="Read entry"
    />
  );
}
