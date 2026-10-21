import { levelHasChapters, type ExamIndex } from "@/lib/seo/exam-index";
import { englishOnly, withLocales, type SitemapEntry } from "./xml";

export { yearSlug } from "./question-pages";

/** `hindi`: the CMS has the post's own Hindi copy, so /hi is a real version. */
export type SitemapPost = { slug: string; lastmod?: string; hindi?: boolean };

/**
 * Exam-level pages. Subject and year question pages come in pre-built
 * (`questionPages`, see question-pages.ts): every page of each, at canonical
 * paths, with <lastmod> from real question content timestamps. Blog posts
 * carry their CMS date. Listing pages (exam, level, /year, /subject) have no
 * content timestamp, so no <lastmod>. Question pages list their /hi URL only
 * where /hi shows real Hindi questions (pagedEntries); listing pages stay
 * English-only (their /hi copy canonicalizes to English); the blog listing
 * and posts get their /hi URL only when there is Hindi CMS copy.
 */
export function examStructureEntries(
  origin: string,
  index: ExamIndex,
  posts: SitemapPost[],
  questionPages: { subjects: SitemapEntry[]; years: SitemapEntry[] },
): SitemapEntry[] {
  const exam = index.exam;
  const blogListing = [`/${exam}/blog`];
  const paths = [`/${exam}`];
  for (const level of index.levels) {
    const base = `/${exam}/${level.slug}`;
    paths.push(base, `${base}/year`);
    if (levelHasChapters(index, level.slug)) paths.push(`${base}/subject`);
  }

  return [
    ...englishOnly(origin, paths),
    ...questionPages.years,
    ...questionPages.subjects,
    ...(posts.some((p) => p.hindi) ? withLocales(origin, blogListing) : englishOnly(origin, blogListing)),
    ...posts.flatMap((p) => (p.hindi ? withLocales : englishOnly)(origin, [`/${exam}/blog/${p.slug}`], p.lastmod)),
  ];
}
