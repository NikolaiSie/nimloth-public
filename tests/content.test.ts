import { getContentBySlug, getContentIndex } from "@/lib/content";

describe("content loading", () => {
  it("sorts blog content newest first", async () => {
    const posts = await getContentIndex("blog");
    expect(posts.map((post) => post.slug)).toEqual([
      "why-i-am-building-nimloth",
      "launch-notes",
      "why-cloud-run",
    ]);
  });

  it("renders research markdown into html", async () => {
    const article = await getContentBySlug("research", "infrastructure-boundary");
    expect(article).not.toBeNull();
    expect(article?.contentHtml).toContain("<h2>Constraint</h2>");
  });
});
