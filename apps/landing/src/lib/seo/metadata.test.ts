import { describe, expect, it } from "vitest";
import { generateSeoMetadata, pageTitle } from "./metadata";

describe("pageTitle", () => {
  it("uses a title that already names the site as-is, so the layout template can't append it again", () => {
    expect(pageTitle("Contact Us | Clear Cutoff")).toEqual({ absolute: "Contact Us | Clear Cutoff" });
    expect(pageTitle("HTET तैयारी कोर्स — PYQs, नोट्स और टेस्ट | Clear Cutoff")).toEqual({
      absolute: "HTET तैयारी कोर्स — PYQs, नोट्स और टेस्ट | Clear Cutoff",
    });
    expect(pageTitle("Clear Cutoff Android App — Download Free TET Prep App")).toEqual({
      absolute: "Clear Cutoff Android App — Download Free TET Prep App",
    });
  });

  it("matches the site name case-insensitively", () => {
    expect(pageTitle("Why CLEAR CUTOFF")).toEqual({ absolute: "Why CLEAR CUTOFF" });
  });

  it("leaves other titles to the layout template", () => {
    expect(pageTitle("Testbook Alternatives")).toBe("Testbook Alternatives");
  });
});

describe("generateSeoMetadata", () => {
  const base = { title: "HTET Preparation Course — PYQs, Notes & Tests | Clear Cutoff", description: "d", url: "/teaching/htet" };

  it("keeps the full title text (keywords included) without a second site name", () => {
    const meta = generateSeoMetadata(base);
    expect(meta.title).toEqual({ absolute: base.title });
    expect(meta.openGraph?.title).toBe(base.title);
  });

  it("points a translated page's canonical at its own locale", () => {
    expect(generateSeoMetadata({ ...base, locale: "hi" }).alternates?.canonical).toBe("https://clearcutoff.in/hi/teaching/htet");
    expect(generateSeoMetadata({ ...base, locale: "mr" }).alternates?.canonical).toBe("https://clearcutoff.in/mr/teaching/htet");
    expect(generateSeoMetadata({ ...base, locale: "en" }).alternates?.canonical).toBe("https://clearcutoff.in/teaching/htet");
  });

  it("keeps the English canonical when no locale is passed (pages whose /hi and /mr copies are English)", () => {
    expect(generateSeoMetadata({ ...base, url: "/alternatives" }).alternates?.canonical).toBe("https://clearcutoff.in/alternatives");
  });

  it("leaves the hreflang set unchanged", () => {
    expect(generateSeoMetadata({ ...base, locale: "hi" }).alternates?.languages).toEqual({
      en: "https://clearcutoff.in/teaching/htet",
      hi: "https://clearcutoff.in/hi/teaching/htet",
      mr: "https://clearcutoff.in/mr/teaching/htet",
      "x-default": "https://clearcutoff.in/teaching/htet",
    });
  });

  it("builds locale root canonicals without a trailing slash", () => {
    expect(generateSeoMetadata({ ...base, url: "/", locale: "hi" }).alternates?.canonical).toBe("https://clearcutoff.in/hi");
  });
});
