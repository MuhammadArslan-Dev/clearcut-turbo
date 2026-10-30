// Reads the two download-gate flags (`hard_gate`, `soft_gate`) from Amplitude
// Experiment for ONE exam / page (phase 71 §12). Plain fetch against the client
// endpoint (no SDK, no new dependency — the same request phase 66 documented):
//
//   GET https://api.lab.amplitude.com/sdk/v2/vardata?flag_keys=hard_gate,soft_gate
//   Authorization: Api-Key <client deployment key>
//   X-Amp-Exp-User: base64(JSON { user_id: <scope id>, device_id })
//
// HOW AN EXAM IS TARGETED (verified against the real endpoint, 2026-10-30):
// remote evaluation does NOT match custom user properties (`user_properties.exam`,
// a top-level `exam`, `context`) — a segment on them never fires — but it does
// match the built-in `user_id`. So each page evaluates as a "scope id":
//     exam page          → tools:exam:<slug>        e.g. tools:exam:tnpsc
//     any other tool page → tools:tool:<tool_name>   e.g. tools:tool:image-compressor
// and the flag's segment is "User ID is one of [tools:exam:tnpsc, …]". No real user
// ever has such an id, so nothing leaks between exams or onto real users. The
// answer is cached per scope id. Nothing here throws: no key, network error,
// non-200, bad JSON, timeout → `null` → Legacy (see downloadMode.ts).

import { logAmplitudeEvent } from "./toolsAnalytics";
import type { DownloadFlags } from "./downloadMode";

/** Public CLIENT deployment key `testing_price_99` (project 673721), shipped to every browser by design. */
export const DEFAULT_EXPERIMENT_DEPLOYMENT_KEY = "client-pRpnI5vqt36xQQ76zn6lb0mAi6ndv6qV";
/** How long a Download tap waits for an unfinished evaluation before going Legacy. */
export const EXPERIMENT_TIMEOUT_MS = 1500;
const CACHE_TTL_MS = 10 * 60 * 1000;
const FLAG_KEYS = ["hard_gate", "soft_gate"] as const;

export interface FlagContext {
  /** Exam slug (e.g. "tnpsc"); undefined on pages that are not an exam page. */
  exam?: string | null;
  /** resizer | image-compressor | signature-compressor | add-name-date */
  tool: string;
  /** Normalised page path, e.g. /tools/resizer/tnpsc (analytics only — not part of targeting). */
  page: string;
}

/** `NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_KEY` overrides the key; the literal "off" switches evaluation off (= Legacy). */
export function experimentDeploymentKey(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_KEY ?? "").trim();
  if (fromEnv.toLowerCase() === "off") return "";
  return fromEnv || DEFAULT_EXPERIMENT_DEPLOYMENT_KEY;
}

function vardataUrl(): string {
  const eu = (process.env.NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_SERVER_ZONE ?? "").toLowerCase() === "eu";
  return `https://${eu ? "api.lab.eu.amplitude.com" : "api.lab.amplitude.com"}/sdk/v2/vardata?flag_keys=${FLAG_KEYS.join(",")}`;
}

/** The id a page is evaluated as — and the value to put in the flag's "User ID is one of" segment. */
export function flagScopeId(ctx: FlagContext): string {
  return ctx.exam ? `tools:exam:${ctx.exam.trim().toLowerCase()}` : `tools:tool:${ctx.tool}`;
}

export function flagCacheKey(ctx: FlagContext): string {
  return flagScopeId(ctx);
}

