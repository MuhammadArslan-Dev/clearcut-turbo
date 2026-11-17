// Targeting attributes sent to GrowthBook (CC-192). Only what the ticket lists; empty values are dropped so a missing
// value never becomes the string "undefined" in a targeting rule.

export type ExperimentAttributes = {
  /** Sticky experiment id: what GrowthBook hashes to pick the variant. */
  id: string;
  user_id?: string;
  exam?: string;
  utm_source?: string;
  utm_campaign?: string;
  locale?: string;
  platform?: "mobile" | "desktop";
  is_logged_in?: boolean;
  is_paid?: boolean;
  plan_type?: string;
};

export function cleanAttributes<T extends Record<string, unknown>>(input: T): Record<string, string | boolean | number> {
  const out: Record<string, string | boolean | number> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null || value === "") continue;
    if (typeof value === "string" || typeof value === "boolean" || typeof value === "number") out[key] = value;
  }
  return out;
}

export function utmFromSearch(search: string): Pick<ExperimentAttributes, "utm_source" | "utm_campaign"> {
  const params = new URLSearchParams(search);
  const clip = (v: string | null) => (v ? v.slice(0, 100) : undefined);
  return { utm_source: clip(params.get("utm_source")), utm_campaign: clip(params.get("utm_campaign")) };
}

/** Same split the landing Amplitude helper already uses ("Mobile Web" / "Desktop Web"). */
export function platformFromUserAgent(userAgent: string): "mobile" | "desktop" {
  return /iPhone|iPad|iPod|Android/i.test(userAgent) ? "mobile" : "desktop";
}

/** The exam slug of an exam landing page (`/exam/htet`, `/hi/exam/ctet`); undefined elsewhere. */
export function examFromPathname(pathname: string): string | undefined {
  const m = pathname.match(/^\/(?:(?:hi|mr)\/)?exam\/([a-z0-9-]{1,40})(?:\/|$)/i);
  return m ? m[1].toLowerCase() : undefined;
}

/** `/hi/...` and `/mr/...` are prefixed locales, everything else is the default (en). */
export function localeFromPathname(pathname: string, supported: readonly string[] = ["hi", "mr"]): string {
  const first = pathname.split("/")[1]?.toLowerCase();
  return first && supported.includes(first) ? first : "en";
}
