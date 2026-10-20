export const REPORT_REASONS = [
  "wrongAnswer",
  "wrongSolution",
  "incorrectQuestion",
  "wrongOptions",
  "tagging",
  "duplicate",
  "other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export type MistakeReport = {
  questionId: number;
  reason: ReportReason;
  details: string;
};

export type MistakeReportErrors = { reason?: "required"; details?: "required" };

/** A reason is always required; "Other" also needs a description. */
export function validateMistakeReport(reason: ReportReason | null, details: string): MistakeReportErrors {
  const errors: MistakeReportErrors = {};
  if (!reason) errors.reason = "required";
  if (reason === "other" && details.trim().length === 0) errors.details = "required";
  return errors;
}
