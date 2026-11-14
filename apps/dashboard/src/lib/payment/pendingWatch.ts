// CC-70 (phase 88): keep asking the backend about a payment attempt while the
// student approves it in their UPI app. Framework-free so the timing is testable.
//
// - polls every POLL_MS while the page is visible;
// - re-checks at once when the page becomes visible again (back from the UPI app);
// - says "slow" after SLOW_AFTER_MS and gives up after GIVE_UP_MS;
// - never overlaps two checks, and a failing check just waits for the next one.

export const PENDING_POLL_MS = 4_000;
export const PENDING_SLOW_AFTER_MS = 2 * 60 * 1000;
export const PENDING_GIVE_UP_MS = 15 * 60 * 1000;

export type PendingWatchOptions = {
  /** Returns true when the payment is finished (paid) and the watch should stop. */
  check: () => Promise<boolean>;
  onSlow?: () => void;
  onGiveUp?: () => void;
  /** When the wait really began (a wait resumed after a reload); default: now. */
  startedAt?: number;
  now?: () => number;
  isVisible?: () => boolean;
  /** Tests inject fake timers; production uses the window ones. */
  setIntervalFn?: (fn: () => void, ms: number) => unknown;
  clearIntervalFn?: (id: unknown) => void;
  addVisibilityListener?: (fn: () => void) => () => void;
};

export function startPendingWatch(options: PendingWatchOptions): () => void {
  const now = options.now ?? Date.now;
  const isVisible = options.isVisible ?? (() => typeof document === "undefined" || document.visibilityState !== "hidden");
  const setI = options.setIntervalFn ?? ((fn, ms) => setInterval(fn, ms));
  const clearI = options.clearIntervalFn ?? ((id) => clearInterval(id as ReturnType<typeof setInterval>));
  const listen =
    options.addVisibilityListener ??
    ((fn) => {
      if (typeof document === "undefined") return () => {};
      document.addEventListener("visibilitychange", fn);
      return () => document.removeEventListener("visibilitychange", fn);
    });

  const startedAt = options.startedAt ?? now();
  let stopped = false;
  let checking = false;
  let slowSent = false;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearI(timer);
    unlisten();
  };

  const tick = async () => {
    if (stopped || checking || !isVisible()) return;
    const elapsed = now() - startedAt;
    if (elapsed >= PENDING_GIVE_UP_MS) {
      stop();
      options.onGiveUp?.();
      return;
    }
    if (!slowSent && elapsed >= PENDING_SLOW_AFTER_MS) {
      slowSent = true;
      options.onSlow?.();
    }
    checking = true;
    try {
      if (await options.check()) stop();
    } catch {
      // Offline or a blip: the next poll tries again.
    } finally {
      checking = false;
    }
  };

  const timer = setI(() => void tick(), PENDING_POLL_MS);
  const unlisten = listen(() => void tick());
  return stop;
}
