import Link from "next/link";
import { NimlothMark } from "@/components/nimloth-mark";

export function Header() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="brand-mark" aria-label="Nimloth Capital home">
          <span className="brand-mark__crest">
            <NimlothMark className="brand-mark__symbol" />
          </span>
          <span className="brand-mark__copy">
            <strong>Nimloth Capital</strong>
            <small>Public research</small>
          </span>
        </Link>
        <nav className="site-nav" aria-label="Primary">
          <Link href="/">Home</Link>
          <Link href="/blog">Journal</Link>
          <Link href="/research">Research</Link>
        </nav>
      </div>
    </header>
  );
}
