/**
 * Acquisition attribution — the browser side (phase 70).
 *
 * The browser reports FACTS about where an OTP login started; the backend
 * (App\Services\Auth\AttributionService) validates them and derives
 * `source` / `channel` itself, so nothing here ever says "paid" or "organic".
 *
 * One mechanism, three entry points:
 *   - `setAttributionApp("landing" | "tools" | …)` — once per app
 *     (createAuthFeature({ attributionApp })).
 *   - `captureFirstLanding()` — call on app load (AuthProvider / the tools
 *     PageViewTracker). Records THIS browser's first-ever landing page,
 *     referrer, UTM and click-id presence once; later calls only refresh the
 *     session's UTM when the URL carries new ones. Landing and tools share one
 *     origin in production, so this storage is shared between them.
 *   - `setAttributionExtra({ tool: "resizer" })` — any page/feature can attach
 *     extra facts (validated + capped server-side) to the next verification.
 *
 * `getAttribution()` is attached automatically to `authApi.loginUser`,
 * `authApi.verifyOtp` and `authApi.truecallerInitiate`, so every caller (the
 * modal, /start, tool modals, anything added later) is covered with no
 * per-component code. Pure module (no React, no SDK), like ./token.
 */

export type AttributionApp = "landing" | "tools" | "blog" | "academy" | "dashboard" | "app";

export interface AttributionPayload {
  app?: AttributionApp;
  /** Normalized pathname where this request was made (locale prefix removed). */
  page?: string;
  /** This browser's first-ever landing page. */
  landing_page?: string;
  /** Host only of the first landing's referrer. */
  referrer?: string;
  locale?: "en" | "hi" | "mr";
  utm?: Partial<Record<"source" | "medium" | "campaign" | "content" | "term", string>>;
  /** Presence only — the click ids themselves are never sent or stored. */
  click_ids?: Partial<Record<"fbclid" | "gclid" | "msclkid" | "ttclid", true>>;
  extra?: Record<string, string | number | boolean>;
}

const FIRST_LANDING_KEY = "cc_attr_first_landing";
const SESSION_KEY = "cc_attr_session";
const EXTRA_KEY = "cc_attr_extra";

const UTM_KEYS = ["source", "medium", "campaign", "content", "term"] as const;
const CLICK_ID_KEYS = ["fbclid", "gclid", "msclkid", "ttclid"] as const;

let currentApp: AttributionApp | undefined;
let extra: Record<string, string | number | boolean> = {};

export function setAttributionApp(app: AttributionApp | undefined): void {
  currentApp = app;
}

export function setAttributionExtra(values: Record<string, string | number | boolean>): void {
  extra = { ...extra, ...values };
  write(sessionStorageSafe(), EXTRA_KEY, extra);
}

/** `/Tools/Resizer/TNPSC/?x=1#y` → `/tools/resizer/tnpsc`; `/hi/start` → `/start`. */
export function normalizePage(pathname: string): { page: string; locale: "en" | "hi" | "mr" } {
  let path = (pathname.split("?")[0] ?? "").split("#")[0] ?? "";
  path = path.toLowerCase().replace(/\/{2,}/g, "/");
  let locale: "en" | "hi" | "mr" = "en";

  const lead = /^\/(hi|mr)(\/|$)/.exec(path);
  if (lead) {
    locale = lead[1] as "hi" | "mr";
    path = path.slice(lead[1].length + 1) || "/";
  } else {
    const tools = /^\/tools\/(hi|mr)(\/|$)/.exec(path);
    if (tools) {
      locale = tools[1] as "hi" | "mr";
      path = `/tools${path.slice("/tools/".length + tools[1].length)}`;
    }
  }

  if (!path.startsWith("/")) path = `/${path}`;
  if (path.length > 1) path = path.replace(/\/+$/, "") || "/";
  return { page: path, locale };
}

export function referrerHost(referrer: string): string | undefined {
  try {
    const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, "");
    return host || undefined;
  } catch {
    return undefined;
  }
}

function readUrlSignals(search: string): Pick<AttributionPayload, "utm" | "click_ids"> {
  const params = new URLSearchParams(search);
  const utm: NonNullable<AttributionPayload["utm"]> = {};
  for (const k of UTM_KEYS) {
    const v = params.get(`utm_${k}`);
    if (v) utm[k] = v.slice(0, 100);
  }
  const click_ids: NonNullable<AttributionPayload["click_ids"]> = {};
  for (const k of CLICK_ID_KEYS) {
    if (params.get(k)) click_ids[k] = true;
  }
  return { utm, click_ids };
}

/** Call on app load. First call per browser stores the first landing. */
export function captureFirstLanding(): void {
  if (typeof window === "undefined") return;
  try {
    const { page } = normalizePage(window.location.pathname);
    const signals = readUrlSignals(window.location.search);

    const local = localStorageSafe();
    if (local && !local.getItem(FIRST_LANDING_KEY)) {
      write(local, FIRST_LANDING_KEY, {
        landing_page: page,
        referrer: referrerHost(document.referrer),
        ...signals,
      });
    }

    // UTM / click ids on a later URL of this session win over the stored ones.
    if (Object.keys(signals.utm ?? {}).length || Object.keys(signals.click_ids ?? {}).length) {
      write(sessionStorageSafe(), SESSION_KEY, signals);
    }
  } catch {
    /* attribution must never break a page */
  }
}

/** The payload for an auth request made right now. */
export function getAttribution(): AttributionPayload | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const { page, locale } = normalizePage(window.location.pathname);
    const first = read<{ landing_page?: string; referrer?: string } & Pick<AttributionPayload, "utm" | "click_ids">>(localStorageSafe(), FIRST_LANDING_KEY);
    const session = read<Pick<AttributionPayload, "utm" | "click_ids">>(sessionStorageSafe(), SESSION_KEY);
    const here = readUrlSignals(window.location.search);
    const storedExtra = read<Record<string, string | number | boolean>>(sessionStorageSafe(), EXTRA_KEY) ?? {};

    const pick = <T extends object>(...candidates: (T | undefined)[]): T | undefined =>
      candidates.find((c) => c && Object.keys(c).length > 0);

    const payload: AttributionPayload = {
      app: currentApp,
      page,
      landing_page: first?.landing_page ?? page,
      referrer: first?.referrer ?? referrerHost(document.referrer),
      locale,
      utm: pick(here.utm, session?.utm, first?.utm),
      click_ids: pick(here.click_ids, session?.click_ids, first?.click_ids),
      extra: { ...storedExtra, ...extra },
    };
    return JSON.parse(JSON.stringify(payload)) as AttributionPayload; // drop undefined
  } catch {
    return undefined;
  }
}

/** Facts for the browser's auth events (never source/channel — see top). */
export function attributionEventProps(): Record<string, string> {
  const a = getAttribution();
  if (!a) return {};
  const out: Record<string, string> = {};
  if (a.page) out.attribution_page = a.page;
  if (a.app) out.attribution_app = a.app;
  return out;
}

/** Spread into a request body: `{ ...data, ...withAttribution() }`. */
export function withAttribution(): { attribution?: AttributionPayload } {
  const a = getAttribution();
  return a ? { attribution: a } : {};
}

// --- storage helpers (private mode / blocked storage must never throw) ---

function localStorageSafe(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function sessionStorageSafe(): Storage | undefined {
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}

function read<T>(store: Storage | undefined, key: string): T | undefined {
  try {
    const raw = store?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

function write(store: Storage | undefined, key: string, value: unknown): void {
  try {
    store?.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}
