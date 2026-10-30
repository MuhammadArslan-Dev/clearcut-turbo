// Amplitude flag `practice_test` for the first-enrollment Practice Test
// (phase 72). Plain `fetch` to the Experiment client endpoint, no SDK and no new
// dependency (same request as apps/tools/src/lib/experiment.ts, phase 71 §12):
//
//   GET https://api.lab.amplitude.com/sdk/v2/vardata?flag_keys=practice_test
//   Authorization: Api-Key <client deployment key>
//   X-Amp-Exp-User: base64(JSON { user_id, device_id })
//
// `user_id` is the backend user uuid (the same id analytics uses), so a rollout
// %, "User ID is one of" and cohorts all work. Custom user properties are NOT
// matched by remote evaluation.
//
// The answer is `true` ONLY when the flag says `on`. Everything else - no key,
// no user, network error, timeout, non-200, bad JSON, flag missing or disabled -
// is `false` (go straight to Preparation). Nothing here throws.

export const PRACTICE_TEST_FLAG_KEY = "practice_test";
/** Public CLIENT deployment key `testing_price_99` (project 673721), shipped to every browser by design. */
export const DEFAULT_EXPERIMENT_DEPLOYMENT_KEY = "client-pRpnI5vqt36xQQ76zn6lb0mAi6ndv6qV";
/** How long the enrolment flow waits for the flag before treating it as OFF. */
export const PRACTICE_TEST_FLAG_TIMEOUT_MS = 1500;
const CACHE_TTL_MS = 10 * 60 * 1000;
const STORAGE_PREFIX = "cc-practice-test-flag:";
const DEVICE_KEY = "cc-experiment-device-id";

/** `NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_KEY` overrides the key; the literal "off" switches the flag off for everyone. */
export function experimentDeploymentKey(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_KEY ?? "").trim();
  if (fromEnv.toLowerCase() === "off") return "";
  return fromEnv || DEFAULT_EXPERIMENT_DEPLOYMENT_KEY;
}

function vardataUrl(): string {
  const eu = (process.env.NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_SERVER_ZONE ?? "").toLowerCase() === "eu";
  return `https://${eu ? "api.lab.eu.amplitude.com" : "api.lab.amplitude.com"}/sdk/v2/vardata?flag_keys=${PRACTICE_TEST_FLAG_KEY}`;
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

const memory = new Map<string, { value: boolean; at: number }>();
const inflight = new Map<string, Promise<boolean>>();

function readCache(userId: string, now: number): boolean | null {
  const hit = memory.get(userId);
  if (hit && now - hit.at < CACHE_TTL_MS) return hit.value;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_PREFIX + userId);
    if (raw) {
      const parsed = JSON.parse(raw) as { value?: unknown; at?: unknown };
      if (typeof parsed.value === "boolean" && typeof parsed.at === "number" && now - parsed.at < CACHE_TTL_MS) {
        memory.set(userId, { value: parsed.value, at: parsed.at });
        return parsed.value;
      }
    }
  } catch {
    /* storage unavailable: fall through to a network read */
  }
  return null;
}

function writeCache(userId: string, value: boolean, now: number): void {
  memory.set(userId, { value, at: now });
  try {
    window.sessionStorage.setItem(STORAGE_PREFIX + userId, JSON.stringify({ value, at: now }));
  } catch {
    /* ignore */
  }
}

/** Test helper: forget every cached answer. */
export function resetPracticeTestFlagCache(): void {
  memory.clear();
  inflight.clear();
}

interface Options {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  now?: () => number;
}

/** Cached for 10 min per user; only a definite answer is cached (a failure is retried on the next call). */
export function isPracticeTestEnabled(userId: string | null | undefined, options: Options = {}): Promise<boolean> {
  const id = (userId ?? "").trim();
  if (!id) return Promise.resolve(false);
  const key = experimentDeploymentKey();
  if (!key) return Promise.resolve(false);
  const now = (options.now ?? Date.now)();
  const cached = readCache(id, now);
  if (cached !== null) return Promise.resolve(cached);
  const running = inflight.get(id);
  if (running) return running;

  const doFetch = options.fetchImpl ?? (typeof fetch === "function" ? fetch : null);
  if (!doFetch) return Promise.resolve(false);
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => {
      controller?.abort();
      resolve(null);
    }, options.timeoutMs ?? PRACTICE_TEST_FLAG_TIMEOUT_MS);
  });

  const request = (async (): Promise<boolean | null> => {
    try {
      const res = await doFetch(vardataUrl(), {
        headers: { Authorization: `Api-Key ${key}`, "X-Amp-Exp-User": encodeUser(id) },
        signal: controller?.signal,
      });
      if (!res.ok) return null;
      const body = (await res.json()) as Record<string, { key?: unknown; value?: unknown } | undefined> | null;
      const flag = body?.[PRACTICE_TEST_FLAG_KEY];
      // A missing / disabled flag is a DEFINITE "off" (cached); only transport problems are not.
      return flag?.key === "on" || flag?.value === "on";
    } catch {
      return null;
    }
  })();

  const promise = Promise.race([request, timeout])
    .then((answer) => {
      if (answer === null) return false;
      writeCache(id, answer, now);
      return answer;
    })
    .finally(() => {
      if (timer) clearTimeout(timer);
      inflight.delete(id);
    });
  inflight.set(id, promise);
  return promise;
}
