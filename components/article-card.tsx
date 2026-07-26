import Link from "next/link";
import type { ContentIndexEntry } from "@/lib/content";

type ArticleCardProps = {
  article: ContentIndexEntry;
  basePath: "blog" | "research";
};

export function ArticleCard({ article, basePath }: ArticleCardProps) {
  return (
    <Link className="article-list__item card" href={`/${basePath}/${article.slug}`}>
      <div className="article-list__meta">
        <span>{article.publishedAtLabel}</span>
        <span>{article.readingTimeLabel}</span>
      </div>
      <h3>{article.title}</h3>
      <p>{article.summary}</p>
      <div className="stat-row">
        {article.tags.map((tag) => (
          <span className="tag" key={tag}>
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
