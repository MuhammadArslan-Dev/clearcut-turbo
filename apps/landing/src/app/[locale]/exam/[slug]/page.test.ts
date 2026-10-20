import { describe, expect, it } from "vitest";

const { default: ExamPage, generateStaticParams } = await import("./page");
const render = (slug: string) => ExamPage({ params: Promise.resolve({ slug, locale: "en" }) });

describe("/exam/[slug]", () => {
  it("renders only the exact <code>-preparation slug for each exam", async () => {
    for (const { slug } of generateStaticParams()) {
      await expect(render(slug), slug).resolves.toBeTruthy();
    }
  });

  it("404s other slugs instead of rendering a second copy of the course page", async () => {
    for (const slug of ["htet-age-limit", "htet-anything", "htet", "nope-preparation"]) {
      await expect(render(slug), slug).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/);
    }
  });
});
