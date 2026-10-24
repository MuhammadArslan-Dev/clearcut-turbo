import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { QUESTION_PAGE_REVALIDATE } from "./route-cache";

// Next reads `revalidate` statically from each route file, so it can't be
// imported from one place; this keeps all six question-bank routes cached
// (ISR) with the same window.
const ROUTES = [
  "subject/[subject_id]/page.tsx",
  "subject/[subject_id]/page/[page]/page.tsx",
  "subject/[subject_id]/[chapter_name]/page.tsx",
  "subject/[subject_id]/[chapter_name]/page/[page]/page.tsx",
  "year/[year_id]/page.tsx",
  "year/[year_id]/page/[page]/page.tsx",
].map((p) => path.resolve(__dirname, "../../app/[locale]/(blog)/[examName]/[level_id]", p));

describe("question-bank route caching", () => {
  it.each(ROUTES)("%s is cached and regenerated every QUESTION_PAGE_REVALIDATE seconds", (file) => {
    const source = readFileSync(file, "utf8");
    expect(source).toContain(`export const revalidate = ${QUESTION_PAGE_REVALIDATE};`);
    // An empty generateStaticParams is what lets Next cache paths rendered at runtime.
    expect(source).toMatch(/export async function generateStaticParams\(\) \{\s*return \[\];\s*\}/);
    // Anything that opts back into per-request rendering would undo it.
    expect(source).not.toMatch(/dynamic\s*=\s*["']force-dynamic["']/);
  });

  it("regenerates at most once a day (content changes revalidate on demand)", () => {
    expect(QUESTION_PAGE_REVALIDATE).toBeGreaterThanOrEqual(3600);
    // At most a week: freshness comes from /api/revalidate, this is the
    // safety net (Hobby ISR write budget, see route-cache.ts).
    expect(QUESTION_PAGE_REVALIDATE).toBeLessThanOrEqual(604800);
  });
});
