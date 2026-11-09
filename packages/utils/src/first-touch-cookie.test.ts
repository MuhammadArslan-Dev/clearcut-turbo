import { describe, expect, it } from "vitest";
import {
  FIRST_TOUCH_COOKIE,
  FIRST_TOUCH_MAX_AGE_SECONDS,
  buildFirstTouchCookie,
  cookieDomainFor,
  decodeFirstTouch,
  encodeFirstTouch,
  readCookie,
} from "./first-touch-cookie";

describe("first-touch cookie helpers", () => {
  it("shares the cookie across every clearcutoff.in host and nowhere else", () => {
    expect(cookieDomainFor("clearcutoff.in")).toBe(".clearcutoff.in");
    expect(cookieDomainFor("academy.clearcutoff.in")).toBe(".clearcutoff.in");
    expect(cookieDomainFor("App.ClearCutOff.in")).toBe(".clearcutoff.in");
    expect(cookieDomainFor("localhost")).toBeUndefined();
    expect(cookieDomainFor("notclearcutoff.in")).toBeUndefined();
    expect(cookieDomainFor("clearcutoff.in.evil.test")).toBeUndefined();
  });

  it("round-trips the facts and keeps only presence for click ids", () => {
    const enc = encodeFirstTouch({
      landing_page: "/hi/exam/htet",
      referrer: "l.facebook.com",
      utm: { source: "fb", campaign: "htet_lead" },
      click_ids: { fbclid: true },
    });
    expect(enc).not.toBeNull();
    expect(decodeFirstTouch(enc)).toEqual({
      landing_page: "/hi/exam/htet",
      referrer: "l.facebook.com",
      utm: { source: "fb", campaign: "htet_lead" },
      click_ids: { fbclid: true },
    });
  });

  it("stores nothing when there is nothing to store", () => {
    expect(encodeFirstTouch({})).toBeNull();
    expect(encodeFirstTouch({ utm: {}, click_ids: {} })).toBeNull();
  });

  it("caps long values and refuses a payload that cannot fit in a cookie", () => {
    const enc = encodeFirstTouch({ landing_page: "/" + "a".repeat(500), referrer: "r".repeat(500) });
    const back = decodeFirstTouch(enc)!;
    expect(back.landing_page!.length).toBe(200);
    expect(back.referrer!.length).toBe(100);
    const many = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`k${i}`, "v".repeat(100)]));
    expect(encodeFirstTouch({ utm: many })).toBeNull();
  });

  it("treats damaged or foreign values as nothing", () => {
    expect(decodeFirstTouch(undefined)).toBeUndefined();
    expect(decodeFirstTouch("")).toBeUndefined();
    expect(decodeFirstTouch("%E0%A4%A")).toBeUndefined();
    expect(decodeFirstTouch(encodeURIComponent("[1,2]"))).toBeUndefined();
    expect(decodeFirstTouch(encodeURIComponent('"text"'))).toBeUndefined();
    expect(decodeFirstTouch("not json")).toBeUndefined();
  });

  it("reads one cookie out of a document.cookie string", () => {
    const jar = `a=1; ${FIRST_TOUCH_COOKIE}=abc%7B; b=2`;
    expect(readCookie(jar, FIRST_TOUCH_COOKIE)).toBe("abc%7B");
    expect(readCookie(jar, "missing")).toBeUndefined();
    expect(readCookie("", FIRST_TOUCH_COOKIE)).toBeUndefined();
    expect(readCookie(`x_${FIRST_TOUCH_COOKIE}=1`, FIRST_TOUCH_COOKIE)).toBeUndefined();
  });

  it("builds a 30-day, lax, root-path cookie; Secure only on https; domain only on our hosts", () => {
    const c = buildFirstTouchCookie("v", "academy.clearcutoff.in", true);
    expect(c).toBe(`${FIRST_TOUCH_COOKIE}=v; Path=/; Max-Age=${FIRST_TOUCH_MAX_AGE_SECONDS}; SameSite=Lax; Domain=.clearcutoff.in; Secure`);
    expect(FIRST_TOUCH_MAX_AGE_SECONDS).toBe(2592000);
    expect(buildFirstTouchCookie("v", "localhost", false)).toBe(`${FIRST_TOUCH_COOKIE}=v; Path=/; Max-Age=2592000; SameSite=Lax`);
  });
});
