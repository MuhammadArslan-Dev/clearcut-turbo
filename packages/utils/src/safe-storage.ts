// Web Storage that never throws.
//
// Reading `window.localStorage` (the property itself, not only getItem/setItem) throws a SecurityError where storage is
// blocked: Facebook/Instagram in-app browsers, "block all cookies", some private modes, sandboxed iframes. On the login
// page that crashed the whole page (Sentry CLEARCUTOFF-PUBLIC-4/5/8, `/hi/start`), so the login path reads and writes
// through these helpers instead.
//
// Semantics when storage is unavailable (blocked, full, or no `window` during SSR):
//   - reads return null,
//   - writes and removes are skipped and return false,
//   - nothing is ever thrown.
// When storage works they behave exactly like the plain Storage calls.

export type StorageKind = "local" | "session";

function storageFor(kind: StorageKind): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return (kind === "session" ? window.sessionStorage : window.localStorage) ?? null;
  } catch {
    return null;
  }
}

export function safeGetItem(key: string, kind: StorageKind = "local"): string | null {
  try {
    return storageFor(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/** true when the value was written; false when storage is blocked/full (the caller keeps it in memory instead). */
export function safeSetItem(key: string, value: string, kind: StorageKind = "local"): boolean {
  try {
    const storage = storageFor(kind);
    if (!storage) return false;
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveItem(key: string, kind: StorageKind = "local"): boolean {
  try {
    const storage = storageFor(kind);
    if (!storage) return false;
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
