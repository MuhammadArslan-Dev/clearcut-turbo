import { apiFetch } from "./client";

export type CreateAppHandoffResponse = {
  status: string;
  message: string;
  data: {
    code: string;
    expires_in: number;
  };
};

/**
 * Web -> Android app session handoff, step 1: mint a short-lived, single-use
 * code the app can exchange for its own session token (backend:
 * AuthController::createAppHandoff). Deliberately requires the caller's own
 * existing session (apiFetch attaches the Bearer token automatically) — this
 * never returns the actual long-lived auth token, only a 90s, one-time code,
 * so the deep link that carries it can't leak a permanent credential.
 *
 * Callers: the "Continue in App" widget (custom-scheme deep link) and the
 * `/dashboard` App Link landing screen (verified Android App Link) both use
 * this — see their own comments for how the code is attached to each.
 */
export async function createAppHandoffCode(): Promise<string> {
  const res = await apiFetch<CreateAppHandoffResponse>(
    "/v1/auth/handoff/create",
    { method: "POST" },
  );
  return res.data.code;
}
