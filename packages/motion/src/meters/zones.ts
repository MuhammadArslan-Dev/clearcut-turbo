/**
 * Cutoff Meter — pure zone logic (no React). Ported 1:1 from the Cutoff Meter Studio
 * (zones relative to the student's own cutoff; HTET L2 General default: 90 / 150).
 */

export type Lang = "en" | "hi";
export type Text = string | { en: string; hi?: string };
export type ZoneKey = "need" | "almost" | "clear" | "safe" | "locked";
export type MeterVariant = "gauge" | "bar";
export type MeterSize = "lg" | "sm";

export interface MeterScale {
  /** Paper total (default 150). */
  max: number;
  /** The student's cutoff (default 90 = 60% for General). */
  cutoff: number;
}

export const DEFAULT_SCALE: MeterScale = { max: 150, cutoff: 90 };

export interface Zone {
  /** main colour (fill, needle knob, band) */
  c: string;
  /** soft colour (segment track, pill background) */
  s: string;
  /** text colour on the pill */
  ink: string;
  lab: { en: string; hi: string };
}

export const ZONES: Record<ZoneKey, Zone> = {
  need: { c: "#f04438", s: "#fdecea", ink: "#b42318", lab: { en: "Needs work", hi: "मेहनत ज़रूरी" } },
  almost: { c: "#f79009", s: "#fef0c7", ink: "#b54708", lab: { en: "Almost there", hi: "बस थोड़ा और" } },
  clear: { c: "#12b76a", s: "#e3f8ee", ink: "#067a46", lab: { en: "Clear Zone", hi: "क्लियर ज़ोन" } },
  safe: { c: "#067a46", s: "#fff6db", ink: "#067a46", lab: { en: "Safe Zone ★", hi: "सेफ़ ज़ोन ★" } },
  locked: { c: "#b7c7d8", s: "#eef2f6", ink: "#566c82", lab: { en: "Locked", hi: "लॉक है" } },
};

/** Pill shown while the range is still wide (band ≥ 12). */
export const EARLY_ESTIMATE = { s: "#e8f2fb", ink: "#005cb8", lab: { en: "Early estimate", hi: "शुरुआती अनुमान" } };
export const EARLY_BAND = 12;

/** Translate a {en, hi} pair (falls back to en). */
export function tr(o: Text | null | undefined, lang: Lang): string {
  if (o == null) return "";
  if (typeof o === "string") return o;
  return (lang === "hi" ? o.hi : o.en) || o.en;
}

/** need < cutoff−15 ≤ almost < cutoff ≤ clear < cutoff+10 ≤ safe. null = locked. */
export function zoneOf(v: number | null | undefined, scale: MeterScale = DEFAULT_SCALE): ZoneKey {
  const cut = scale.cutoff;
  if (v == null) return "locked";
  if (v < cut - 15) return "need";
  if (v < cut) return "almost";
  if (v < cut + 10) return "clear";
  return "safe";
}

export type Segment = [from: number, to: number, zone: Exclude<ZoneKey, "locked">];

export function segments(scale: MeterScale = DEFAULT_SCALE): Segment[] {
  const { max, cutoff } = scale;
  return [
    [0, cutoff - 15, "need"],
    [cutoff - 15, cutoff, "almost"],
    [cutoff, cutoff + 10, "clear"],
    [cutoff + 10, max, "safe"],
  ];
}

/** "8 marks to the Clear Zone" / "+4 above the cutoff" / unlock hint. */
export function gapText(score: number | null | undefined, scale: MeterScale = DEFAULT_SCALE): { en: string; hi: string } {
  if (score == null) return { en: "Answer 5 questions to unlock", hi: "अनलॉक करने के लिए 5 सवाल हल करें" };
  const d = scale.cutoff - score;
  if (d > 0) return { en: `${d} marks to the Clear Zone`, hi: `क्लियर ज़ोन से ${d} अंक दूर` };
  return { en: `+${-d} above the cutoff`, hi: `कटऑफ़ से ${-d} अंक ऊपर` };
}

/** Rider Nibbu on the fill bar, per zone. */
export function riderPose(z: ZoneKey): [mood: "happy" | "determined", accessory: "none" | "headband" | "cap" | "star"] {
  if (z === "need") return ["determined", "headband"];
  if (z === "almost") return ["determined", "none"];
  if (z === "clear") return ["happy", "cap"];
  if (z === "safe") return ["happy", "star"];
  return ["happy", "none"];
}

/* ---------- gauge geometry (SVG viewBox 0 -6 240 150) ---------- */
export const CX = 120;
export const CY = 128;
export const R = 100;

export function pt(v: number, r: number, max: number): string {
  const a = Math.PI * (1 - v / max);
  return `${(CX + r * Math.cos(a)).toFixed(2)} ${(CY - r * Math.sin(a)).toFixed(2)}`;
}

export function arc(v1: number, v2: number, r: number, max: number): string {
  return `M${pt(v1, r, max)} A${r} ${r} 0 0 1 ${pt(v2, r, max)}`;
}
