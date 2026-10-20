// Pure lookups over an exam's navigation tree (level -> subject -> chapter),
// in the order the backend's navigation returns it. Chapter pages render by
// exam + slug alone (the backend ignores level/subject), so every copy of the
// same chapter slug shows identical content: the canonical copy is the first
// one in navigation order. Subject pages render their level's own section
// (`sectionId`, e.g. CTET_L1_ENG vs CTET_L2_ENG under the same "english"
// slug), so a subject copy is canonical to the first level showing the same
// section. No I/O here — see load-exam-index.ts.

/** `chapters`: every chapter listed under this slug in the level (merged
 * when get-subject repeats the slug). `pageChapters`: the ones the subject
 * page itself lists — its `sectionId`'s; defaults to `chapters`. */
export type IndexSubject = { slug: string; sectionId: string; chapters: string[]; pageChapters?: string[] };
export type IndexLevel = { slug: string; subjects: IndexSubject[] };
/** `emptyChapters`: listed in navigation but with no questions anywhere —
 * still valid pages, but nothing to index. */
export type ExamIndex = { exam: string; levels: IndexLevel[]; emptyChapters?: string[] };

export type ChapterPath = { level: string; subject: string };

export type RouteResolution<T, R = T> =
  | { kind: "ok"; canonical: T; isCanonical: boolean }
  | { kind: "redirect"; to: R }
  | { kind: "notFound" };

// Old URLs sometimes carry a slug without its hyphens ("socialstudies" for
// "social-studies"); compare on letters/digits only to find the real one.
const squash = (slug: string) => slug.toLowerCase().replace(/[^a-z0-9]/g, "");

function realSubjectSlug(index: ExamIndex, subject: string): string | null {
  let loose: string | null = null;
  for (const level of index.levels) {
    for (const s of level.subjects) {
      if (s.slug === subject) return subject;
      if (!loose && squash(s.slug) === squash(subject)) loose = s.slug;
    }
  }
  return loose;
}

function realChapterSlug(index: ExamIndex, chapter: string): string | null {
  let loose: string | null = null;
  for (const level of index.levels) {
    for (const s of level.subjects) {
      for (const c of s.chapters) {
        if (c === chapter) return chapter;
        if (!loose && squash(c) === squash(chapter)) loose = c;
      }
    }
  }
  return loose;
}

export function findLevel(index: ExamIndex, level: string): IndexLevel | undefined {
  return index.levels.find((l) => l.slug === level);
}

export function canonicalChapterPath(index: ExamIndex, chapter: string): ChapterPath | null {
  for (const level of index.levels) {
    for (const subject of level.subjects) {
      if (subject.chapters.includes(chapter)) return { level: level.slug, subject: subject.slug };
    }
  }
  return null;
}

export function findSubject(index: ExamIndex, level: string, subject: string): IndexSubject | undefined {
  return findLevel(index, level)?.subjects.find((s) => s.slug === subject);
}

/** First level listing `subject` — showing `sectionId` when given. */
export function canonicalSubjectLevel(index: ExamIndex, subject: string, sectionId?: string): string | null {
  for (const level of index.levels) {
    if (level.subjects.some((s) => s.slug === subject && (sectionId === undefined || s.sectionId === sectionId))) {
      return level.slug;
    }
  }
  return null;
}

export function isChapterEmpty(index: ExamIndex, chapter: string): boolean {
  return Boolean(index.emptyChapters?.includes(chapter));
}

function hasQuestionChapters(index: ExamIndex, subject: IndexSubject): boolean {
  return subject.chapters.some((c) => !isChapterEmpty(index, c));
}

/** True when this level's subject page lists a chapter that has questions —
 * false for a section that is genuinely empty (e.g. CTET paper-2 English). */
export function subjectPageHasChapters(index: ExamIndex, level: string, subject: string): boolean {
  const s = findSubject(index, level, subject);
  return Boolean(s && (s.pageChapters ?? s.chapters).some((c) => !isChapterEmpty(index, c)));
}

export function levelHasChapters(index: ExamIndex, level: string): boolean {
  return Boolean(findLevel(index, level)?.subjects.some((s) => hasQuestionChapters(index, s)));
}

export function resolveChapterRoute(
  index: ExamIndex,
  level: string,
  subject: string,
  chapter: string,
): RouteResolution<ChapterPath, ChapterPath & { chapter: string }> {
  const real = realChapterSlug(index, chapter);
  if (!real) return { kind: "notFound" };
  const canonical = canonicalChapterPath(index, real) as ChapterPath;
  if (real !== chapter) return { kind: "redirect", to: { ...canonical, chapter: real } };

  const listed = findLevel(index, level)?.subjects.some(
    (s) => s.slug === subject && s.chapters.includes(chapter),
  );
  if (!listed) return { kind: "redirect", to: { ...canonical, chapter } };

  return {
    kind: "ok",
    canonical,
    isCanonical: canonical.level === level && canonical.subject === subject,
  };
}

export function resolveSubjectRoute(
  index: ExamIndex,
  level: string,
  subject: string,
): RouteResolution<{ level: string }, { level: string; subject: string }> {
  const real = realSubjectSlug(index, subject);
  if (!real) return { kind: "notFound" };
  const firstLevel = canonicalSubjectLevel(index, real) as string;
  if (real !== subject) return { kind: "redirect", to: { level: firstLevel, subject: real } };

  const listed = findSubject(index, level, subject);
  if (!listed) return { kind: "redirect", to: { level: firstLevel, subject } };

  const canonicalLevel = canonicalSubjectLevel(index, subject, listed.sectionId) as string;
  return { kind: "ok", canonical: { level: canonicalLevel }, isCanonical: canonicalLevel === level };
}

/** chapter slug -> "<level>/subject/<subject>/<chapter>" (its canonical path
 * after the exam segment), for the given slugs that exist in the index. */
export function canonicalChapterPathMap(index: ExamIndex, chapterSlugs: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const slug of new Set(chapterSlugs)) {
    const path = canonicalChapterPath(index, slug);
    if (path) out[slug] = `${path.level}/subject/${path.subject}/${slug}`;
  }
  return out;
}

/** Every chapter URL path that is its own canonical and has questions, in
 * navigation order. */
export function canonicalChapterPaths(index: ExamIndex): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const level of index.levels) {
    for (const subject of level.subjects) {
      for (const chapter of subject.chapters) {
        if (seen.has(chapter)) continue;
        seen.add(chapter);
        if (isChapterEmpty(index, chapter)) continue;
        out.push(`/${index.exam}/${level.slug}/subject/${subject.slug}/${chapter}`);
      }
    }
  }
  return out;
}

export type CanonicalSubject = { path: string; level: string; slug: string; sectionId: string };

/** Canonical subject pages (one per slug + section) that list a chapter with
 * questions, in navigation order. */
export function canonicalSubjects(index: ExamIndex): CanonicalSubject[] {
  const out: CanonicalSubject[] = [];
  const seen = new Set<string>();
  for (const level of index.levels) {
    for (const subject of level.subjects) {
      const key = `${subject.slug}|${subject.sectionId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (subjectPageHasChapters(index, level.slug, subject.slug)) {
        out.push({
          path: `/${index.exam}/${level.slug}/subject/${subject.slug}`,
          level: level.slug,
          slug: subject.slug,
          sectionId: subject.sectionId,
        });
      }
    }
  }
  return out;
}

/** Canonical subject URL paths that actually list chapters. */
export function canonicalSubjectPaths(index: ExamIndex): string[] {
  return canonicalSubjects(index).map((s) => s.path);
}
