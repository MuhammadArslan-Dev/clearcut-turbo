/**
 * Runs `callback` once the page has finished loading and the browser is
 * idle, so a monitoring SDK never competes with the first render (Phase 17).
 *
 * Sentry still gets the page-speed numbers when it starts this late: it reads
 * Web Vitals through PerformanceObserver with `buffered: true`, which hands
 * over the LCP / FCP / CLS / navigation entries recorded before it started.
 *
 * `timeout` caps the idle wait (requestIdleCallback can wait indefinitely on
 * a busy page); Safari has no requestIdleCallback, so a short setTimeout is
 * used there. A no-op on the server.
 */
export function whenIdleAfterLoad(callback: () => void, timeout = 3000): void {
  if (typeof window === "undefined") return;

  const runWhenIdle = () => {
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(() => callback(), { timeout });
    } else {
      setTimeout(callback, 200);
    }
  };

  if (document.readyState === "complete") runWhenIdle();
  else window.addEventListener("load", runWhenIdle, { once: true });
}
