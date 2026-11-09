import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import { z } from "zod";

const frontmatterSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  publishedAt: z.union([
    z.string().min(1),
    z.date().transform((date) => date.toISOString().slice(0, 10)),
  ]),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
});

export type ContentType = "blog" | "research";

export type ContentIndexEntry = {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  publishedAtLabel: string;
  readingTimeLabel: string;
  tags: string[];
  featured: boolean;
};

export const EMBED_NAMES = ["heatmap", "cumulative"] as const;

export type EmbedName = (typeof EMBED_NAMES)[number];

export type ContentSegment =
  | { kind: "html"; html: string }
  | { kind: "embed"; name: EmbedName };

export type ContentEntry = ContentIndexEntry & {
  /** Rendered markdown and interactive embeds, in document order. */
  segments: ContentSegment[];
};

/**
 * A line containing only `{{name}}` (e.g. `{{heatmap}}`, `{{cumulative}}`) marks
 * where a post's interactive embed is placed. An embed without a marker is not shown.
 */
const EMBED_MARKER = new RegExp(
  String.raw`^[ \t]*\{\{\s*(${EMBED_NAMES.join("|")})\s*\}\}[ \t]*$`,
  "gmu",
);

type RawSegment = { kind: "markdown"; markdown: string } | { kind: "embed"; name: EmbedName };

function splitAtEmbedMarkers(content: string): RawSegment[] {
  const segments: RawSegment[] = [];
  let cursor = 0;

  for (const match of content.matchAll(EMBED_MARKER)) {
    segments.push({ kind: "markdown", markdown: content.slice(cursor, match.index) });
    segments.push({ kind: "embed", name: match[1] as EmbedName });
    cursor = match.index + match[0].length;
  }

  segments.push({ kind: "markdown", markdown: content.slice(cursor) });
  return segments.filter(
    (segment) => segment.kind === "embed" || segment.markdown.trim().length > 0,
  );
}

async function renderMarkdown(markdown: string) {
  const rendered = await remark().use(html, { sanitize: true }).process(markdown);
  // Paragraphs starting with "*" (written `\*` in markdown) are footnote-style notes.
  // The class is added after sanitizing, so it can't be injected from markdown.
  return rendered.toString().replace(/<p>\*/gu, '<p class="note">*');
}

const contentRoot = path.join(process.cwd(), "content");

function getDirectory(type: ContentType) {
  return path.join(contentRoot, type);
}

function calculateReadingTime(content: string) {
  const words = content.split(/\s+/u).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 220));
  return `${minutes} min read`;
}

function formatPublishedAt(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
  }).format(new Date(dateString));
}

export function compareContentNewestFirst(
  left: ContentIndexEntry,
  right: ContentIndexEntry,
) {
  return right.publishedAt.localeCompare(left.publishedAt);
}

async function listMarkdownFiles(type: ContentType) {
  const entries = await fs.readdir(getDirectory(type), { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name);
}

async function readRawContent(type: ContentType, slug: string) {
  const fullPath = path.join(getDirectory(type), `${slug}.md`);
  try {
    return await fs.readFile(fullPath, "utf8");
  } catch {
    return null;
  }
}

function parseIndexEntry(slug: string, rawFile: string): ContentIndexEntry {
  const { data, content } = matter(rawFile);
  const parsed = frontmatterSchema.parse(data);

  return {
    slug,
    title: parsed.title,
    summary: parsed.summary,
    publishedAt: parsed.publishedAt,
    publishedAtLabel: formatPublishedAt(parsed.publishedAt),
    readingTimeLabel: calculateReadingTime(content),
    tags: parsed.tags,
    featured: parsed.featured,
  };
}

export async function getContentIndex(type: ContentType) {
  const files = await listMarkdownFiles(type);
  const entries = await Promise.all(
    files.map(async (filename) => {
      const slug = filename.replace(/\.md$/u, "");
      const rawFile = await fs.readFile(path.join(getDirectory(type), filename), "utf8");
      return parseIndexEntry(slug, rawFile);
    }),
  );

  return entries.sort(compareContentNewestFirst);
}

export async function getFeaturedPosts(type: ContentType, count: number) {
  const entries = await getContentIndex(type);
  return entries.filter((entry) => entry.featured).slice(0, count);
}

export async function getContentBySlug(type: ContentType, slug: string) {
  const rawFile = await readRawContent(type, slug);

  if (!rawFile) {
    return null;
  }

  const indexEntry = parseIndexEntry(slug, rawFile);
  const { content } = matter(rawFile);
  const segments = await Promise.all(
    splitAtEmbedMarkers(content).map(async (segment): Promise<ContentSegment> =>
      segment.kind === "embed"
        ? segment
        : { kind: "html", html: await renderMarkdown(segment.markdown) },
    ),
  );

  return {
    ...indexEntry,
    segments,
  } satisfies ContentEntry;
}
