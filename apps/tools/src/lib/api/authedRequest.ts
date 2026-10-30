// Authenticated JSON calls to clearcutoff-main-backend for every Tools feature
// that needs the visitor's session (Syllabus Tracker "Save for Future", the
// free-PDF request). Plain fetch + the shared session token, so none of these
// features pulls the axios-based auth bundle into a tool's initial load.
import { getToken } from "@clearcut/auth/token";
import { endSession } from "../toolsSession";
import { MAIN_BACKEND_URL } from "./mainBackend";

/** No token, or the backend rejected it (expired/revoked). The local token
 * is already cleared by the time this is thrown. */
export class SessionExpiredError extends Error {
  constructor() {
    super("Session expired");
    this.name = "SessionExpiredError";
  }
}

interface ApiEnvelope<T> {
  status: "success" | "error";
  message: string;
  data: T;
}

export async function authedRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  if (!token) throw new SessionExpiredError();

  const res = await fetch(`${MAIN_BACKEND_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    endSession();
    throw new SessionExpiredError();
  }
  if (!res.ok) {
    throw new Error(`API request failed (${res.status}): ${path}`);
  }

  const body: ApiEnvelope<T> = await res.json();
  if (body.status !== "success") {
    throw new Error(body.message || "API returned an error");
  }
  return body.data;
}
