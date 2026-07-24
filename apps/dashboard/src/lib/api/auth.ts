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
