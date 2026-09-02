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
        { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
        { url: "/favicon.svg", type: "image/svg+xml" },
      ],
      shortcut: "/favicon.ico",
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    });
  });

  it("sets the manifest and Apple web-app title", () => {
    const metadata = buildMetadata(base);
    expect(metadata.manifest).toBe("/site.webmanifest");
    expect(metadata.appleWebApp).toEqual({ title: "ClearCutOff" });
  });
});
