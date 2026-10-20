import { describe, expect, it } from "vitest";
import {
  QUESTIONS_PER_PAGE,
  pageCount,
  pageExists,
  pageOfIndex,
  pagePath,
  pageSlice,
  pageWindow,
  parsePageParam,
} from "./pagination";

describe("question-bank pagination", () => {
  it("uses 50 questions per page", () => {
    expect(QUESTIONS_PER_PAGE).toBe(50);
  });

  it("counts pages, never fewer than one", () => {
    expect(pageCount(0)).toBe(1);
    expect(pageCount(1)).toBe(1);
    expect(pageCount(50)).toBe(1);
    expect(pageCount(51)).toBe(2);
    expect(pageCount(480)).toBe(10);
    expect(pageCount(993)).toBe(20);
  });

  it("maps a 0-based index to its page", () => {
    expect(pageOfIndex(0)).toBe(1);
    expect(pageOfIndex(49)).toBe(1);
    expect(pageOfIndex(50)).toBe(2);
    expect(pageOfIndex(479)).toBe(10);
  });

  it("slices exactly one page", () => {
    const items = Array.from({ length: 120 }, (_, i) => i);
    expect(pageSlice(items, 1)).toEqual(items.slice(0, 50));
    expect(pageSlice(items, 3)).toEqual(items.slice(100, 120));
    expect(pageSlice(items, 4)).toEqual([]);
  });

  it("accepts only canonical page numbers", () => {
    expect(parsePageParam("2")).toEqual({ kind: "ok", page: 2 });
    expect(parsePageParam("10")).toEqual({ kind: "ok", page: 10 });
    expect(parsePageParam("1")).toEqual({ kind: "redirectToBase" });
    for (const bad of ["0", "02", "2.0", "-1", "abc", "", "1e2", " 2", undefined]) {
      expect(parsePageParam(bad)).toEqual({ kind: "notFound" });
    }
  });

  it("checks a page against the total", () => {
    expect(pageExists(10, 480)).toBe(true);
    expect(pageExists(11, 480)).toBe(false);
    expect(pageExists(1, 0)).toBe(true);
  });

  it("builds page paths with no /page/1", () => {
    expect(pagePath("/ctet/paper-1/subject/cdp", 1)).toBe("/ctet/paper-1/subject/cdp");
    expect(pagePath("/ctet/paper-1/subject/cdp", 3)).toBe("/ctet/paper-1/subject/cdp/page/3");
    expect(pagePath("/hi/ctet/paper-1/year/ctet-2024/", 2)).toBe("/hi/ctet/paper-1/year/ctet-2024/page/2");
  });

  it("windows the page list with gaps", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(1, 10)).toEqual([1, 2, null, 10]);
    expect(pageWindow(5, 10)).toEqual([1, null, 4, 5, 6, null, 10]);
    expect(pageWindow(10, 10)).toEqual([1, null, 9, 10]);
    expect(pageWindow(2, 3)).toEqual([1, 2, 3]);
  });
});
