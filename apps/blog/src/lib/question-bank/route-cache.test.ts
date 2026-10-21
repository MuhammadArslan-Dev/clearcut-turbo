import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Next reads route-segment options statically from each route file, so they
// can't be imported from one place; this keeps all six question-bank routes
// fully prerendered (see route-cache.ts).
const ROUTES = [
  ["subject/[subject_id]/page.tsx", "subjectStaticParams(true)"],
  ["subject/[subject_id]/page/[page]/page.tsx", "subjectStaticParams(false)"],
  ["subject/[subject_id]/[chapter_name]/page.tsx", "chapterStaticParams(true)"],
  ["subject/[subject_id]/[chapter_name]/page/[page]/page.tsx", "chapterStaticParams(false)"],
  ["year/[year_id]/page.tsx", "yearStaticParams(true)"],
  ["year/[year_id]/page/[page]/page.tsx", "yearStaticParams(false)"],
].map(([p, call]) => [path.resolve(__dirname, "../../app/[locale]/(blog)/[examName]/[level_id]", p), call]);

describe("question-bank route caching", () => {
  it.each(ROUTES)("%s prerenders every URL and never revalidates in the Worker", (file, call) => {
    const source = readFileSync(file, "utf8");
    // Every URL is listed, so `next build` renders them all.
    expect(source).toContain(`return ${call};`);
    // Time-based ISR would re-render the page inside the Worker (10 ms CPU limit).
    expect(source).not.toMatch(/export const revalidate\s*=/);
    // Anything that opts back into per-request rendering would undo it.
    expect(source).not.toMatch(/dynamic\s*=\s*["']force-dynamic["']/);
  });
});
