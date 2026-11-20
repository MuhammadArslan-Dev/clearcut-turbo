import { describe, expect, it } from "vitest";
import {
  bumpDownloadCount,
  centerCrop,
  crossExamsFor,
  getSaveConsent,
  kindForPreset,
  needsSecondDownloadGate,
  readDownloadCount,
  scaledSize,
  setSaveConsent,
  subscribeSaveConsent,
} from "./logic";

function memoryStorage() {
  const map = new Map<string, string>();
  return { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v) };
}

describe("kindForPreset", () => {
  it("saves only Photo and the Signature tile", () => {
    expect(kindForPreset("photo")).toBe("photo");
    expect(kindForPreset("draw")).toBe("signature");
    for (const p of ["signature", "thumb", "right_thumb", "declaration", "custom"]) expect(kindForPreset(p)).toBeNull();
  });
});

describe("second-download gate (CC-174)", () => {
  it("counts downloads per browser, starting at 0", () => {
    const s = memoryStorage();
    expect(readDownloadCount(s)).toBe(0);
    bumpDownloadCount(s);
    bumpDownloadCount(s);
    expect(readDownloadCount(s)).toBe(2);
  });

  it("reads garbage or missing storage as 0 (fail-open)", () => {
    expect(readDownloadCount({ getItem: () => "abc" })).toBe(0);
    expect(readDownloadCount({ getItem: () => "-4" })).toBe(0);
    expect(readDownloadCount(null)).toBe(0);
    expect(readDownloadCount({ getItem: () => { throw new Error("blocked"); } })).toBe(0);
  });

  it("first download is free; the 2nd asks only without a session", () => {
    expect(needsSecondDownloadGate(0, false)).toBe(false);
    expect(needsSecondDownloadGate(1, false)).toBe(true);
    expect(needsSecondDownloadGate(7, false)).toBe(true);
    expect(needsSecondDownloadGate(1, true)).toBe(false);
  });
});

describe("consent checkbox state", () => {
  it("is opt-in and notifies subscribers", () => {
    setSaveConsent(false);
    expect(getSaveConsent()).toBe(false);
    let calls = 0;
    const off = subscribeSaveConsent(() => calls++);
    setSaveConsent(true);
    expect(getSaveConsent()).toBe(true);
    off();
    setSaveConsent(false);
    expect(calls).toBe(1);
  });
});

describe("centerCrop", () => {
  it("cuts a wide source to the target ratio, centred", () => {
    expect(centerCrop(1000, 500, 200, 200)).toEqual({ sx: 250, sy: 0, sw: 500, sh: 500 });
  });
  it("cuts a tall source to the target ratio, centred", () => {
    expect(centerCrop(600, 1200, 200, 230)).toEqual({ sx: 0, sy: 255, sw: 600, sh: 690 });
  });
  it("keeps everything when the ratio already matches", () => {
    expect(centerCrop(400, 460, 200, 230)).toEqual({ sx: 0, sy: 0, sw: 400, sh: 460 });
  });
  it("never divides by zero", () => {
    expect(centerCrop(0, 0, 200, 230)).toEqual({ sx: 0, sy: 0, sw: 0, sh: 0 });
  });
});

describe("scaledSize", () => {
  it("keeps small originals as they are and shrinks big ones to 3000 px", () => {
    expect(scaledSize(1200, 900)).toEqual({ width: 1200, height: 900 });
    expect(scaledSize(6000, 4000)).toEqual({ width: 3000, height: 2000 });
    expect(scaledSize(3000, 4500)).toEqual({ width: 2000, height: 3000 });
  });
});

describe("crossExamsFor", () => {
  const spec = (w: number) => ({ widthPx: w, heightPx: 230, minKB: 20, maxKB: 50 });
  const exams = [
    { slug: "ctet", shortName: "CTET", photoSpec: spec(200), signatureSpec: spec(140) },
    { slug: "htet", shortName: "HTET", photoSpec: spec(210), signatureSpec: spec(140), documents: [{ type: "photo", mode: "live_capture", spec: spec(210) }] },
    { slug: "reet", shortName: "REET", photoSpec: spec(220), signatureSpec: spec(140), documents: [{ type: "photo", mode: "upload", spec: spec(300) }] },
    { slug: "hptet", shortName: "HPTET", photoSpec: { widthPx: 0, heightPx: 0, minKB: 0, maxKB: 0 }, signatureSpec: spec(140) },
    { slug: "mahatet", shortName: "MAHATET", photoSpec: spec(240), signatureSpec: spec(140) },
    { slug: "uptet", shortName: "UPTET", photoSpec: spec(250), signatureSpec: spec(140) },
  ];

  it("skips the current exam, live captures and exams without a usable size, prefers the document spec", () => {
    expect(crossExamsFor("photo", "ctet", exams)).toEqual([
      { slug: "reet", shortName: "REET", spec: spec(300) },
      { slug: "mahatet", shortName: "MAHATET", spec: spec(240) },
      { slug: "uptet", shortName: "UPTET", spec: spec(250) },
    ]);
  });

  it("uses the signature spec for signatures and honours the limit", () => {
    expect(crossExamsFor("signature", "ctet", exams, 2).map((e) => e.slug)).toEqual(["htet", "reet"]);
  });
});
