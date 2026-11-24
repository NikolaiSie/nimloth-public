import { promises as fs } from "node:fs";
import path from "node:path";
import {
  type ContentEntry,
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
      "cleaning-the-covariance-matrix",
      "momentum",
      "why-i-am-building-nimloth",
    ]);
  });

  it("labels a post with its own calendar date in any time zone", async () => {
    // "2026-11-09" is midnight UTC; formatting it in a zone west of UTC used to give November 8.
    const posts = await getContentIndex("blog");
    expect(posts.find((post) => post.slug === "momentum")?.publishedAtLabel).toBe("November 9, 2026");
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

  it("renders TeX math with KaTeX and still strips raw html", async () => {
    const slug = "math-rendering-test";
    const filePath = path.join(process.cwd(), "content", "research", `${slug}.md`);

    try {
      await fs.writeFile(
        filePath,
        [
          "---",
          "title: Math",
          "summary: Test fixture",
          "publishedAt: 2026-07-30",
          "---",
          "",
          "Inline $\\lambda_k$ and a display:",
          "",
          "$$",
          "\\xi_k = \\frac{\\lambda_k}{q}",
          "$$",
          "",
          "<img src=\"x\" onerror=\"alert('xss')\">",
          "",
          "```python",
          "x = 1",
          "```",
        ].join("\n"),
        "utf8",
      );

      const html = htmlOf(await getContentBySlug("research", slug));
      expect(html).toContain('class="katex"');
      expect(html).toContain('class="katex-display"');
      expect(html).not.toContain("$$");
      expect(html).not.toContain("onerror=");
      expect(html).toContain('class="language-python"');
    } finally {
      await fs.unlink(filePath).catch(() => undefined);
    }
  });

  it("links numbered citations to the reference list", async () => {
    const slug = "citation-links-test";
    const filePath = path.join(process.cwd(), "content", "research", `${slug}.md`);

    try {
      await fs.writeFile(
        filePath,
        [
          "---",
          "title: Citations",
          "summary: Test fixture",
          "publishedAt: 2026-07-30",
          "---",
          "",
          "One source [1], two sources [1, 2], and [3] has no reference.",
          "",
          "Math stays math: $x_{[1]}$ and `code [2]`.",
          "",
          "## References",
          "",
          "1. First, A. (2020). A paper.",
          "2. Second, B. (2021). Another paper.",
        ].join("\n"),
        "utf8",
      );

      const html = htmlOf(await getContentBySlug("research", slug));
      expect(html).toContain('[<a href="#ref-1" class="citation">1</a>]');
      expect(html).toContain(
        '[<a href="#ref-1" class="citation">1</a>, <a href="#ref-2" class="citation">2</a>]',
      );
      expect(html).toContain("[3] has no reference");
      expect(html).toContain("<code>code [2]</code>");
      expect(html).not.toContain('href="#ref-1" class="citation">1</a>]</span>');
      expect(html).toContain('<li id="ref-1">');
      expect(html).toContain('<li id="ref-2">');
    } finally {
      await fs.unlink(filePath).catch(() => undefined);
    }
  });

  it("links the momentum post's author-year citations to its references", async () => {
    const html = htmlOf(await getContentBySlug("blog", "momentum"));
    expect(html).toContain('(<a href="#ref-ince-2006" class="citation">Ince &#x26; Porter, 2006</a>)');
    expect(html).toContain('<a href="#ref-han-2016" class="citation">Han, Zhou &#x26; Zhu, 2016</a>');
    expect(html).toContain('month; <a href="#ref-jegadeesh-1990" class="citation">Jegadeesh, 1990</a>)');
    for (const key of ["daniel-2016", "dichev-2011", "han-2016", "ince-2006", "jegadeesh-1990"]) {
      expect(html).toContain(`<li id="ref-${key}">`);
      expect(html).toContain(`href="#ref-${key}"`);
    }
    // A date is not a citation, and the reference list doesn't link to itself.
    expect(html).toContain("(Nov 7, 2026)");
    expect(html.match(/class="citation"/gu)).toHaveLength(5);
  });

  it("links only author-year citations that match a reference", async () => {
    const slug = "author-year-test";
    const filePath = path.join(process.cwd(), "content", "research", `${slug}.md`);

    try {
      await fs.writeFile(
        filePath,
        [
          "---",
          "title: Author-year",
          "summary: Test fixture",
          "publishedAt: 2026-07-30",
          "---",
          "",
          "Cited (Smith et al., 2020) and (Müller and Jones, 2019), but not (Brown, 2001) or [1].",
          "",
          "## References",
          "",
          "- Smith, A., Lee, B., & Kim, C. (2020). A paper.",
          "- Müller, D., & Jones, E. (2019). Another paper.",
        ].join("\n"),
        "utf8",
      );

      const html = htmlOf(await getContentBySlug("research", slug));
      expect(html).toContain('<a href="#ref-smith-2020" class="citation">Smith et al., 2020</a>');
      expect(html).toContain('<a href="#ref-muller-2019" class="citation">Müller and Jones, 2019</a>');
      expect(html).toContain("(Brown, 2001) or [1]");
      expect(html).toContain('<li id="ref-smith-2020">');
      expect(html).toContain('<li id="ref-muller-2019">');
    } finally {
      await fs.unlink(filePath).catch(() => undefined);
    }
  });

  it("links the covariance post's narrative and parenthetical citations", async () => {
    const html = htmlOf(await getContentBySlug("blog", "cleaning-the-covariance-matrix"));
    expect(html).toContain('<a href="#ref-bun-2017" class="citation">Bun, Bouchaud and Potters (2017)</a>');
    expect(html).toContain('<a href="#ref-boyd-2017" class="citation">Boyd et al. (2017)</a>');
    expect(html).toContain('<a href="#ref-xiao-2024" class="citation">Xiao et al., 2024</a>');
    for (const key of ["boyd-2017", "bun-2017", "ledoit-2020", "marchenko-1967", "plerou-2002", "reimers-2019", "xiao-2024"]) {
      expect(html).toContain(`<li id="ref-${key}">`);
      expect(html).toContain(`href="#ref-${key}"`);
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
