import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { SITE_URL } from "@/lib/site";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Nimloth Capital",
    template: "%s | Nimloth Capital",
  },
  description:
    "Public blog, engineering notes, and market experiments from Nimloth Capital.",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "./",
  },
  // Link previews on LinkedIn, X and messaging apps. The card images come from opengraph-image.tsx.
  openGraph: {
    type: "website",
    siteName: "Nimloth Capital",
    locale: "en_US",
    title: "Nimloth Capital",
    description:
      "Public blog, engineering notes, and market experiments from Nimloth Capital.",
    url: "./",
  },
  twitter: {
    card: "summary_large_image",
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
