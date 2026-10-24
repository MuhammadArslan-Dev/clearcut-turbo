import { describe, expect, it } from "vitest";
import { pageTags, tagPage } from "./page-tags";

const LOCALES = ["en", "hi", "mr"] as const;

describe("pageTags (CC-95)", () => {
  it.each([
    ["https://app.clearcutoff.in/payment/initiated?exam_id=1&token=secret", "payment", "en"],
    ["https://app.clearcutoff.in/hi/onboarding", "onboarding", "hi"],
    ["https://clearcutoff.in/mr/start?course=htet", "start", "mr"],
    ["/start", "start", "en"],
    ["/hi", "other", "hi"],
    ["https://clearcutoff.in/startup", "other", "en"],
    ["https://app.clearcutoff.in/preparation/abc", "other", "en"],
    ["https://clearcutoff.in/en/payment/success", "payment", "en"],
  ])("%s → %s / %s", (url, page, language) => {
    expect(pageTags(url, LOCALES, "en")).toEqual({ page, language });
  });

  it("never copies the query string", () => {
    const tags = pageTags("/payment/initiated?otp=1234&token=abc", LOCALES, "en");
    expect(JSON.stringify(tags)).not.toMatch(/1234|abc/);
  });

  it("is null without a URL", () => {
    expect(pageTags(undefined, LOCALES, "en")).toBeNull();
  });
});

describe("tagPage", () => {
  it("uses the request URL, keeping existing tags", () => {
    const event = tagPage({ tags: { app: "landing" }, request: { url: "https://clearcutoff.in/hi/start" } }, LOCALES, "en");
    expect(event.tags).toEqual({ app: "landing", page: "start", language: "hi" });
  });
  it("falls back to Next's request_path on the server", () => {
    const event = tagPage({ contexts: { nextjs: { request_path: "/mr/onboarding?x=1" } } }, LOCALES, "en");
    expect(event.tags).toEqual({ page: "onboarding", language: "mr" });
  });
  it("leaves an event without a URL alone", () => {
    expect(tagPage({}, LOCALES, "en").tags).toBeUndefined();
  });
});
