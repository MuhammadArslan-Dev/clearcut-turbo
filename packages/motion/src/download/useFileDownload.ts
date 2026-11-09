"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type DownloadStatus = "idle" | "preparing" | "downloading" | "done" | "error";

export type DownloadState = {
  status: DownloadStatus;
  /** 0–1, or null when the server sends no Content-Length (show an indeterminate state) */
  progress: number | null;
  loadedBytes: number;
  totalBytes: number | null;
  error: string | null;
};

/**
 * Fetches a file with real progress, then saves it with the browser's download.
 * - "preparing" until the first byte arrives (server generating the PDF)
 * - "downloading" while bytes stream in (progress from Content-Length)
 * - cancel() aborts; reset() returns to idle
 * Works for same-origin URLs or CORS-enabled ones (signed S3/CloudFront URLs are fine).
 */
export function useFileDownload(url: string, { fileName, init }: { fileName: string; init?: RequestInit }) {
  const [state, setState] = useState<DownloadState>({ status: "idle", progress: 0, loadedBytes: 0, totalBytes: null, error: null });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const start = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setState({ status: "preparing", progress: 0, loadedBytes: 0, totalBytes: null, error: null });
    try {
      const res = await fetch(url, { ...init, signal: ac.signal });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const total = Number(res.headers.get("content-length")) || null;
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let loaded = 0;
      let lastPaint = 0;
      setState((s) => ({ ...s, status: "downloading", totalBytes: total, progress: total ? 0 : null }));
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.byteLength;
        const now = performance.now();
        if (now - lastPaint > 80) {
          // throttle re-renders to ~12/s
          lastPaint = now;
          setState((s) => ({ ...s, loadedBytes: loaded, progress: total ? Math.min(0.99, loaded / total) : null }));
        }
      }
      const blob = new Blob(chunks as BlobPart[], { type: res.headers.get("content-type") ?? "application/pdf" });
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 1500);
      setState({ status: "done", progress: 1, loadedBytes: loaded, totalBytes: total ?? loaded, error: null });
    } catch (e) {
      if (ac.signal.aborted) {
        setState({ status: "idle", progress: 0, loadedBytes: 0, totalBytes: null, error: null });
        return;
      }
      setState((s) => ({ ...s, status: "error", error: e instanceof Error ? e.message : "Download failed" }));
    }
  }, [url, fileName, init]);

  const cancel = useCallback(() => abortRef.current?.abort(), []);
  const reset = useCallback(() => setState({ status: "idle", progress: 0, loadedBytes: 0, totalBytes: null, error: null }), []);

  return { ...state, start, cancel, reset };
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
