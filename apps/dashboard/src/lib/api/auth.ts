// lib/api/auth.ts
import { UserPreview } from "@/types/User";
import { apiFetch } from "./client";

export type LoginResponse = {
  token: string;
  user: UserPreview;
};

export type UserPreviewResponse = {
  data: UserPreview;
  status: string;
  message: string;
};

export async function loginApi(payload: {
  email: string;
  password: string;
}): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMeApi(token: string): Promise<UserPreviewResponse> {
  return apiFetch<UserPreviewResponse>(
    "/v1/auth-user",
    { method: "GET" },
    token,
  );
}

export async function logoutApi(token?: string): Promise<void> {
  return apiFetch("/v1/logout", { method: "POST" });
}
export async function deleteAccount(): Promise<void> {
  return apiFetch("/v1/delete-account", { method: "DELETE" });
}

export async function webhookPaymentInitiate(courseId: string, payload?: any) {
  return apiFetch(`/v2/payment/webhook-trigger`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ course_id: courseId, ...payload }),
  });
}

// Internal counterpart to the CustomizeProduct Facebook Pixel event — fired
// alongside it from payment/initiated/page.tsx's handleSelectVariant.
// Fire-and-forget: the backend dedupes to one "customization" record per
// (user, course) regardless of how many times this is called.
export async function recordCourseCustomization(
  examId: number,
  payload?: { plan?: string; price?: number },
) {
  return apiFetch(`/v2/enrollment/customization`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ exam_id: examId, ...payload }),
  });
}
