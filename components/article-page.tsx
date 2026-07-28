import type { ContentEntry } from "@/lib/content";

type ArticlePageProps = {
  article: ContentEntry;
  sectionLabel: string;
};

export function ArticlePage({ article, sectionLabel }: ArticlePageProps) {
  return (
    <div className="container">
      <section className="page-hero">
        <p className="eyebrow">{sectionLabel} / Archive</p>
        <div className="page-hero__grid">
          <h1>{article.title}</h1>
          <p>{article.summary}</p>
        </div>
        <div className="article-meta">
          <span>{article.publishedAtLabel}</span>
          <span>{article.readingTimeLabel}</span>
          {article.tags.map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </section>
      <article className="article">
        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: article.contentHtml }}
        />
      </article>
    </div>
  );
}
