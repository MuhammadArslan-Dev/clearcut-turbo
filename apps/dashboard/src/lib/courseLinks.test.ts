import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";
import { preparationHref, testListHref } from "./courseLinks";
import contract from "./course-deep-links.json";

// Phase 124: the backend builds push deep links with the same rules
// (App\Services\Notifications\CourseDeepLinks). Both sides test against this fixture.

describe("course links contract (dashboard ↔ backend push deep links)", () => {
  it("builds Preparation links from saved session / chapter / topic", () => {
    for (const c of contract.preparation) {
      expect(preparationHref(c.course_id, { section: c.section, chapter: c.chapter, topic: c.topic }), c.name).toBe(c.expected);
    }
  });

  it("builds Test List links", () => {
    for (const c of contract.test_list) {
      expect(
        testListHref(c.course_id, { testType: c.test_type as "sectional-tests" | "full-length-papers" | null, paper: c.paper, section: c.section }),
        c.name,
      ).toBe(c.expected);
    }
  });

  it("uses the routing the backend's /hi and /mr prefix assumes", () => {
    // Backend DeepLinkTarget::withLocale(): en unprefixed, hi/mr prefixed.
    expect(routing.defaultLocale).toBe("en");
    expect(routing.localePrefix).toBe("as-needed");
    expect([...routing.locales].sort()).toEqual(["en", "hi", "mr"]);
    for (const c of contract.locale_prefix) {
      const expected = c.locale === routing.defaultLocale ? c.path : `/${c.locale}${c.path}`;
      expect(c.expected).toBe(expected);
    }
  });

  it("keeps the same fixture as the backend repo (when checked out locally)", () => {
    const backendCopy = path.resolve("C:/laragon/www/clearcutoff-main-backend/tests/Fixtures/course-deep-links.json");
    if (!existsSync(backendCopy)) return; // CI: only this copy exists
    expect(JSON.parse(readFileSync(backendCopy, "utf8"))).toEqual(contract);
  });

  it("drops unset ids instead of writing null into the URL", () => {
    expect(preparationHref("6afd3af227c7b", { section: "null", chapter: undefined, topic: "" })).toBe("/preparation/6afd3af227c7b");
  });
});
