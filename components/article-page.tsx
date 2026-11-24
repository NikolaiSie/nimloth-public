import { Fragment, type ReactNode } from "react";
import { ShareLinks } from "@/components/share-links";
import type { ContentEntry, EmbedName } from "@/lib/content";

type ArticlePageProps = {
  article: ContentEntry;
  sectionLabel: string;
  /** Interactive embeds, rendered only where the post has a `{{name}}` marker. */
  embeds?: Partial<Record<EmbedName, ReactNode>>;
};

export function ArticlePage({ article, sectionLabel, embeds = {} }: ArticlePageProps) {
  return (
    <div className="container">
      <section className="page-hero article-hero">
        <p className="eyebrow">{sectionLabel} / Archive</p>
        <div className="page-hero__grid">
          <h1>{article.title}</h1>
        </div>
        <div className="article-meta">
          <span>{article.publishedAtLabel}</span>
          <span>{article.readingTimeLabel}</span>
        </div>
        <ShareLinks slug={article.slug} title={article.title} summary={article.summary} />
      </section>
      <article className="article">
        {article.segments.map((segment, index) => {
          if (segment.kind === "embed") {
            return <Fragment key={`embed-${segment.name}-${index}`}>{embeds[segment.name]}</Fragment>;
          }

          const followsEmbed = article.segments[index - 1]?.kind === "embed";
          return (
            <div
              className={followsEmbed ? "prose prose--after-embed" : "prose"}
              dangerouslySetInnerHTML={{ __html: segment.html }}
              key={`html-${index}`}
            />
          );
        })}
        <ShareLinks
          className="share-links--end"
          slug={article.slug}
          title={article.title}
          summary={article.summary}
        />
      </article>
    </div>
  );
}