// A persisted random id: the flags are targeted by scope id, not bucketed per
// person, so any stable id works (and no dependency on the lazily loaded analytics SDK).
function deviceId(): string {
  const KEY = "cc-tools-exp-did";
  try {
    const existing = window.localStorage.getItem(KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    window.localStorage.setItem(KEY, id);
    return id;
  } catch {
    return "anonymous";
  }
}

export function encodeUser(ctx: FlagContext, device = deviceId()): string {
  return btoa(JSON.stringify({ user_id: flagScopeId(ctx), device_id: device }));
}

type Entry = { key?: string; value?: string } | undefined;
const isOn = (entry: Entry) => entry?.key === "on" || entry?.value === "on";

/** Test seam + the one parser of the vardata answer. */
export function parseFlags(body: unknown): DownloadFlags | null {
  if (!body || typeof body !== "object") return null;
  const map = body as Record<string, Entry>;
  return { hard_gate: isOn(map.hard_gate), soft_gate: isOn(map.soft_gate) };
}

const memory = new Map<string, { at: number; flags: DownloadFlags }>();
const inflight = new Map<string, Promise<DownloadFlags | null>>();

function readCache(key: string): DownloadFlags | null {
  const now = Date.now();
  const hit = memory.get(key);
  if (hit && now - hit.at < CACHE_TTL_MS) return hit.flags;
  try {
    const raw = window.sessionStorage.getItem(`cc-tools-dl-flags-v1:${key}`);
    if (raw) {
      const parsed = JSON.parse(raw) as { at: number; flags: DownloadFlags };
      if (now - parsed.at < CACHE_TTL_MS) {
        memory.set(key, parsed);
        return parsed.flags;
      }
    }
  } catch {
    /* no storage — memory only */
  }
  return null;
}

function writeCache(key: string, flags: DownloadFlags) {
  const entry = { at: Date.now(), flags };
  memory.set(key, entry);
  try {
    window.sessionStorage.setItem(`cc-tools-dl-flags-v1:${key}`, JSON.stringify(entry));
  } catch {
    /* ignore */
  }
}

/** Starts (or joins) the evaluation for this exam/page. Resolves to null on ANY failure. */
export function fetchDownloadFlags(ctx: FlagContext, fetchImpl: typeof fetch = fetch): Promise<DownloadFlags | null> {
  const key = flagCacheKey(ctx);
  const cached = readCache(key);
  if (cached) return Promise.resolve(cached);
  const running = inflight.get(key);
  if (running) return running;

  const deployment = experimentDeploymentKey();
  if (!deployment) return Promise.resolve(null);

  const request = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetchImpl(vardataUrl(), {
        headers: { Authorization: `Api-Key ${deployment}`, "X-Amp-Exp-User": encodeUser(ctx) },
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const flags = parseFlags(await res.json());
      if (flags) writeCache(key, flags);
      return flags;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
      inflight.delete(key);
    }
  })();
  inflight.set(key, request);
  return request;
}

/** What a Download tap uses: the answer, or null if it is not there within the timeout. */
export function downloadFlagsWithin(ctx: FlagContext, ms = EXPERIMENT_TIMEOUT_MS, fetchImpl?: typeof fetch): Promise<DownloadFlags | null> {
  return Promise.race([
    fetchDownloadFlags(ctx, fetchImpl),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

const exposed = new Set<string>();

/**
 * One `$exposure` per flag and exam|tool per browser session, only for a flag
 * that is ON here (the pages where a gate really shows). `logAmplitudeEvent`
 * is the single analytics gate, so nothing is sent from localhost / previews.
 */
export function trackFlagExposures(flags: DownloadFlags, ctx: FlagContext): void {
  const scope = flagCacheKey(ctx);
  for (const flag of FLAG_KEYS) {
    if (!flags[flag]) continue;
    const id = `${flag}@${scope}`;
    let already = exposed.has(id);
    try {
      already = already || window.sessionStorage.getItem(`cc-tools-exposed:${id}`) === "1";
    } catch {
      /* ignore */
    }
    if (already) continue;
    exposed.add(id);
    try {
      window.sessionStorage.setItem(`cc-tools-exposed:${id}`, "1");
    } catch {
      /* ignore */
    }
    logAmplitudeEvent("$exposure", { flag_key: flag, variant: "on" });
  }
}

/** Test seam. */
export function __resetExperimentForTests(): void {
  memory.clear();
  inflight.clear();
  exposed.clear();
}
