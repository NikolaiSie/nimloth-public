import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Nimloth Capital",
    template: "%s | Nimloth Capital",
  },
  description:
    "Public blog, engineering notes, and market experiments from Nimloth Capital.",
  metadataBase: new URL("https://nimlothcapital.com"),
  alternates: {
    canonical: "./",
  },
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    // Browser extensions add attributes to <html> before React loads; this ignores them on this element only.
    <html lang="en" suppressHydrationWarning>
      <body>
        <div className="site-shell">
          <Header />
          <main>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
