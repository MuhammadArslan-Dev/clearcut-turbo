"use client";

import { useEffect } from "react";

/**
 * After a new deploy, a browser tab left open on the old build still holds
 * old chunk hashes in its HTML/RSC payload. Any lazy-loaded chunk or CSS
 * link it tries to fetch next 404s (the old hash no longer exists on the
 * server), surfacing as "ChunkLoadError" / "No link element found for
 * chunk ..." — not a code bug, just a stale client. The fix users expect is
 * a reload, which picks up the new build's manifest.
 *
 * sessionStorage guard prevents a reload loop if the chunk is missing for
 * another reason (e.g. genuinely offline) — one retry per tab session.
 */
// Same rules as packages/error-reporting/src/chunk-reload.ts (CC-112): wider
// pattern (Turbopack says "Failed to load chunk"), and at most one reload per
// minute instead of once per tab session, so a later deploy in a long-open
// tab can reload again while a missing chunk right after a reload can't loop.
const CHUNK_ERROR_PATTERN =
  /ChunkLoadError|Loading chunk .* failed|Loading CSS chunk .* failed|Failed to load chunk|No link element found for chunk|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i;
const RELOAD_AT_KEY = "cc_chunk_reload_at";
const RETRY_AFTER_MS = 60_000;

export function isChunkError(message: unknown) {
  return typeof message === "string" && CHUNK_ERROR_PATTERN.test(message);
}

/** Reloads unless it already did in the last minute; returns whether it reloads. */
export function reloadOnce(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_AT_KEY) || 0);
    if (last && Date.now() - last < RETRY_AFTER_MS) return false;
    sessionStorage.setItem(RELOAD_AT_KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

export default function ChunkErrorReload() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (isChunkError(event.message) || isChunkError(event.error?.message)) {
        reloadOnce();
      }
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (isChunkError(event.reason?.message) || event.reason?.name === "ChunkLoadError") {
        reloadOnce();
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
