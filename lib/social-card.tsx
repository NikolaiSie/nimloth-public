import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

/**
 * The 1200×630 link-preview card for LinkedIn, X and other sites that read Open Graph tags.
 * Colours follow docs/design-system.md. The design system uses platform font stacks, which an
 * image renderer cannot load, so the card uses KaTeX's serif (MIT licensed, already a dependency).
 */

export const SOCIAL_CARD_SIZE = { width: 1200, height: 630 };
export const SOCIAL_CARD_TYPE = "image/png";

const NAVY = "#071c2f";
const RAISED_NAVY = "#0c2a42";
const PALE_SEA = "#9db8bc";
const LIGHT_STONE = "#f8f4eb";
const SILVER = "#c5d0d1";
const GOLD = "#bd9857";
const LIGHT_GOLD = "#dfc894";

const fontDirectory = path.join(process.cwd(), "node_modules", "katex", "dist", "fonts");

async function loadFonts() {
  const [regular, italic] = await Promise.all([
    readFile(path.join(fontDirectory, "KaTeX_Main-Regular.ttf")),
    readFile(path.join(fontDirectory, "KaTeX_Main-Italic.ttf")),
  ]);
  return [
    { name: "Serif", data: regular, style: "normal" as const, weight: 400 as const },
    { name: "Serif", data: italic, style: "italic" as const, weight: 400 as const },
  ];
}

/** Shortens text at a word boundary so it fits the card. */
export function truncate(text: string, maxLength: number) {
  const clean = text.replace(/\s+/gu, " ").trim();
  if (clean.length <= maxLength) return clean;
  const cut = clean.slice(0, maxLength + 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > maxLength * 0.6 ? lastSpace : maxLength).replace(/[,;:.\s]+$/u, "")}…`;
}

function titleSize(title: string) {
  if (title.length <= 28) return 76;
  if (title.length <= 48) return 66;
  if (title.length <= 70) return 56;
  return 48;
}

function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M24 8v25" stroke={LIGHT_GOLD} strokeWidth="1.6" />
      <path
        d="M24 12c-5.5 1.2-8.7 4-10.5 8.2 4.6.2 8.1-1.3 10.5-4.5M24 17.2c5.5 1.2 8.7 4 10.5 8.2-4.6.2-8.1-1.3-10.5-4.5M24 21.5c-4.5 1-7.2 3.4-8.7 6.9 3.8.2 6.7-1.1 8.7-3.7M24 25.4c4.5 1 7.2 3.4 8.7 6.9-3.8.2-6.7-1.1-8.7-3.7"
        stroke={LIGHT_GOLD}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.35"
      />
      <path
        d="M9 37.5c4.5-2 9.5-2 15 0s10.5 2 15 0M11.5 41c3.8-1.5 7.9-1.5 12.5.1 4.6 1.6 8.7 1.6 12.5 0"
        stroke={LIGHT_GOLD}
        strokeLinecap="round"
        strokeWidth="1.25"
      />
      <circle cx="24" cy="6" r="1.35" fill={LIGHT_GOLD} />
    </svg>
  );
}

export type SocialCardContent = {
  /** Small line above the title, e.g. "Research · November 23, 2026". */
  eyebrow?: string;
  title: string;
  summary?: string;
};

export async function renderSocialCard({ eyebrow, title, summary }: SocialCardContent) {
  const fonts = await loadFonts();
  const shownTitle = truncate(title, 90);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 80px 56px",
          background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY} 55%, ${RAISED_NAVY} 100%)`,
          borderTop: `6px solid ${GOLD}`,
          fontFamily: "Serif",
          color: LIGHT_STONE,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Mark size={64} />
          <div style={{ display: "flex", fontSize: 26, letterSpacing: 6, color: SILVER }}>
            NIMLOTH CAPITAL
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {eyebrow ? (
            <div style={{ display: "flex", fontSize: 26, fontStyle: "italic", color: LIGHT_GOLD }}>
              {eyebrow}
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              fontSize: titleSize(shownTitle),
              lineHeight: 1.08,
              color: LIGHT_STONE,
              maxWidth: 1000,
            }}
          >
            {shownTitle}
          </div>
          {summary ? (
            <div style={{ display: "flex", fontSize: 28, lineHeight: 1.4, color: PALE_SEA, maxWidth: 980 }}>
              {truncate(summary, 150)}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", width: 120, height: 2, background: GOLD }} />
          <div style={{ display: "flex", fontSize: 24, letterSpacing: 2, color: SILVER }}>
            nimlothcapital.com
          </div>
        </div>
      </div>
    ),
    { ...SOCIAL_CARD_SIZE, fonts },
  );
}
