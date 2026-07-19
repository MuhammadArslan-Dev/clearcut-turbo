import { describe, expect, it } from "vitest";
import { buildMetadata } from "./build-metadata";

describe("buildMetadata", () => {
  const base = {
    siteName: "Clear Cutoff",
    description: "Crack teaching exams with focused courses and test series.",
    ogImage: "https://example.com/og-image.png",
  };

  it("sets title.default and a default title template derived from siteName", () => {
    const metadata = buildMetadata(base);
    expect(metadata.title).toEqual({
      default: "Clear Cutoff",
      template: "%s | Clear Cutoff",
    });
  });

  it("honors an explicit titleTemplate override", () => {
    const metadata = buildMetadata({ ...base, titleTemplate: "%s — Clear Cutoff" });
    expect((metadata.title as { template: string }).template).toBe("%s — Clear Cutoff");
  });

  it("defaults url to '/' when not provided", () => {
    const metadata = buildMetadata(base);
    expect(metadata.openGraph?.url).toBe("/");
  });

  it("uses a provided url instead of the default", () => {
    const metadata = buildMetadata({ ...base, url: "https://clearcutoff.in" });
    expect(metadata.openGraph?.url).toBe("https://clearcutoff.in");
  });

  it("propagates ogImage into both openGraph and twitter images", () => {
    const metadata = buildMetadata(base);
    expect(metadata.openGraph?.images).toEqual([
      { url: base.ogImage, width: 1200, height: 630, alt: "Clear Cutoff preview" },
    ]);
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      images: [base.ogImage],
    });
  });

  it("always emits the same fixed icon set", () => {
    const metadata = buildMetadata(base);
    expect(metadata.icons).toEqual({
      icon: [
        { url: "/icons/Logo-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/icons/Logo-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      shortcut: "/icons/favicon.ico",
      apple: "/icons/Logo-48x48.png",
    });
  });
});
