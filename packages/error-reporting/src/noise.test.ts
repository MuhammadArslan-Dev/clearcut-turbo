import { describe, expect, it } from "vitest";
import { IGNORE_ERRORS } from "./noise";

// Sentry's `ignoreErrors`: a string matches when the event message CONTAINS it, a RegExp when it matches.
const ignored = (message: string) => IGNORE_ERRORS.some((p) => (typeof p === "string" ? message.includes(p) : p.test(message)));

describe("public apps' ignoreErrors", () => {
  it("drops the React/extension DOM race seen on /start and the tools pages (CLEARCUTOFF-PUBLIC-A/-9/-B)", () => {
    expect(ignored("NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.")).toBe(true);
    expect(ignored("Failed to execute 'releasePointerCapture' on 'Element': No active pointer with the given id is found.")).toBe(true);
  });

  it("keeps the list's earlier entries", () => {
    expect(ignored("ResizeObserver loop completed with undelivered notifications")).toBe(true);
    expect(ignored("NEXT_REDIRECT")).toBe(true);
  });

  it("does not hide real errors", () => {
    expect(ignored("TypeError: Cannot read properties of undefined (reading 'map')")).toBe(false);
    expect(ignored("Failed to execute 'appendChild' on 'Node': parameter 1 is not of type 'Node'.")).toBe(false);
    expect(ignored("ApiError: API 500 POST /v2/progress/topic-activity")).toBe(false);
  });
});
