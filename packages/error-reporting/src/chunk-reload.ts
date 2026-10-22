/**
 * Reload once when a page can't load one of its own JS/CSS chunks (CC-112).
 *
 * After a deploy, a tab still running the previous build asks for chunk
 * files that no longer exist on the server; the page is broken until it
 * reloads and picks up the new build. Seen in Clarity on landing as
 * "Failed to load chunk …" (Turbopack's wording, which dashboard's older
 * pattern didn't match).
 *
 * Anti-loop: at most one reload per tab per RETRY_AFTER_MS (sessionStorage).
 * If the chunk is still missing right after the reload (offline, a real
 * 404), nothing more happens and the error boundary shows as before. A later
 * deploy in the same tab, after the window, may reload again. Without
 * sessionStorage (private mode, blocked storage) it never reloads.
 *
 * dashboard keeps its own copy (components/thirdparties/ChunkErrorReload.tsx)
 * — it doesn't depend on this package.
 */

const CHUNK_ERROR_PATTERN =
  /ChunkLoadError|Loading chunk .* failed|Loading CSS chunk .* failed|Failed to load chunk|No link element found for chunk|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i;

const RELOAD_AT_KEY = "cc_chunk_reload_at";
const RETRY_AFTER_MS = 60_000;

/** True for an error (or message) caused by a chunk that failed to load. */
export function isChunkLoadError(error: unknown): boolean {
  if (typeof error === "string") return CHUNK_ERROR_PATTERN.test(error);
  if (!error || typeof error !== "object") return false;
  const { name, message } = error as { name?: unknown; message?: unknown };
  return (
    (typeof name === "string" && name === "ChunkLoadError") ||
    (typeof message === "string" && CHUNK_ERROR_PATTERN.test(message))
  );
}

/** Reloads the page unless it already did so in the last minute. Returns whether it reloads. */
export function reloadOnceForChunkError(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const last = Number(window.sessionStorage.getItem(RELOAD_AT_KEY) || 0);
    if (last && Date.now() - last < RETRY_AFTER_MS) return false;
    window.sessionStorage.setItem(RELOAD_AT_KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

let installed = false;

/**
 * Listens for chunk errors that never reach an error boundary (a lazy
 * import or a CSS chunk failing outside React). Call once, early, on the
 * client (instrumentation-client.ts). Boundaries go through
 * createPageErrorReporter's reportBoundaryError, which checks too.
 */
export function installChunkErrorReload(): void {
  if (typeof window === "undefined" || installed) return;
  installed = true;
  window.addEventListener("error", (event) => {
    if (isChunkLoadError(event.error) || isChunkLoadError(event.message)) reloadOnceForChunkError();
  });
  window.addEventListener("unhandledrejection", (event) => {
    if (isChunkLoadError(event.reason)) reloadOnceForChunkError();
  });
}
