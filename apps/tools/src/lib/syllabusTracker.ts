// Client-only "syllabus tracker" state, backed entirely by localStorage —
// nothing here is ever sent to a server. Same safe-access pattern as
// recentExams.ts in this app: SSR guard, try/catch around parse/stringify,
// silent fallback on private-browsing/quota/corruption (tracking progress
// is a nice-to-have, never worth surfacing an error for).

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

export interface TrackedLevel {
  id: number | "full-exam";
  name: string;
}

export interface SyllabusTrackerState {
  version: 1;
  exam: TrackedExam | null;
  level: TrackedLevel | null;
  subjects: Record<string, TrackedChapter[]>;
}

const STORAGE_KEY = "cc-syllabus-tracker-v1";

const EMPTY_STATE: SyllabusTrackerState = {
  version: 1,
  exam: null,
  level: null,
  subjects: {},
};

export function getTrackerState(): SyllabusTrackerState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || parsed.version !== 1) {
      return EMPTY_STATE;
    }
    return parsed as SyllabusTrackerState;
  } catch {
    return EMPTY_STATE;
  }
}

export function saveTrackerState(state: SyllabusTrackerState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Same as above — swallow storage failures silently.
  }
}

export function resetTrackerState() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}

/** Overall completion percentage across every tracked subject/chapter. */
export function getOverallProgress(state: SyllabusTrackerState): {
  completed: number;
  total: number;
  percent: number;
} {
  const chapters = Object.values(state.subjects).flat();
  const completed = chapters.filter((c) => c.completed).length;
  const total = chapters.length;
  return {
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}
