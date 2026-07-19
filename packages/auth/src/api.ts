import type { AxiosInstance } from "axios";

import { loginSchema } from "@clearcut/validation/features/auth/login";
import { otpVerifySchema } from "@clearcut/validation/features/auth/otp-verify";

export interface LoginPayload {
  phone: string;
  user_id?: string;
}

export interface OtpVerifyPayload {
  otp: string;
  phone: string;
}

export interface CreateCoursePayload {
  phone: string;
  course_name: string;
}

/**
 * Builds the auth endpoint functions bound to a given axios instance (create
 * one per app with `@clearcut/api`'s `createApiClient`, since base URL and
 * token strategy are per-app config, not something this package decides).
 * Endpoint paths, methods, and payload validation are a 1:1 port of the
 * behavior that previously lived directly in apps/landing/src/api/authApi.ts.
 */
export function createAuthApi(apiClient: AxiosInstance) {
  return {
    loginUser: (data: LoginPayload) =>
      apiClient.post("/v1/auth/login", loginSchema.parse(data)),
    loginUser2: (data: LoginPayload) =>
      apiClient.post("/v1/auth/login", loginSchema.parse(data)),
    verifyMe: () => apiClient.get("/v1/me"),
    verifyUser: (data: OtpVerifyPayload) =>
      apiClient.post("/v1/auth/register", otpVerifySchema.parse(data)),
    logoutUser: () => apiClient.post("/v1/logout"),
    verifyOtp: (data: OtpVerifyPayload) =>
      apiClient.post("/v1/auth/varify-otp", otpVerifySchema.parse(data)),
    verifyOtp2: (data: OtpVerifyPayload) =>
      apiClient.post("/v2/auth/varify-otp", otpVerifySchema.parse(data)),
    createCourse: (data: CreateCoursePayload) =>
      apiClient.post("/v2/enrollment/create-by-name", data),
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
