import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Element, ElementContent, Root, RootContent, Text } from "hast";
import rehypeKatex from "rehype-katex";
import rehypeSanitize, { defaultSchema, type Options as SanitizeSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
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

// `$...$` and `$$...$$` are TeX math. The markdown is sanitized first, so raw HTML
// in a post is stripped, and KaTeX then renders the math nodes sanitize let through
// (remark-math marks them with the `math-inline` and `math-display` classes).
const mathSafeSchema: SanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      ["className", "math-inline", "math-display", /^language-./u],
    ],
  },
};

/**
 * How a post cites its sources, read from the list under its "References" heading. A numbered
 * list means citations like `[2]` or `[5, 6]`; a bulleted list means author-year citations like
 * "(Ince & Porter, 2006)". Each reference's key is its first author's surname and its year.
 */
export type References =
  | { kind: "none" }
  | { kind: "numbered"; count: number }
  | { kind: "author-year"; keys: string[] };

const NO_REFERENCES: References = { kind: "none" };

/** "Ince", "2006" -> "ince-2006"; accents dropped, so the key is a safe fragment id. */
function referenceKey(surname: string, year: string) {
  const slug = surname
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "");
  return `${slug}-${year}`;
}

/** The key of a reference entry such as "Daniel, K., & Moskowitz, T. J. (2016). ...". */
function entryKey(entry: string) {
  const year = /\((\d{4}[a-z]?)\)/u.exec(entry);
  const surname = entry.replace(/^[\s*_[]+/u, "").split(",")[0];
  return year && surname ? referenceKey(surname, year[1]) : null;
}

export function parseReferences(markdown: string): References {
  const heading = /^#{2,3}[ \t]+References[ \t]*$/mu.exec(markdown);
  if (!heading) return NO_REFERENCES;
  const section = markdown.slice(heading.index + heading[0].length).split(/^#{1,6}[ \t]/mu)[0];
  const items = [...section.matchAll(/^(\d+\.|[-*+])[ \t]+(.*)$/gmu)];
  if (items.length === 0) return NO_REFERENCES;
  if (/^\d/u.test(items[0][1])) return { kind: "numbered", count: items.length };
  const keys = items.map((item) => entryKey(item[2])).filter((key): key is string => key !== null);
  return keys.length > 0 ? { kind: "author-year", keys } : NO_REFERENCES;
}

const NUMBERED_CITATION = /\[(\d+(?:,[ \t]*\d+)*)\]/gu;
// One or more capitalised surnames joined by commas, "&" or "and", maybe "et al.", then the year:
// ", 2017" inside parentheses, or " (2017)" when the authors are named in the sentence.
const AUTHOR_YEAR_CITATION =
  /\p{Lu}[\p{L}'’-]+(?:(?:,[ \t]+|[ \t]+(?:&|and)[ \t]+)\p{Lu}[\p{L}'’-]+)*(?:[ \t]+et[ \t]+al\.)?(?:,[ \t]+(\d{4}[a-z]?)|[ \t]+\((\d{4}[a-z]?)\))/gu;

function isElement(node: { type: string }, tagName?: string): node is Element {
  return node.type === "element" && (tagName === undefined || (node as Element).tagName === tagName);
}

function citationLink(key: string, label: string): Element {
  return {
    type: "element",
    tagName: "a",
    properties: { href: `#ref-${key}`, className: ["citation"] },
    children: [{ type: "text", value: label }],
  };
}

/**
 * Citations link to their entry in the reference list, which gets `id="ref-..."`: `ref-2` for a
 * numbered list, `ref-ince-2006` for an author-year one. Only citations that match a reference
 * are linked. It runs after sanitizing, so posts can't set their own ids, and before KaTeX;
 * math, code, links and the reference list itself are left alone.
 */
function rehypeCitationLinks(options: { references: References }) {
  const { references } = options;
  const keys = new Set(references.kind === "author-year" ? references.keys : []);

  function numbered(match: RegExpMatchArray): ElementContent[] | null {
    if (references.kind !== "numbered") return null;
    const numbers = match[1].split(",").map((n) => Number(n.trim()));
    if (!numbers.every((n) => n >= 1 && n <= references.count)) return null;
    const parts: ElementContent[] = [{ type: "text", value: "[" }];
    numbers.forEach((n, i) => {
      if (i > 0) parts.push({ type: "text", value: ", " });
      parts.push(citationLink(String(n), String(n)));
    });
    parts.push({ type: "text", value: "]" });
    return parts;
  }

  function authorYear(match: RegExpMatchArray): ElementContent[] | null {
    const surname = match[0].split(/,|[ \t]+(?:&|and|et)[ \t]/u)[0];
    const key = referenceKey(surname, match[1] ?? match[2]);
    return keys.has(key) ? [citationLink(key, match[0])] : null;
  }

  const pattern = references.kind === "numbered" ? NUMBERED_CITATION : AUTHOR_YEAR_CITATION;
  const linkFor = references.kind === "numbered" ? numbered : authorYear;

  function linkCitations(text: Text): ElementContent[] {
    const parts: ElementContent[] = [];
    let cursor = 0;
    for (const match of text.value.matchAll(pattern)) {
      const link = linkFor(match);
      if (!link) continue;
      if (match.index > cursor) parts.push({ type: "text", value: text.value.slice(cursor, match.index) });
      parts.push(...link);
      cursor = match.index + match[0].length;
    }
    if (cursor === 0) return [text];
    if (cursor < text.value.length) parts.push({ type: "text", value: text.value.slice(cursor) });
    return parts;
  }

  function walk(parent: Root | Element) {
    const children = parent.children as RootContent[];
    parent.children = children.flatMap((child): RootContent[] => {
      if (child.type === "text") return linkCitations(child);
      const skip =
        isElement(child) &&
        (["a", "code", "pre"].includes(child.tagName) || String(child.properties.id ?? "").startsWith("ref-"));
      if (isElement(child) && !skip) walk(child);
      return [child];
    }) as typeof parent.children;
  }

  function anchorReferenceList(tree: Root) {
    const nodes = tree.children.filter((node): node is Element => isElement(node));
    const heading = nodes.findIndex(
      (node) => ["h2", "h3"].includes(node.tagName) && toText(node).trim() === "References",
    );
    const list = heading >= 0 ? nodes[heading + 1] : undefined;
    if (!list) return;
    const items = list.children.filter((item): item is Element => isElement(item, "li"));
    if (references.kind === "numbered" && isElement(list, "ol")) {
      const start = Number(list.properties.start ?? 1);
      items.forEach((item, i) => {
        item.properties.id = `ref-${start + i}`;
      });
    }
    if (references.kind === "author-year" && isElement(list, "ul")) {
      const seen = new Set<string>();
      for (const item of items) {
        const key = entryKey(toText(item));
        if (key && !seen.has(key)) {
          seen.add(key);
          item.properties.id = `ref-${key}`;
        }
      }
    }
  }

  return (tree: Root) => {
    if (references.kind === "none") return;
    anchorReferenceList(tree);
    walk(tree);
  };
}

function toText(node: ElementContent): string {
  if (node.type === "text") return node.value;
  return isElement(node) ? node.children.map(toText).join("") : "";
}

async function renderMarkdown(markdown: string, references: References = NO_REFERENCES) {
  const rendered = await remark()
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeSanitize, mathSafeSchema)
    .use(rehypeCitationLinks, { references })
    .use(rehypeKatex, { output: "html" })
    .use(rehypeStringify)
    .process(markdown);
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

// Dates are calendar days ("2026-11-23"), which JavaScript reads as midnight UTC, so format them in
// UTC too; formatting in the local zone shows the previous day anywhere west of Greenwich.
function formatPublishedAt(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
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
  // Counted over the whole post, since the citations and the list can be in different segments.
  const references = parseReferences(content);
  const segments = await Promise.all(
    splitAtEmbedMarkers(content).map(async (segment): Promise<ContentSegment> =>
      segment.kind === "embed"
        ? segment
        : { kind: "html", html: await renderMarkdown(segment.markdown, references) },
    ),
  );

  return {
    ...indexEntry,
    segments,
  } satisfies ContentEntry;
}
