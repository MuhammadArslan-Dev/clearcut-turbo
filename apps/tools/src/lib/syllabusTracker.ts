// Client-only "syllabus tracker" state, backed entirely by localStorage —
// nothing here is ever sent to a server. Same safe-access pattern as
// recentExams.ts in this app: SSR guard, try/catch around parse/stringify,
// silent fallback on private-browsing/quota/corruption (tracking progress
// is a nice-to-have, never worth surfacing an error for).
//
// v2 stores a LIST of tracked exams (a user can track more than one), where
// v1 only ever stored a single exam. v1 data is migrated in-place the first
// time it's read under this version — see migrateV1ToV2 below — and the old
// key is left untouched (never deleted) as a harmless, unused fallback.
//
// Many exams branch at the ROOT of their level tree — CTET's root nodes are
// literally grouped "Paper" (Paper 1 / Paper 2), HTET's are grouped "Level"
// (Level 1 / Level 2 / Level 3) — and in both cases a user may want to track
// more than one of those root branches independently (Paper 1 AND Paper 2;
// Level 1 AND Level 3). `paper` below is that root branch, whatever the
// backend calls it (captured straight off the API's own SyllabusLevel.group
// string, purely for display — "Add Paper" vs "Add Level" in the tracked-
// exams list). A tracked entry's real identity is exam.id + paper.id
// (paper.id is null for an exam whose root tier has only one option, i.e.
// nothing to disambiguate), not exam.id alone, so two root branches of the
// same exam can be tracked side by side instead of one overwriting the
// other. Entries written before this field existed simply have no `paper`
// key at all — every comparison treats a missing key the same as
// `paper: null`, so that old data keeps working with no migration bump
// needed (still v2).

export interface TrackedChapter {
  id: number;
  name: string;
  completed: boolean;
  revisedAt: string | null; // ISO date string (yyyy-mm-dd), or null
}

export interface TrackedExam {
  id: number;
  shortName: string;
  name: string;
}

export interface TrackedPaper {
  id: number;
  name: string;
  /** The root tier's own group label from the API (e.g. "Paper" or
   * "Level") — display-only, so the tracked-exams list can say "Add Paper"
   * for CTET and "Add Level" for HTET instead of one hardcoded word. */
  group: string | null;
}

export interface TrackedLevel {
  id: number | "full-exam";
  name: string;
}

export interface TrackedExamEntry {
  exam: TrackedExam;
  /** null when the exam's root tier has only one option — see module comment. */
  paper: TrackedPaper | null;
  level: TrackedLevel;
  subjects: Record<string, TrackedChapter[]>;
  /** subject name -> shortName of the OTHER tracked exam a subject's
   * completion was credited from (see propagateSubjectCompletion). Only
   * ever used to render a "Completed already in X" note — callers should
   * still gate display on the subject currently being 100% complete, so an
   * unchecked chapter naturally stops showing a stale badge. */
  crossCompletions?: Record<string, string>;
  trackedAt: string; // ISO timestamp — stable ordering for the tracked-exams list
}

export interface SyllabusTrackerStoreV2 {
  version: 2;
  exams: TrackedExamEntry[];
}

// --- v1 (single-exam) shape, kept only for migration --------------------
interface SyllabusTrackerStateV1 {
  version: 1;
  exam: TrackedExam | null;
  level: TrackedLevel | null;
  subjects: Record<string, TrackedChapter[]>;
}

const STORAGE_KEY_V1 = "cc-syllabus-tracker-v1";
const STORAGE_KEY_V2 = "cc-syllabus-tracker-v2";

const EMPTY_STORE: SyllabusTrackerStoreV2 = { version: 2, exams: [] };

function readV1(): SyllabusTrackerStateV1 | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_V1);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || parsed.version !== 1) return null;
    return parsed as SyllabusTrackerStateV1;
  } catch {
    return null;
  }
}

function migrateV1ToV2(v1: SyllabusTrackerStateV1): SyllabusTrackerStoreV2 {
  const hasRealExam = Boolean(v1.exam && v1.level && Object.keys(v1.subjects).length > 0);
  if (!hasRealExam || !v1.exam || !v1.level) return { version: 2, exams: [] };
  return {
    version: 2,
    exams: [
      {
        exam: v1.exam,
        paper: null,
        level: v1.level,
        subjects: v1.subjects,
        trackedAt: new Date().toISOString(),
      },
    ],
  };
}

function readStore(): SyllabusTrackerStoreV2 {
  if (typeof window === "undefined") return EMPTY_STORE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_V2);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed.version === 2 && Array.isArray(parsed.exams)) {
        return parsed as SyllabusTrackerStoreV2;
      }
    }
  } catch {
    // fall through to migration/empty
  }

  const v1 = readV1();
  if (v1) {
    const migrated = migrateV1ToV2(v1);
    writeStore(migrated);
    return migrated;
  }

  return EMPTY_STORE;
}

function writeStore(store: SyllabusTrackerStoreV2) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(store));
  } catch {
    // Same as above — swallow storage failures silently.
  }
}

/** A tracked entry's real identity — see module comment. `paperId: null`
 * matches an entry with no `paper` at all (old data) as well as one
 * explicitly stored as `paper: null`. */
function isEntry(entry: TrackedExamEntry, examId: number, paperId: number | null): boolean {
  return entry.exam.id === examId && (entry.paper?.id ?? null) === paperId;
}

