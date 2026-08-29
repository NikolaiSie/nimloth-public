import { promises as fs } from "node:fs";
import path from "node:path";
import { getContentBySlug, getContentIndex } from "@/lib/content";

describe("content loading", () => {
  it("sorts blog content newest first", async () => {
    const posts = await getContentIndex("blog");
    expect(posts.map((post) => post.slug)).toEqual(["why-i-am-building-nimloth"]);
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
});
