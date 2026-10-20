import { describe, expect, it } from "vitest";
import { canonicalPathRedirect } from "./url-normalize";

describe("canonicalPathRedirect", () => {
  it.each([
    ["/CTET", "/ctet"],
    ["/CTET/paper-1/subject/child-development-pedagogy", "/ctet/paper-1/subject/child-development-pedagogy"],
    ["/hi/HTET/level-1-prt", "/hi/htet/level-1-prt"],
    ["/en", "/"],
    ["/en/ctet/paper-1", "/ctet/paper-1"],
    ["/en/CTET/paper-1", "/ctet/paper-1"],
    // Uppercase anywhere in an exam path (seen in Search Console) — one 301 to the lowercase URL.
    ["/HTET/level-3-pgt/subject/generalstudies", "/htet/level-3-pgt/subject/generalstudies"],
    ["/hi/HTET", "/hi/htet"],
    ["/htet/Level-1-PRT", "/htet/level-1-prt"],
    ["/CTET/Paper-1/Year/CTET-2024", "/ctet/paper-1/year/ctet-2024"],
    ["/ctet/blog/CTET-Exam-Pattern", "/ctet/blog/ctet-exam-pattern"],
  ])("%s -> %s", (from, to) => {
    expect(canonicalPathRedirect(from)).toBe(to);
  });

  it.each(["/", "/ctet", "/hi", "/hi/ctet/paper-1", "/About", "/entrance", "/question/abc-12"])(
    "leaves %s alone",
    (path) => {
      expect(canonicalPathRedirect(path)).toBeNull();
    },
  );

  it("never chains or loops: every target is already canonical", () => {
    for (const from of ["/CTET", "/en/CTET/paper-1", "/hi/HTET", "/en", "/htet/Level-1-PRT"]) {
      const to = canonicalPathRedirect(from);
      expect(to).not.toBeNull();
      expect(canonicalPathRedirect(to as string)).toBeNull();
    }
  });
});
