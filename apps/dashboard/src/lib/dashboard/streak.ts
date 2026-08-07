import { apiFetch } from "../api/client";

const token = () => {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("auth_token="))
    ?.split("=")[1];
};
export type WeekDay = {
  date: string;
  day: string;
  completed: boolean;
};

export type StreakResponse = {
  current_streak: number;
  longest_streak: number;
  today_minutes: number;
  required_minutes: number;
  week: WeekDay[];
};

/**
 * Get streak data
 */
export async function getStreak(): Promise<StreakResponse> {
  return apiFetch<StreakResponse>("/v2/streak", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
    },
  });
}

/**
 * Log learning minutes
 */
export async function logMinutes(minutes: number): Promise<void> {
  await apiFetch<void>("/v2/streak/log-minutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
    },
    body: JSON.stringify({ minutes }),
  });
}
