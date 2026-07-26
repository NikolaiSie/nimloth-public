import Link from "next/link";

type SectionHeadingProps = {
  title: string;
  description: string;
  link?: {
    href: string;
    label: string;
  };
};

export function SectionHeading({
  title,
  description,
  link,
}: SectionHeadingProps) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {link ? (
        <Link className="button-link" href={link.href}>
          {link.label}
        </Link>
      ) : null}
    </div>
  );
}
