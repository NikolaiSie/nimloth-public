import type { ReactNode } from "react";
import type { ContentEntry } from "@/lib/content";

type ArticlePageProps = {
  article: ContentEntry;
  sectionLabel: string;
  children?: ReactNode;
};

export function ArticlePage({ article, sectionLabel, children }: ArticlePageProps) {
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
      </section>
      <article className="article">
        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: article.contentHtml }}
        />
        {children}
      </article>
    </div>
  );
}
