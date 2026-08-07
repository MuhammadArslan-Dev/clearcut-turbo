// Mirror the base-URL resolution of the sibling client (./client.ts): when
// NEXT_PUBLIC_LARAVEL_MAIN_BACKEND is unset (e.g. local .env), fall back to the
// same local backend instead of producing an `undefined/...` URL (which 404s).
const API_BASE_URL =
  process.env.NEXT_PUBLIC_LARAVEL_MAIN_BACKEND ??
  "http://clearcutoff-main-backend.test/api";

export async function apiFetch(
  path: string,
  options: RequestInit = {}
) {
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}
