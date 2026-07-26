import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="container">
      <section className="page-hero">
        <p className="eyebrow" style={{ color: "var(--accent)" }}>
          404
        </p>
        <h1>That page is not here.</h1>
        <p>
          The route may have moved or the article may not be published yet.
        </p>
        <Link className="button-link" href="/">
          Return home
        </Link>
      </section>
    </div>
  );
}
