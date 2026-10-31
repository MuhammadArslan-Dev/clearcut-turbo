import { beforeEach, describe, expect, it, vi } from "vitest";

const browser = vi.hoisted(() => ({ trackEvent: vi.fn(), trackEventOnExit: vi.fn(), canTrackEvents: vi.fn(() => true) }));
vi.mock("./browser", () => browser);

import { buildLiteSubmittedPayload, trackLiteTestAbandoned, trackTestAbandoned, watchTestAbandoned } from "./testFunnel";

const base = { kind: "practice_test" as const, testId: "practice_test:c1", sessionId: "s1", courseId: "c1", exam: "CTET", totalQuestions: 10 };

describe("buildLiteSubmittedPayload", () => {
  it("fills the Test Submitted shape with the test kind as test_type", () => {
    const p = buildLiteSubmittedPayload(base, { correct: 6, unattempted: 1, timeTakenSeconds: 61.4, reason: "manual", language: "en" });
    expect(p).toMatchObject({
      test_type: "practice_test",
      correct_count: 6,
      incorrect_count: 3,
      unattempted_count: 1,
      score: 6,
      percent_score: 60,
      time_taken_seconds: 61,
      submission_reason: "manual",
      total_questions: 10,
    });
  });

  it("never reports negative counts", () => {
    const p = buildLiteSubmittedPayload({ ...base, kind: "daily_test" }, { correct: 4, unattempted: 20, reason: "time_up", language: "hi" });
    expect(p.test_type).toBe("daily_test");
    expect(p.unattempted_count).toBe(6);
    expect(p.incorrect_count).toBe(0);
    expect(p.time_taken_seconds).toBeUndefined();
  });
});

function stubStorage() {
  const m = new Map<string, string>();
  vi.stubGlobal("sessionStorage", { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) });
}

describe("Test Abandoned delivery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    browser.canTrackEvents.mockReturnValue(true);
    stubStorage();
  });

  it("is sent through the flushing exit path, once per attempt, with the unchanged payload", () => {
    trackLiteTestAbandoned(base, "page_closed", 3);
    trackLiteTestAbandoned(base, "idle_30m", 4);
    expect(browser.trackEventOnExit).toHaveBeenCalledTimes(1);
    expect(browser.trackEventOnExit).toHaveBeenCalledWith("Test Abandoned", {
      test_id: base.testId,
      test_type: "practice_test",
      course_id: "c1",
      reason: "page_closed",
      answered: 3,
    });
    expect(browser.trackEvent).not.toHaveBeenCalled();
  });

  it("does not burn the once-guard when analytics cannot send", () => {
    browser.canTrackEvents.mockReturnValue(false);
    trackLiteTestAbandoned(base, "page_closed", 1);
    expect(browser.trackEventOnExit).not.toHaveBeenCalled();
    browser.canTrackEvents.mockReturnValue(true);
    trackLiteTestAbandoned(base, "page_closed", 1);
    expect(browser.trackEventOnExit).toHaveBeenCalledTimes(1);
  });

  it("exam page helper: only an in-progress exam counts, and it flushes", () => {
    const exam = { uuid: "e1", status: "in_progress", type: "mock", course: { group_code: "g" } } as never;
    trackTestAbandoned({ ...(exam as object), status: "completed" } as never, "page_closed", 2);
    expect(browser.trackEventOnExit).not.toHaveBeenCalled();
    trackTestAbandoned(exam, "page_closed", 2);
    expect(browser.trackEventOnExit).toHaveBeenCalledWith("Test Abandoned", {
      test_id: "e1",
      test_type: "mock",
      course_id: "g",
      reason: "page_closed",
      answered: 2,
    });
  });

  it("watchTestAbandoned: pagehide abandons; visibilitychange (tab switch) does not", () => {
    const target = new EventTarget();
    vi.stubGlobal("window", Object.assign(target, { setTimeout, clearTimeout }));
    const onAbandon = vi.fn();
    const stop = watchTestAbandoned(onAbandon);
    target.dispatchEvent(new Event("visibilitychange"));
    expect(onAbandon).not.toHaveBeenCalled();
    target.dispatchEvent(new Event("pagehide"));
    expect(onAbandon).toHaveBeenCalledWith("page_closed");
    stop();
    target.dispatchEvent(new Event("pagehide"));
    expect(onAbandon).toHaveBeenCalledTimes(1);
  });
});
