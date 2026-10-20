import type { MistakeReport } from "./report-reasons";

/**
 * Placeholder: reports are not sent anywhere yet. Delivery (Slack / backend
 * API) will be defined separately and plugged in here — the dialog already
 * awaits this function and closes once it resolves.
 */
export async function submitMistakeReport(report: MistakeReport): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.info("[report-mistake] submission not connected yet", report);
  }
}
