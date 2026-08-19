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
const CHUNK_ERROR_PATTERN =
  /ChunkLoadError|Loading chunk .* failed|Loading CSS chunk .* failed|No link element found for chunk/i;
const RELOAD_FLAG = "cc_chunk_reload_attempted";

function isChunkError(message: unknown) {
  return typeof message === "string" && CHUNK_ERROR_PATTERN.test(message);
}

function reloadOnce() {
  if (sessionStorage.getItem(RELOAD_FLAG)) return;
  sessionStorage.setItem(RELOAD_FLAG, "1");
  window.location.reload();
}

export default function ChunkErrorReload() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (isChunkError(event.message) || isChunkError(event.error?.message)) {
        reloadOnce();
      }
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (isChunkError(event.reason?.message)) {
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
