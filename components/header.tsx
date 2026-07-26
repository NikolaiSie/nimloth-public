import Link from "next/link";

export function Header() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="brand-mark" aria-label="Nimloth Capital home">
          <span className="brand-mark__crest">N</span>
          <span>Nimloth Capital</span>
        </Link>
        <nav className="site-nav" aria-label="Primary">
          <Link href="/">Welcome</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/research">Research</Link>
        </nav>
      </div>
    </header>
  );
}
