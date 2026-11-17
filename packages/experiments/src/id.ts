// Sticky experiment id (CC-192). GrowthBook buckets a visitor on this id, so it must never change for the same browser:
// the same variant before and after OTP signup, on clearcutoff.in and app.clearcutoff.in.
//
// It is deliberately NOT Amplitude's device id: landing initialises Amplitude late (idle + 1.5 s) so the id would not exist
// at first paint, and forcing our id into Amplitude would re-identify every existing user. Exposure events reach the right
// Amplitude user through Amplitude's own device id; this id only decides the variant.
//
// Stored in a cookie on `.clearcutoff.in` (shared by landing and dashboard) and mirrored in localStorage.

export const EXP_ID_COOKIE = "cc_exp_id";
export const EXP_ID_STORAGE_KEY = "cc_exp_id";
const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;
const VALID = /^[A-Za-z0-9._-]{16,64}$/;

export function isValidExpId(value: unknown): value is string {
  return typeof value === "string" && VALID.test(value);
}

export function generateExpId(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  const bytes = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function readCookie(name: string, cookieHeader: string): string | null {
  for (const part of cookieHeader.split(";")) {
    const i = part.indexOf("=");
    if (i === -1) continue;
    if (part.slice(0, i).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(i + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
}

/** `.clearcutoff.in` for the production hosts (shared with app.), host-only everywhere else (localhost, previews). */
export function cookieDomainFor(hostname: string): string | undefined {
  const h = hostname.toLowerCase();
  return h === "clearcutoff.in" || h.endsWith(".clearcutoff.in") ? ".clearcutoff.in" : undefined;
}

export function buildCookie(opts: { value: string; domain?: string; secure?: boolean; maxAgeSeconds?: number }): string {
  const parts = [`${EXP_ID_COOKIE}=${encodeURIComponent(opts.value)}`, "Path=/", `Max-Age=${opts.maxAgeSeconds ?? ONE_YEAR_SECONDS}`, "SameSite=Lax"];
  if (opts.domain) parts.push(`Domain=${opts.domain}`);
  if (opts.secure) parts.push("Secure");
  return parts.join("; ");
}

export type ExpIdEnv = {
  getCookie: () => string;
  setCookie: (value: string) => void;
  storage?: Pick<Storage, "getItem" | "setItem"> | null;
  hostname: string;
  secure: boolean;
  generate?: () => string;
};

/** cookie -> localStorage -> new id. Whatever is found is mirrored into the other store so a cleared cookie is restored. */
export function getOrCreateExpId(env: ExpIdEnv): string {
  const write = (id: string) => {
    try {
      env.setCookie(buildCookie({ value: id, domain: cookieDomainFor(env.hostname), secure: env.secure }));
    } catch {
      /* cookies blocked: the id still works for this page view */
    }
    try {
      env.storage?.setItem(EXP_ID_STORAGE_KEY, id);
    } catch {
      /* storage blocked */
    }
  };

  const fromCookie = readCookie(EXP_ID_COOKIE, env.getCookie());
  if (isValidExpId(fromCookie)) {
    try {
      if (env.storage?.getItem(EXP_ID_STORAGE_KEY) !== fromCookie) env.storage?.setItem(EXP_ID_STORAGE_KEY, fromCookie);
    } catch {
      /* storage blocked */
    }
    return fromCookie;
  }

  let fromStorage: string | null = null;
  try {
    fromStorage = env.storage?.getItem(EXP_ID_STORAGE_KEY) ?? null;
  } catch {
    fromStorage = null;
  }
  if (isValidExpId(fromStorage)) {
    write(fromStorage);
    return fromStorage;
  }

  const id = (env.generate ?? generateExpId)();
  write(id);
  return id;
}

/** Browser wrapper. Call only on the client (effects / handlers). */
export function getBrowserExpId(): string {
  let storage: Storage | null = null;
  try {
    storage = window.localStorage;
  } catch {
    storage = null;
  }
  return getOrCreateExpId({
    getCookie: () => document.cookie,
    setCookie: (value) => {
      document.cookie = value;
    },
    storage,
    hostname: window.location.hostname,
    secure: window.location.protocol === "https:",
  });
}
