// Client-only "recently viewed exam" memory, backed by localStorage. Stores
// the small record a card needs to render (slug/shortName/photoSpec)
// directly — not just the slug — so displaying the row never needs to pull
// in resizerExams.ts (and its ~120-exam dataset) on the client.
export interface RecentExamEntry {
  slug: string;
  shortName: string;
  photoSpec: { widthPx: number; heightPx: number; minKB: number; maxKB: number };
}

const STORAGE_KEY = "cc-resizer-recent-exams";
const MAX_ENTRIES = 6;

export function getRecentExams(): RecentExamEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Private browsing / disabled storage / corrupted JSON — recency is a
    // nice-to-have, never worth surfacing an error for.
    return [];
  }
}

export function pushRecentExam(entry: RecentExamEntry) {
  if (typeof window === "undefined") return;
  try {
    const deduped = getRecentExams().filter((e) => e.slug !== entry.slug);
    const next = [entry, ...deduped].slice(0, MAX_ENTRIES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Same as above — swallow storage failures silently.
  }
}
