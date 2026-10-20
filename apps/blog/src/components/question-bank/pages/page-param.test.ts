import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("@/i18n/navigation", () => ({
  permanentRedirect: ({ href }: { href: string }) => {
    throw new Error(`REDIRECT ${href}`);
  },
}));

const { assertPageExists, resolvePageParam } = await import("./page-param");

describe("question-bank page params", () => {
  it("serves page 1 at the base URL and page N from the segment", () => {
    expect(resolvePageParam(undefined, "/ctet/x", "en")).toBe(1);
    expect(resolvePageParam("3", "/ctet/x", "en")).toBe(3);
  });

  it("redirects /page/1 to the base URL and 404s malformed numbers", () => {
    expect(() => resolvePageParam("1", "/ctet/x", "en")).toThrow("REDIRECT /ctet/x");
    expect(() => resolvePageParam("02", "/ctet/x", "en")).toThrow("NEXT_NOT_FOUND");
  });

  it("404s a page past the last one, once the questions loaded", () => {
    expect(() => assertPageExists(2, 100, true)).not.toThrow();
    expect(() => assertPageExists(3, 101, true)).not.toThrow();
    expect(() => assertPageExists(3, 100, true)).toThrow("NEXT_NOT_FOUND");
    // An empty chapter still has its page 1 (showing the empty state).
    expect(() => assertPageExists(1, 0, true)).not.toThrow();
  });

  it("never 404s because the backend failed — that is a server error", () => {
    expect(() => assertPageExists(2, 0, false)).toThrow("Question-bank data unavailable");
    expect(() => assertPageExists(1, 0, false)).toThrow("Question-bank data unavailable");
  });
});
