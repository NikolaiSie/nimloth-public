import { NimlothMark } from "@/components/nimloth-mark";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div className="site-footer__brand">
          <NimlothMark className="site-footer__mark" />
          <div>
            <strong>Nimloth Capital</strong>
            <p>Independent quantitative research and engineering.</p>
          </div>
        </div>
        <p className="site-footer__note">
          Markets / systems / evidence
          <span>2026</span>
        </p>
      </div>
    </footer>
  );
}
