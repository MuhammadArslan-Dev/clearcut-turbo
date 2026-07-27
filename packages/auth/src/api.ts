import type { AxiosInstance } from "axios";

/**
 * The zod schemas are loaded ON DEMAND, not at module scope.
 *
 * Why: this module is reached from every app's root layout (root layout →
 * AuthProvider → @clearcut/auth → api.ts), so a static import put the whole of
 * zod into the initial client bundle of every page. Measured on the landing
 * production build: the chunk carrying zod was 73 KB transferred, loaded
 * BEFORE DCL, and Lighthouse reported it **83% unused** (57 KB wasted) — 1112
 * zod markers in a chunk that a visitor who never opens the login modal never
 * executes.
 *
 * These schemas validate a login/OTP payload immediately before an HTTP POST.
 * They are only ever needed once a user actually submits an auth form, which
 * is exactly the shape a dynamic import is for.
 *
 * Behaviour is unchanged: the endpoint functions were already async (they
 * return the axios promise), validation still runs against the same schema and
 * still throws the same ZodError on invalid input before any request is sent.
 * The only difference is WHEN the schema module is fetched.
 */
const loadLoginSchema = () =>
  import("@clearcut/validation/features/auth/login").then((m) => m.loginSchema);
const loadOtpVerifySchema = () =>
  import("@clearcut/validation/features/auth/otp-verify").then(
    (m) => m.otpVerifySchema,
  );

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
    loginUser: async (data: LoginPayload) =>
      apiClient.post("/v1/auth/login", (await loadLoginSchema()).parse(data)),
    loginUser2: async (data: LoginPayload) =>
      apiClient.post("/v1/auth/login", (await loadLoginSchema()).parse(data)),
    verifyMe: () => apiClient.get("/v1/me"),
    verifyUser: async (data: OtpVerifyPayload) =>
      apiClient.post(
        "/v1/auth/register",
        (await loadOtpVerifySchema()).parse(data),
      ),
    logoutUser: () => apiClient.post("/v1/logout"),
    verifyOtp: async (data: OtpVerifyPayload) =>
      apiClient.post(
        "/v1/auth/varify-otp",
        (await loadOtpVerifySchema()).parse(data),
      ),
    verifyOtp2: async (data: OtpVerifyPayload) =>
      apiClient.post(
        "/v2/auth/varify-otp",
        (await loadOtpVerifySchema()).parse(data),
      ),
    createCourse: (data: CreateCoursePayload) =>
      apiClient.post("/v2/enrollment/create-by-name", data),
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
