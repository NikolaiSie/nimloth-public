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

export type ContentEntry = ContentIndexEntry & {
  contentHtml: string;
};

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

  return entries.sort((left, right) =>
    left.publishedAt < right.publishedAt ? 1 : -1,
  );
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
  const rendered = await remark().use(html, { sanitize: true }).process(content);

  return {
    ...indexEntry,
    contentHtml: rendered.toString(),
  } satisfies ContentEntry;
}
