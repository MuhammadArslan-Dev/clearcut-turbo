/**
 * Sentry tags that split ad traffic from organic on the public sites
 * (CC-144): `exam`, `utm_campaign`, `has_fbclid`, `in_app_browser`.
 * Only non-sensitive values: the campaign name and a yes/no for fbclid —
 * never the click id itself.
 */

const EXAMS: readonly (readonly [RegExp, string])[] = [
  [/(^|[-_/])ugc-?net($|[-_/])/, "ugcnet"],
  [/(^|[-_/])mahatet($|[-_/])/, "mahatet"],
  [/(^|[-_/])hptet($|[-_/])/, "hptet"],
  [/(^|[-_/])htet($|[-_/])/, "htet"],
  [/(^|[-_/])ctet($|[-_/])/, "ctet"],
  [/(^|[-_/])up-?tet($|[-_/])/, "uptet"],
  [/(^|[-_/])reet($|[-_/])/, "reet"],
];

export type TrafficTags = {
  exam: string;
  utm_campaign: string;
  has_fbclid: "yes" | "no";
  in_app_browser: "facebook" | "instagram" | "none";
  /** CC-197: only when the visit came through the "Continue in Chrome" jump (`ccv` param), e.g. `chrome_offer`. */
  lp_variant?: string;
};

/** Pure: tags for a landing URL + user agent. */
export function trafficTags(url: string, userAgent: string): TrafficTags {
  let path = "";
  let params = new URLSearchParams();
  try {
    const parsed = new URL(url, "https://placeholder.invalid");
    path = parsed.pathname.toLowerCase();
    params = parsed.searchParams;
  } catch {
    // keep the defaults
  }
  const examParam = (params.get("exam") ?? "").toLowerCase();
  const exam = EXAMS.find(([pattern]) => pattern.test(path) || pattern.test(`/${examParam}/`))?.[1] ?? "none";

  // Letters, digits and underscores only: it comes from the URL.
  const variant = (params.get("ccv") ?? "").trim();
  const lp_variant = /^[a-z0-9_]{1,40}$/i.test(variant) ? variant : undefined;

  return {
    exam,
    utm_campaign: (params.get("utm_campaign") ?? "").slice(0, 200) || "none",
    has_fbclid: params.has("fbclid") ? "yes" : "no",
    in_app_browser: /Instagram/i.test(userAgent) ? "instagram" : /FBAN|FBAV|FB_IAB|FBIOS/i.test(userAgent) ? "facebook" : "none",
    ...(lp_variant ? { lp_variant } : {}),
  };
}

let landing: TrafficTags | null = null;

/**
 * The tags of the page the visit landed on. Captured the first time this
 * runs (call it at module load, before a router.replace can strip the
 * query), then reused for every later event of the page.
 */
export function landingTrafficTags(): TrafficTags | null {
  if (landing) return landing;
  if (typeof window === "undefined") return null;
  landing = trafficTags(window.location.href, navigator.userAgent);
  return landing;
}
