import {
  isChapterEmpty,
  resolveChapterRoute,
  resolveSubjectRoute,
  subjectPageHasChapters,
  type ChapterPath,
} from "./exam-index";
import { tryLoadExamIndex } from "./load-exam-index";

/** Canonical level/subject for a chapter URL (the URL's own pair when
 * unknown), and whether the chapter has no questions. */
export async function canonicalChapter(
  exam: string,
  level: string,
  subject: string,
  chapter: string,
): Promise<ChapterPath & { empty: boolean }> {
  const index = await tryLoadExamIndex(exam);
  const r = index ? resolveChapterRoute(index, level, subject, chapter) : null;
  const empty = Boolean(index && isChapterEmpty(index, chapter));
  if (r?.kind === "ok") return { ...r.canonical, empty };
  if (r?.kind === "redirect") return { level: r.to.level, subject: r.to.subject, empty };
  return { level, subject, empty: false };
}

/** Canonical level for a subject URL (the first level showing the same
 * section), and whether this page's own section lists no chapter with
 * questions. */
export async function canonicalSubject(
  exam: string,
  level: string,
  subject: string,
): Promise<{ level: string; empty: boolean }> {
  const index = await tryLoadExamIndex(exam);
  const r = index ? resolveSubjectRoute(index, level, subject) : null;
  if (index && r?.kind === "ok") {
    return { level: r.canonical.level, empty: !subjectPageHasChapters(index, level, subject) };
  }
  // A redirecting URL is never rendered; its metadata only needs a level.
  if (r?.kind === "redirect") return { level: r.to.level, empty: false };
  return { level, empty: false };
}
