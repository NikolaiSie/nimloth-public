import { promises as fs } from "node:fs";
import path from "node:path";
import {
  compareBlogCardOrder,
  getContentBySlug,
  getContentIndex,
} from "@/lib/content";

describe("content loading", () => {
  it("sorts blog content newest first", async () => {
    const posts = await getContentIndex("blog");
    expect(posts.map((post) => post.slug)).toEqual([
      "momentum",
      "why-i-am-building-nimloth",
    ]);
  });

  it("orders the primary blog cards with the end-to-end post first", async () => {
    const posts = await getContentIndex("blog");
    expect(posts.sort(compareBlogCardOrder).map((post) => post.slug)).toEqual([
      "why-i-am-building-nimloth",
      "momentum",
    ]);
  });

  it("renders article markdown into html", async () => {
    const article = await getContentBySlug("blog", "why-i-am-building-nimloth");
    expect(article).not.toBeNull();
    expect(article?.contentHtml).toContain("<p>");
  });

  it("sanitizes unsafe html from markdown content", async () => {
    const slug = "sanitization-regression-test";
    const filePath = path.join(process.cwd(), "content", "research", `${slug}.md`);

    try {
      await fs.writeFile(
        filePath,
        [
          "---",
          "title: Sanitization regression",
          "summary: Test fixture",
          "publishedAt: 2026-07-30",
          "---",
          "",
          "# Title",
          "",
          "<img src=\"x\" onerror=\"alert('xss')\">",
          "<script>alert('xss')</script>",
          "<a href=\"javascript:alert('xss')\">click</a>",
        ].join("\n"),
        "utf8",
      );

      const article = await getContentBySlug("research", slug);

      expect(article).not.toBeNull();
      expect(article?.contentHtml).toContain("<h1>Title</h1>");
      expect(article?.contentHtml).not.toContain("<script>");
      expect(article?.contentHtml).not.toContain("onerror=");
      expect(article?.contentHtml).not.toContain("javascript:alert");
    } finally {
      await fs.unlink(filePath).catch(() => undefined);
    }
  });

  it("splits content at the {{heatmap}} embed marker", async () => {
    const slug = "embed-marker-test";
    const filePath = path.join(process.cwd(), "content", "research", `${slug}.md`);

    try {
      await fs.writeFile(
        filePath,
        [
          "---",
          "title: Embed marker",
          "summary: Test fixture",
          "publishedAt: 2026-07-30",
          "---",
          "",
          "Intro paragraph.",
          "",
          "{{heatmap}}",
          "",
          "## Below the chart",
          "",
          "![Chart](/blog/momentum/chart.png)",
        ].join("\n"),
        "utf8",
      );

      const article = await getContentBySlug("research", slug);

      expect(article?.contentHtml).toContain("Intro paragraph.");
      expect(article?.contentHtml).not.toContain("Below the chart");
      expect(article?.contentHtml).not.toContain("{{heatmap}}");
      expect(article?.contentHtmlAfterEmbed).toContain("<h2>Below the chart</h2>");
      expect(article?.contentHtmlAfterEmbed).toContain('<img src="/blog/momentum/chart.png" alt="Chart">');
      expect(article?.contentHtmlAfterEmbed).not.toContain("Intro paragraph.");
    } finally {
      await fs.unlink(filePath).catch(() => undefined);
    }
  });

  it("leaves contentHtmlAfterEmbed null when there is no marker", async () => {
    const article = await getContentBySlug("blog", "why-i-am-building-nimloth");
    expect(article?.contentHtmlAfterEmbed).toBeNull();
  });
});
