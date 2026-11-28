import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { settleWithin } from "./settle-within";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

function track(p: Promise<void>) {
  const state = { done: false };
  void p.then(() => (state.done = true));
  return state;
}

describe("settleWithin", () => {
  it("resolves as soon as an async task finishes, well before the cap", async () => {
    const s = track(settleWithin(() => new Promise((r) => setTimeout(r, 100)), 1000));
    await vi.advanceTimersByTimeAsync(99);
    expect(s.done).toBe(false);
    await vi.advanceTimersByTimeAsync(2);
    expect(s.done).toBe(true);
  });

  it("a task that never settles is cut at the cap", async () => {
    const s = track(settleWithin(() => new Promise(() => undefined), 300));
    await vi.advanceTimersByTimeAsync(299);
    expect(s.done).toBe(false);
    await vi.advanceTimersByTimeAsync(2);
    expect(s.done).toBe(true);
  });

  it("a synchronous task (or one returning nothing) resolves right away", async () => {
    const task = vi.fn(() => undefined);
    const s = track(settleWithin(task, 1000));
    await vi.advanceTimersByTimeAsync(0);
    expect(task).toHaveBeenCalledTimes(1);
    expect(s.done).toBe(true);
  });

  it("a task that throws or rejects still resolves and never rejects", async () => {
    await expect(
      settleWithin(() => {
        throw new Error("broken hook");
      }, 1000),
    ).resolves.toBeUndefined();
    await expect(settleWithin(() => Promise.reject(new Error("network")), 1000)).resolves.toBeUndefined();
  });

  it("runs the task exactly once even when both the task and the cap fire", async () => {
    const task = vi.fn(() => new Promise<void>((r) => setTimeout(r, 500)));
    const s = track(settleWithin(task, 200));
    await vi.advanceTimersByTimeAsync(600);
    expect(s.done).toBe(true);
    expect(task).toHaveBeenCalledTimes(1);
  });
});
