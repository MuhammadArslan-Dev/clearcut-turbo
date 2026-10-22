/**
 * `.at()` for browsers that predate it (Chrome < 92, Safari < 15.4 — still
 * common on older Android phones and their WebViews). Third-party code calls
 * it, e.g. web-vitals inside Amplitude's plugin ("t.entries.at is not a
 * function", CC-112). Defines nothing where it already exists. Call once,
 * early, on the client (instrumentation-client.ts).
 *
 * dashboard keeps its own copy (src/lib/legacy-polyfills.ts) — it doesn't
 * depend on this package.
 */
export function applyLegacyPolyfills(): void {
  if (typeof window === "undefined") return;
  for (const proto of [Array.prototype, String.prototype] as unknown as Array<{ at?: unknown }>) {
    if (typeof proto.at === "function") continue;
    Object.defineProperty(proto, "at", {
      value: function at(this: ArrayLike<unknown>, index: number) {
        let i = Math.trunc(index) || 0;
        if (i < 0) i += this.length;
        return i < 0 || i >= this.length ? undefined : this[i];
      },
      writable: true,
      configurable: true,
    });
  }
}
