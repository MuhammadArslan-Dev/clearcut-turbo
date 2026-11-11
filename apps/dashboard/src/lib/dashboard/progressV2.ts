import { apiFetch } from "../api/client";
import { QuestionNew } from "@/components/features/preparation/types/question";

/**
 * Progress Tracker v2 (docs/Progress Tracker/ARCHITECTURE.md §8).
 *
 * The backend decides, per environment, whether these are live
 * (`GET /v2/progress/capabilities`). While a capability is off every caller
 * keeps the legacy flow untouched, so this file changes nothing until the
 * backend flag is flipped.
 */

export interface ProgressCapabilities {
  topic_activity: boolean;
  mini_test_server_scoring: boolean;
  video_complete_ratio: number;
  /** Cutoff Meter on (phase 97/98): My Courses card shows the meter panel. */
  cutoff_meter: boolean;
}

export const LEGACY_CAPABILITIES: ProgressCapabilities = {
  topic_activity: false,
  mini_test_server_scoring: false,
  video_complete_ratio: 0.8,
  cutoff_meter: false,
};

export async function getProgressCapabilities(): Promise<ProgressCapabilities> {
  const res = await apiFetch<{ data: ProgressCapabilities }>("/v2/progress/capabilities", { method: "GET" });
  return { ...LEGACY_CAPABILITIES, ...(res?.data ?? {}) };
}

export type TopicActivity =
  | "video_started"
  | "video_progress"
  | "video_completed"
  | "notes_viewed"
  | "notes_downloaded";

export interface TopicActivityResult {
  recorded: boolean;
  status?: "not_started" | "in_progress" | "completed";
  status_changed?: boolean;
  video_completed?: boolean;
  notes_done?: boolean;
  mini_test_done?: boolean;
}

/** One id per discrete user action, so a retried request is never counted twice. */
export function newClientEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export async function reportTopicActivity(payload: {
  course_id: string;
  topic_id: number;
  activity: TopicActivity;
  position?: number;
  duration?: number;
  watched_delta?: number;
  client_event_id?: string;
}): Promise<TopicActivityResult> {
  const res = await apiFetch<{ data: TopicActivityResult }>("/v2/progress/topic-activity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res?.data ?? { recorded: false };
}

export async function startMiniTestAttempt(courseId: string, topicId: number, limit = 5) {
  const res = await apiFetch<{ data: { attempt_id: string; attempt_number: number; questions: QuestionNew[] } }>(
    "/v2/progress/mini-test/start",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course_id: courseId, topic_id: topicId, limit }),
    },
  );
  return res.data;
}

export async function submitMiniTestAttempt(
  attemptId: string,
  answers: Record<number, number | null>,
  locale?: string,
) {
  const res = await apiFetch<{ data: { attempt_id: string; correct: number; total: number } }>(
    `/v2/progress/mini-test/${encodeURIComponent(attemptId)}/submit`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, locale }),
    },
  );
  return res.data;
}
