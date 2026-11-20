// CC-174 (phase 121) pure rules, unit-tested in logic.test.ts.

import type { SavedImageKind } from "./api";

/** Which saved kind a resizer preset uses. Only Photo and the Signature tile (`draw`) are saved (CC-174). */
export function kindForPreset(preset: string): SavedImageKind | null {
  if (preset === "photo") return "photo";
  if (preset === "draw") return "signature";
  return null;
}

// ---------------------------------------------------------------- download count
// CC-174: "first download stays free; OTP on the 2nd download". Counted per browser.

const COUNT_KEY = "cc-tools-downloads-v1";

export function readDownloadCount(storage: Pick<Storage, "getItem"> | null = safeLocalStorage()): number {
  try {
    const n = Number.parseInt(storage?.getItem(COUNT_KEY) ?? "0", 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function bumpDownloadCount(storage: Pick<Storage, "getItem" | "setItem"> | null = safeLocalStorage()): void {
  try {
    storage?.setItem(COUNT_KEY, String(readDownloadCount(storage) + 1));
  } catch {
    /* no storage: every download counts as the first (fail-open, never block a download) */
  }
}

/** The second-download gate asks for OTP only when there is no session and a download already happened. */
export function needsSecondDownloadGate(previousDownloads: number, hasSession: boolean): boolean {
  return !hasSession && previousDownloads >= 1;
}

function safeLocalStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- consent checkbox state
// The checkbox lives inside the shared login modal (LoginCopy.extraContent); the
// download code reads it after verification. Unticked by default: consent is opt-in.

let consent = false;
const listeners = new Set<() => void>();

export function getSaveConsent(): boolean {
  return consent;
}

export function setSaveConsent(value: boolean): void {
  consent = value;
  listeners.forEach((l) => l());
}

export function subscribeSaveConsent(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ---------------------------------------------------------------- one-click build

export interface CropRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

/** The largest centred crop of the source with the target's aspect ratio (what one-click uses instead of the manual crop). */
export function centerCrop(srcW: number, srcH: number, outW: number, outH: number): CropRect {
  if (srcW <= 0 || srcH <= 0 || outW <= 0 || outH <= 0) return { sx: 0, sy: 0, sw: Math.max(srcW, 0), sh: Math.max(srcH, 0) };
  const target = outW / outH;
  if (srcW / srcH > target) {
    const sw = Math.round(srcH * target);
    return { sx: Math.round((srcW - sw) / 2), sy: 0, sw, sh: srcH };
  }
  const sh = Math.round(srcW / target);
  return { sx: 0, sy: Math.round((srcH - sh) / 2), sw: srcW, sh };
}

/** Longest side of the original kept on the account (re-encoded in the browser, which also drops EXIF / GPS). */
export const ORIGINAL_MAX_SIDE = 3000;

export function scaledSize(w: number, h: number, maxSide = ORIGINAL_MAX_SIDE): { width: number; height: number } {
  const longest = Math.max(w, h);
  if (longest <= maxSide) return { width: w, height: h };
  const f = maxSide / longest;
  return { width: Math.max(1, Math.round(w * f)), height: Math.max(1, Math.round(h * f)) };
}

// ---------------------------------------------------------------- other exams

export interface CrossExam {
  slug: string;
  shortName: string;
  spec: { widthPx: number; heightPx: number; minKB: number; maxKB: number };
}

interface ExamLike {
  slug: string;
  shortName: string;
  photoSpec?: CrossExam["spec"] | null;
  signatureSpec?: CrossExam["spec"] | null;
  documents?: { type: string; mode: string; spec: CrossExam["spec"] | null }[];
}

/**
 * Other exams that can be built in one click for this kind: same category, not this exam, the
 * document is an upload (not a live capture) with a usable size. Max `limit`, in category order.
 */
export function crossExamsFor(kind: SavedImageKind, currentSlug: string | undefined, exams: ExamLike[], limit = 3): CrossExam[] {
  const docType = kind === "photo" ? "photo" : "signature";
  const out: CrossExam[] = [];
  for (const exam of exams) {
    if (exam.slug === currentSlug) continue;
    const doc = exam.documents?.find((d) => d.type === docType);
    if (doc && doc.mode !== "upload") continue;
    const spec = doc?.spec ?? (kind === "photo" ? exam.photoSpec : exam.signatureSpec);
    if (!spec || spec.widthPx < 1 || spec.heightPx < 1 || spec.maxKB < 1) continue;
    out.push({ slug: exam.slug, shortName: exam.shortName, spec });
    if (out.length >= limit) break;
  }
  return out;
}
