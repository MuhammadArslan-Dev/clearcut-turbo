import { apiFetch } from "../api/client";
import { token } from "../auth-token-client";

export interface InteractionPayload {
  course_id: string;
  topic_id: number;
  video_watched?: boolean;
  notes_taken?: boolean;
  mini_quizzes_taken?: boolean;
  watch_time?: number;
}

export interface InteractionResponse {
  message: string;
  data: {
    id: number;
    course_id: string;
    topic_id: number;
    video_watched: boolean;
    notes_taken: boolean;
    mini_quizzes_taken: boolean;
    status: string;
    progress_percent: number;
  };
}

/**
 * Create or update learning progress
 */
export async function updateLearningProgress(payload: {
  course_id: string;
  topic_id: number | string;
  section_id?: number;
  chapter_id?: number;
  video_watched?: boolean;
  notes_taken?: boolean;
  mini_quizzes_taken?: boolean;
  watch_time?: number;
}): Promise<{ message: string; data: any }> {
  return apiFetch<{ message: string; data: any }>(
    "/v2/interactions/learning-progress",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify(payload),
    },
  );
}

/**
 * Fetch learning progress grouped by topic_id
 */
export async function getLearningProgressByTopic(
  examId: number | string,
): Promise<{
  data: Record<
    number,
    {
      chapterId: number | null;
      videoWatched: boolean;
      notesTaken: boolean;
      miniTestDone: boolean;
      status: "completed" | "in_progress" | "not_started";
      progress: number;
    }
  >;
}> {
  return apiFetch<{
    data: Record<
      number,
      {
        chapterId: number | null;
        videoWatched: boolean;
        notesTaken: boolean;
        miniTestDone: boolean;
        status: "completed" | "in_progress" | "not_started";
        progress: number;
      }
    >;
  }>(`/v2/interactions/learning-progress/by-topic?course_id=${examId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
    },
  });
}

/**
 * Create or update resume state
 */
export async function setResumeState(
  payload: {
    course_id: string|number;
    paper_id?: string | number | null;
    section_id?: string | number | null;
    chapter_id?: string | number | null;
    topic_id?: string | number | null;
  },
  signal?: AbortSignal,
): Promise<{ message: string; data: any }> {
  return apiFetch<{ message: string; data: any }>(
    "/v2/interactions/resume-state",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify(payload),
      signal,
    },
  );
}

export interface ResumeStateData {
  id: number;
  user_id: number;
  course_id: string;
  paper_id: string | null;
  section_id: string | null;
  chapter_id: string | null;
  topic_id: number | null;
  last_accessed_at: string | null;
  created_at: string;
  updated_at: string;
  // Enriched name fields
  topic_name: string | null;
  topic_number: number | null;
  chapter_name: string | null;
  chapter_number: number | null;
  section_name: string | null;
}

export interface CourseProgressSummary {
  chapters_completed: number;
  chapters_total: number;
  tests_attempted: number;
  tests_total: number;
}

export async function getCourseProgressSummary(
  courseId: string | number,
): Promise<{ data: CourseProgressSummary }> {
  return apiFetch<{ data: CourseProgressSummary }>(
    `/v2/interactions/progress-summary?course_id=${courseId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token()}`,
      },
    },
  );
}

/**
 * Fetch active resume state for a course (enriched with topic/chapter/section names)
 */
export async function getResumeState(examId: number | string): Promise<{ data: ResumeStateData | null }> {
  return apiFetch<{ data: ResumeStateData | null }>(
    `/v2/interactions/resume-state?course_id=${examId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token()}`,
      },
    }
  );
}
