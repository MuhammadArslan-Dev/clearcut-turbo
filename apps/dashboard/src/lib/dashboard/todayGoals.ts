import { apiFetch } from "../api/client";

/* ---------------------------------- utils ---------------------------------- */

const token = () => {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("auth_token="))
    ?.split("=")[1];
};

/* ---------------------------------- types ---------------------------------- */

/** All possible goal keys */
export type GoalKey = "video_watched" | "notes_taken" | "mini_quiz_taken";

/** Single goal object */
export type TodayGoal = {
  key: GoalKey;
  title: string;
  completed: number;
  total: number;
  done: boolean;
};

/** Goals map (keyed response) */
export type TodayGoalsMap = Record<GoalKey, TodayGoal>;

/** API response */
export type TodayGoalsResponse = {
  success: boolean;
  goals: TodayGoalsMap;
};

/** Create interaction payload */
export type CreateInteractionPayload = {
  topic_id: number;
  interaction_type: TodayGoal["key"];
  notes?: string;
  meta?: Record<string, any>;
};

/** Generic API success response */
export type ApiSuccessResponse<T = unknown> = {
  success: boolean;
  data?: T;
  message?: string;
};

/* ---------------------------------- api ---------------------------------- */

/**
 * Get today's goals
 */
export async function getTodayGoals(): Promise<TodayGoalsResponse> {
  return apiFetch<TodayGoalsResponse>("/v2/interactions", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
    },
  });
}

/**
 * Create learning interaction
 */
export async function createLearningInteraction(
  payload: CreateInteractionPayload
): Promise<ApiSuccessResponse> {
  return apiFetch<ApiSuccessResponse>("/v2/interactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
    },
    body: JSON.stringify(payload),
  });
}

/**
 * Update learning interaction
 */
export async function updateLearningInteraction(
  uuid: string,
  payload: Partial<Pick<CreateInteractionPayload, "notes" | "meta">>
): Promise<ApiSuccessResponse> {
  return apiFetch<ApiSuccessResponse>(`/interactions/${uuid}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
    },
    body: JSON.stringify(payload),
  });
}

/**
 * Delete learning interaction
 */
export async function deleteLearningInteraction(
  uuid: string
): Promise<ApiSuccessResponse> {
  return apiFetch<ApiSuccessResponse>(`/interactions/${uuid}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token()}`,
    },
  });
}
