import { promises as fs } from "node:fs";
import path from "node:path";
import {
  type ContentEntry,
  compareBlogCardOrder,
  getContentBySlug,
  getContentIndex,
} from "@/lib/content";

function htmlOf(article: ContentEntry | null) {
  return (article?.segments ?? [])
    .map((segment) => (segment.kind === "html" ? segment.html : `[[${segment.name}]]`))
    .join("");
}

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
    expect(htmlOf(article)).toContain("<p>");
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
      expect(htmlOf(article)).toContain("<h1>Title</h1>");
      expect(htmlOf(article)).not.toContain("<script>");
      expect(htmlOf(article)).not.toContain("onerror=");
      expect(htmlOf(article)).not.toContain("javascript:alert");
    } finally {
      await fs.unlink(filePath).catch(() => undefined);
    }
  });

  it("splits content at embed markers, in document order", async () => {
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
          "",
          "{{ cumulative }}",
          "",
          "{{unknown}}",
        ].join("\n"),
        "utf8",
      );

      const article = await getContentBySlug("research", slug);
      const segments = article?.segments ?? [];

      expect(segments.map((segment) => segment.kind)).toEqual([
        "html",
        "embed",
        "html",
        "embed",
        "html",
      ]);
      expect(segments[0]).toMatchObject({ kind: "html" });
      expect(segments[0].kind === "html" && segments[0].html).toContain("Intro paragraph.");
      expect(segments[1]).toEqual({ kind: "embed", name: "heatmap" });
      const middle = segments[2].kind === "html" ? segments[2].html : "";
      expect(middle).toContain("<h2>Below the chart</h2>");
      expect(middle).toContain('<img src="/blog/momentum/chart.png" alt="Chart">');
      expect(middle).not.toContain("Intro paragraph.");
      expect(segments[3]).toEqual({ kind: "embed", name: "cumulative" });
      expect(segments[4].kind === "html" && segments[4].html).toContain("{{unknown}}");
    } finally {
      await fs.unlink(filePath).catch(() => undefined);
    }
  });

  it("renders a post without markers as a single html segment", async () => {
    const article = await getContentBySlug("blog", "why-i-am-building-nimloth");
    expect(article?.segments.map((segment) => segment.kind)).toEqual(["html"]);
  });

  it("marks paragraphs starting with an asterisk as notes", async () => {
    const article = await getContentBySlug("blog", "momentum");
    expect(htmlOf(article)).toContain('<p class="note">* The columns have forward returns');
    expect(htmlOf(article)).not.toContain('<p class="note">Data is');
  });

  it("places the momentum post's embeds in order", async () => {
    const article = await getContentBySlug("blog", "momentum");
    const embeds = (article?.segments ?? []).flatMap((segment) =>
      segment.kind === "embed" ? [segment.name] : [],
    );
    expect(embeds).toEqual(["heatmap", "cumulative"]);

    // The cumulative plotter sits directly above the references.
    const segments = article?.segments ?? [];
    const plotter = segments.findIndex((segment) => segment.kind === "embed" && segment.name === "cumulative");
    const after = segments[plotter + 1];
    expect(after?.kind === "html" && after.html.trimStart().startsWith("<h2")).toBe(true);
    expect(after?.kind === "html" && after.html).toContain("References");
  });
});
