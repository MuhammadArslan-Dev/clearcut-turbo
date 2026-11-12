import { describe, expect, it, vi } from "vitest";
import {
  PENDING_GIVE_UP_MS,
  PENDING_POLL_MS,
  PENDING_SLOW_AFTER_MS,
  startPendingWatch,
} from "./pendingWatch";

function harness(extra: { visible?: boolean } = {}) {
  let t = 0;
  let visible = extra.visible ?? true;
  let tickFn: (() => void) | null = null;
  let visFn: (() => void) | null = null;
  let cleared = false;
  return {
    advance(ms: number) {
      t += ms;
    },
    setVisible(v: boolean) {
      visible = v;
    },
    tick: () => tickFn?.(),
    fireVisibility: () => visFn?.(),
    isCleared: () => cleared,
    opts: {
      now: () => t,
      isVisible: () => visible,
      setIntervalFn: (fn: () => void) => ((tickFn = fn), 1),
      clearIntervalFn: () => {
        cleared = true;
      },
      addVisibilityListener: (fn: () => void) => ((visFn = fn), () => {}),
    },
  };
}
const flush = () => new Promise((r) => setTimeout(r, 0));

describe("startPendingWatch", () => {
  it("polls every interval and stops once the check says finished", async () => {
    const h = harness();
    const check = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    startPendingWatch({ ...h.opts, check });
    h.tick(); await flush();
    h.tick(); await flush();
    h.tick(); await flush();
    expect(check).toHaveBeenCalledTimes(2);
    expect(h.isCleared()).toBe(true);
  });

  it("never overlaps two checks", async () => {
    const h = harness();
    let release!: (v: boolean) => void;
    const check = vi.fn(() => new Promise<boolean>((r) => (release = r)));
    startPendingWatch({ ...h.opts, check });
    h.tick(); h.tick(); h.fireVisibility();
    expect(check).toHaveBeenCalledTimes(1);
    release(false); await flush();
    h.tick(); await flush();
    expect(check).toHaveBeenCalledTimes(2);
  });

  it("does nothing while the page is hidden and re-checks the moment it is visible", async () => {
    const h = harness({ visible: false });
    const check = vi.fn().mockResolvedValue(false);
    startPendingWatch({ ...h.opts, check });
    h.tick(); await flush();
    expect(check).not.toHaveBeenCalled();
    h.setVisible(true);
    h.fireVisibility(); await flush();
    expect(check).toHaveBeenCalledTimes(1);
  });

  it("survives a failing check and keeps polling", async () => {
    const h = harness();
    const check = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(false);
    startPendingWatch({ ...h.opts, check });
    h.tick(); await flush();
    h.tick(); await flush();
    expect(check).toHaveBeenCalledTimes(2);
    expect(h.isCleared()).toBe(false);
  });

  it("says slow once after 2 minutes and gives up after 15", async () => {
    const h = harness();
    const onSlow = vi.fn();
    const onGiveUp = vi.fn();
    const check = vi.fn().mockResolvedValue(false);
    startPendingWatch({ ...h.opts, check, onSlow, onGiveUp });
    h.advance(PENDING_POLL_MS); h.tick(); await flush();
    expect(onSlow).not.toHaveBeenCalled();
    h.advance(PENDING_SLOW_AFTER_MS); h.tick(); await flush();
    h.advance(PENDING_POLL_MS); h.tick(); await flush();
    expect(onSlow).toHaveBeenCalledTimes(1);
    h.advance(PENDING_GIVE_UP_MS); h.tick(); await flush();
    expect(onGiveUp).toHaveBeenCalledTimes(1);
    expect(h.isCleared()).toBe(true);
    const calls = check.mock.calls.length;
    h.tick(); await flush();
    expect(check.mock.calls.length).toBe(calls);
  });

  it("a wait resumed after a reload counts from its real start (startedAt)", async () => {
    const h = harness();
    h.advance(PENDING_SLOW_AFTER_MS + 1); // the attempt began 2 min ago
    const onSlow = vi.fn();
    const check = vi.fn().mockResolvedValue(false);
    startPendingWatch({ ...h.opts, check, onSlow, startedAt: 0 });
    h.tick(); await flush();
    expect(onSlow).toHaveBeenCalledTimes(1);
  });

  it("the stop function ends it at once", async () => {
    const h = harness();
    const check = vi.fn().mockResolvedValue(false);
    const stop = startPendingWatch({ ...h.opts, check });
    stop();
    h.tick(); await flush();
    expect(check).not.toHaveBeenCalled();
  });
});
