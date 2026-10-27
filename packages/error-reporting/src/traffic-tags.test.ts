import { describe, expect, it } from "vitest";
import { trafficTags } from "./traffic-tags";

const CHROME = "Mozilla/5.0 (Linux; Android 12) Chrome/120 Mobile Safari/537.36";
const FB = "Mozilla/5.0 (Linux; Android 12) [FB_IAB/FB4A;FBAV/450.0.0.0;]";
const IG = "Mozilla/5.0 (iPhone) Instagram 300.0";

describe("trafficTags (CC-144)", () => {
  it("reads exam from the path in its different spellings", () => {
    expect(trafficTags("https://x.in/hi/go/exam/ctet-preparation", CHROME).exam).toBe("ctet");
    expect(trafficTags("https://x.in/htet/level-1-prt/subject/a/b", CHROME).exam).toBe("htet");
    expect(trafficTags("https://x.in/tools/resizer/ugc-net", CHROME).exam).toBe("ugcnet");
    expect(trafficTags("https://x.in/tools/resizer/up-tet", CHROME).exam).toBe("uptet");
    expect(trafficTags("https://x.in/mr/go/exam/mahatet-preparation", CHROME).exam).toBe("mahatet");
    expect(trafficTags("https://x.in/teaching/hptet", CHROME).exam).toBe("hptet");
  });

  it("does not confuse htet with hptet or ctet inside other words", () => {
    expect(trafficTags("https://x.in/teaching/hptet", CHROME).exam).not.toBe("htet");
    expect(trafficTags("https://x.in/selectet/page", CHROME).exam).toBe("none");
  });

  it("falls back to ?exam= and to none", () => {
    expect(trafficTags("https://x.in/hi/start?exam=REET", CHROME).exam).toBe("reet");
    expect(trafficTags("https://x.in/", CHROME).exam).toBe("none");
  });

  it("keeps the campaign, never the click id", () => {
    const tags = trafficTags("https://x.in/hi/start?utm_campaign=ctet_oct&fbclid=SECRETCLICK", FB);
    expect(tags).toEqual({ exam: "none", utm_campaign: "ctet_oct", has_fbclid: "yes", in_app_browser: "facebook" });
    expect(JSON.stringify(tags)).not.toContain("SECRETCLICK");
  });

  it("detects the in-app browsers", () => {
    expect(trafficTags("https://x.in/", IG).in_app_browser).toBe("instagram");
    expect(trafficTags("https://x.in/", CHROME)).toMatchObject({ in_app_browser: "none", has_fbclid: "no", utm_campaign: "none" });
  });
});
