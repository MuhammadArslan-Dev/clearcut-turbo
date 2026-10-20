import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { REPORT_REASONS, validateMistakeReport } from "./report-reasons";

type Messages = { ReportMistake: { reasons: Record<string, { title: string; description: string }> } };
const readMessages = (locale: string): Messages =>
  JSON.parse(readFileSync(path.resolve(__dirname, `../../../../../messages/${locale}.json`), "utf8"));
const enMessages = readMessages("en");
const hiMessages = readMessages("hi");

describe("validateMistakeReport", () => {
  it("requires a reason", () => {
    expect(validateMistakeReport(null, "")).toEqual({ reason: "required" });
    expect(validateMistakeReport(null, "some text")).toEqual({ reason: "required" });
  });

  it("treats details as optional for every reason except Other", () => {
    for (const reason of REPORT_REASONS.filter((r) => r !== "other")) {
      expect(validateMistakeReport(reason, "")).toEqual({});
    }
  });

  it("requires non-blank details for Other", () => {
    expect(validateMistakeReport("other", "   ")).toEqual({ details: "required" });
    expect(validateMistakeReport("other", "Option C is repeated")).toEqual({});
  });
});

describe("ReportMistake messages", () => {
  it("has a title and description for every reason in both locales", () => {
    for (const messages of [enMessages, hiMessages]) {
      for (const reason of REPORT_REASONS) {
        const entry = messages.ReportMistake.reasons[reason];
        expect(entry.title.length).toBeGreaterThan(0);
        expect(entry.description.length).toBeGreaterThan(0);
      }
    }
  });
});
