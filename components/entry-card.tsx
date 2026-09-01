import Link from "next/link";

type EntryCardProps = {
  href: string;
  meta: [string, string];
  title: string;
  summary: string;
  tags: string[];
  ctaLabel: string;
};

export function EntryCard({
  href,
  meta,
  title,
  summary,
  tags,
  ctaLabel,
}: EntryCardProps) {
  return (
    <Link className="article-list__item card" href={href}>
      <div className="article-list__meta">
        <span>{meta[0]}</span>
        <span>{meta[1]}</span>
      </div>
      <h3>{title}</h3>
      <p>{summary}</p>
      <div className="stat-row">
        {tags.map((tag) => (
          <span className="tag" key={tag}>
            {tag}
          </span>
        ))}
      </div>
      <span className="article-list__cta">{ctaLabel}</span>
    </Link>
  );
}
