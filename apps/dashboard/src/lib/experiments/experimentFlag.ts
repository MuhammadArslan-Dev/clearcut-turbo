// Amplitude Experiment flags without the SDK. Plain `fetch` to the client endpoint
// (same request as apps/tools/src/lib/experiment.ts, phase 71 §12):
//
//   GET https://api.lab.amplitude.com/sdk/v2/vardata?flag_keys=<key>
//   Authorization: Api-Key <client deployment key>
//   X-Amp-Exp-User: base64(JSON { user_id, device_id })
//
// `user_id` is the backend user uuid (the same id analytics uses), so a rollout
// %, "User ID is one of" and cohorts all work, and the variant sticks to the user.
// Custom user properties are NOT matched by remote evaluation.
//
// The answer is the variant name, or `null` for everything else: no key, no user,
// network error, timeout, non-200, bad JSON, flag missing or disabled. Nothing
// here throws, so a caller's "no answer" path is always its current behaviour.

/** Public CLIENT deployment key `testing_price_99` (project 673721), shipped to every browser by design. */
export const DEFAULT_EXPERIMENT_DEPLOYMENT_KEY = "client-pRpnI5vqt36xQQ76zn6lb0mAi6ndv6qV";
const DEFAULT_TIMEOUT_MS = 1500;
const CACHE_TTL_MS = 10 * 60 * 1000;
const DEVICE_KEY = "cc-experiment-device-id";

/** `NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_KEY` overrides the key; the literal "off" switches every flag off. */
export function experimentDeploymentKey(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_KEY ?? "").trim();
  if (fromEnv.toLowerCase() === "off") return "";
  return fromEnv || DEFAULT_EXPERIMENT_DEPLOYMENT_KEY;
}

function vardataUrl(flagKey: string): string {
  const eu = (process.env.NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_SERVER_ZONE ?? "").toLowerCase() === "eu";
  return `https://${eu ? "api.lab.eu.amplitude.com" : "api.lab.amplitude.com"}/sdk/v2/vardata?flag_keys=${flagKey}`;
}

// The API wants a device id; rollout here is per user_id, so a persisted random one is enough.
function deviceId(): string {
  try {
    const stored = window.localStorage.getItem(DEVICE_KEY);
    if (stored) return stored;
    const fresh = `cc-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    window.localStorage.setItem(DEVICE_KEY, fresh);
    return fresh;
  } catch {
    return "cc-anonymous-device";
  }
}

function encodeUser(userId: string): string {
  const json = JSON.stringify({ user_id: userId, device_id: deviceId() });
  return typeof btoa === "function" ? btoa(json) : Buffer.from(json).toString("base64");
}

type Cached = { value: string | null; at: number };
const memory = new Map<string, Cached>();
const inflight = new Map<string, Promise<string | null>>();

const storageKey = (flagKey: string, userId: string) => `cc-flag:${flagKey}:${userId}`;

function readCache(flagKey: string, userId: string, now: number): Cached | null {
  const key = storageKey(flagKey, userId);
  const hit = memory.get(key);
  if (hit && now - hit.at < CACHE_TTL_MS) return hit;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as { value?: unknown; at?: unknown };
      if (
        (typeof parsed.value === "string" || parsed.value === null) &&
        typeof parsed.at === "number" &&
        now - parsed.at < CACHE_TTL_MS
      ) {
        const entry = { value: parsed.value, at: parsed.at };
        memory.set(key, entry);
        return entry;
      }
    }
  } catch {
    /* storage unavailable: fall through to a network read */
  }
  return null;
}

function writeCache(flagKey: string, userId: string, value: string | null, now: number): void {
  const key = storageKey(flagKey, userId);
  memory.set(key, { value, at: now });
  try {
    window.sessionStorage.setItem(key, JSON.stringify({ value, at: now }));
  } catch {
    /* ignore */
  }
}

/** Test helper: forget every cached answer. */
export function resetExperimentFlagCache(): void {
  memory.clear();
  inflight.clear();
}

export interface FlagOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  now?: () => number;
}

/** Cached for 10 min per flag + user; only a definite answer is cached (a failure is retried on the next call). */
export function getFlagVariant(
  flagKey: string,
  userId: string | null | undefined,
  options: FlagOptions = {},
): Promise<string | null> {
  const id = (userId ?? "").trim();
  if (!id) return Promise.resolve(null);
  const key = experimentDeploymentKey();
  if (!key) return Promise.resolve(null);
  const now = (options.now ?? Date.now)();
  const cached = readCache(flagKey, id, now);
  if (cached) return Promise.resolve(cached.value);
  const inflightKey = storageKey(flagKey, id);
  const running = inflight.get(inflightKey);
  if (running) return running;

  const doFetch = options.fetchImpl ?? (typeof fetch === "function" ? fetch : null);
  if (!doFetch) return Promise.resolve(null);
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<undefined>((resolve) => {
    timer = setTimeout(() => {
      controller?.abort();
      resolve(undefined);
    }, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  });

  // `undefined` = no answer (transport problem); `null` = a definite "no variant".
  const request = (async (): Promise<string | null | undefined> => {
    try {
      const res = await doFetch(vardataUrl(flagKey), {
        headers: { Authorization: `Api-Key ${key}`, "X-Amp-Exp-User": encodeUser(id) },
        signal: controller?.signal,
      });
      if (!res.ok) return undefined;
      const body = (await res.json()) as Record<string, { key?: unknown; value?: unknown } | undefined> | null;
      const flag = body?.[flagKey];
      const variant = flag?.key ?? flag?.value;
      return typeof variant === "string" && variant ? variant : null;
    } catch {
      return undefined;
    }
  })();

  const promise = Promise.race([request, timeout])
    .then((answer) => {
      if (answer === undefined) return null;
      writeCache(flagKey, id, answer, now);
      return answer;
    })
    .finally(() => {
      if (timer) clearTimeout(timer);
      inflight.delete(inflightKey);
    });
  inflight.set(inflightKey, promise);
  return promise;
}