export function getAllTrackedExams(): TrackedExamEntry[] {
  return readStore().exams;
}

/** Every tracked entry (one per paper, or a single paper-less entry) for one exam. */
export function getTrackedExamsByExamId(examId: number): TrackedExamEntry[] {
  return readStore().exams.filter((e) => e.exam.id === examId);
}

/** Replace-or-append by exam.id + paper.id, then persist. */
export function upsertTrackedExam(entry: TrackedExamEntry) {
  const store = readStore();
  const idx = store.exams.findIndex((e) => isEntry(e, entry.exam.id, entry.paper?.id ?? null));
  const exams = [...store.exams];
  if (idx === -1) exams.push(entry);
  else exams[idx] = entry;
  writeStore({ version: 2, exams });
}

/** Removes one specific paper's entry (or the exam's single entry, when
 * `paperId` is omitted/null) — never every paper tracked for that exam. */
export function removeTrackedExam(examId: number, paperId: number | null = null) {
  const store = readStore();
  writeStore({ version: 2, exams: store.exams.filter((e) => !isEntry(e, examId, paperId)) });
}

/** Persists a full exams array as-is — the paired half of
 * propagateSubjectCompletion, which is a pure function that returns a new
 * array without writing it anywhere itself. */
export function replaceAllTrackedExams(exams: TrackedExamEntry[]) {
  writeStore({ version: 2, exams });
}

/** Applies `updater` to one tracked exam/paper's subjects and persists.
 * Returns the updated full list (so callers can immediately run cross-exam
 * propagation against fresh data without a second read). */
export function updateTrackedExamSubjects(
  examId: number,
  paperId: number | null,
  updater: (subjects: Record<string, TrackedChapter[]>) => Record<string, TrackedChapter[]>,
): TrackedExamEntry[] {
  const store = readStore();
  const exams = store.exams.map((e) => (isEntry(e, examId, paperId) ? { ...e, subjects: updater(e.subjects) } : e));
  writeStore({ version: 2, exams });
  return exams;
}

function isSubjectComplete(chapters: TrackedChapter[]): boolean {
  return chapters.length > 0 && chapters.every((c) => c.completed);
}

/** Case/whitespace-insensitive "same section" match, per the cross-exam
 * completion requirement — "Hindi" in one exam counts as the same section
 * as "Hindi" (or " hindi ") in another. */
function sameSubjectName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** Shortname of another tracked exam where `subjectName` is already fully
 * complete, or null. Used to decide whether a freshly-loaded subject should
 * be pre-completed, and to render the "Completed already in X" badge.
 * "Other" here means a different exam+paper entry — two papers of the SAME
 * exam are also compared against each other, which is intentional: a
 * subject common to both papers of one exam is exactly as reusable as one
 * shared between two different exams. */
export function findCrossExamCompletion(
  all: TrackedExamEntry[],
  forExamId: number,
  forPaperId: number | null,
  subjectName: string,
): string | null {
  for (const entry of all) {
    if (isEntry(entry, forExamId, forPaperId)) continue;
    for (const [name, chapters] of Object.entries(entry.subjects)) {
      if (sameSubjectName(name, subjectName) && isSubjectComplete(chapters)) {
        return entry.exam.shortName;
      }
    }
  }
  return null;
}

/**
 * Call after a subject in the exam+paper identified by (sourceExamId,
 * sourcePaperId) becomes fully complete (or after a new exam/paper is
 * tracked, for each of its subjects). Finds every OTHER tracked entry with a
 * same-named subject that isn't already fully complete, marks every chapter
 * in it `completed: true`, and tags it with `crossCompletions[subjectName] =
 * <source exam's shortName>`.
 *
 * One-directional and sticky by design: unchecking a chapter later in the
 * source entry does not retract credit already given elsewhere — the point
 * is "you've already covered this material", which doesn't stop being true
 * just because a different entry's checkbox was toggled.
 */
export function propagateSubjectCompletion(
  all: TrackedExamEntry[],
  sourceExamId: number,
  sourcePaperId: number | null,
  subjectName: string,
): TrackedExamEntry[] {
  const source = all.find((e) => isEntry(e, sourceExamId, sourcePaperId));
  if (!source) return all;
  const sourceChapters = Object.entries(source.subjects).find(([name]) => sameSubjectName(name, subjectName))?.[1];
  if (!sourceChapters || !isSubjectComplete(sourceChapters)) return all;

  return all.map((entry) => {
    if (isEntry(entry, sourceExamId, sourcePaperId)) return entry;
    const match = Object.entries(entry.subjects).find(([name]) => sameSubjectName(name, subjectName));
    if (!match) return entry;
    const [matchName, matchChapters] = match;
    if (isSubjectComplete(matchChapters)) return entry;

    return {
      ...entry,
      subjects: {
        ...entry.subjects,
        [matchName]: matchChapters.map((c) => ({ ...c, completed: true })),
      },
      crossCompletions: { ...entry.crossCompletions, [matchName]: source.exam.shortName },
    };
  });
}

/** Overall completion percentage across every subject/chapter in one tracked exam. */
export function getOverallProgress(entry: TrackedExamEntry): {
  completed: number;
  total: number;
  percent: number;
} {
  const chapters = Object.values(entry.subjects).flat();
  const completed = chapters.filter((c) => c.completed).length;
  const total = chapters.length;
  return {
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}
