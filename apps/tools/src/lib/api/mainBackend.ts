// Base URL of clearcutoff-main-backend (includes the trailing /api), read at
// RUNTIME in the browser — see NEXT_PUBLIC_LARAVEL_MAIN_BACKEND in
// .env.example for why this is a NEXT_PUBLIC_ var unlike TOOLS_API_URL
// (build-time only, everywhere else in this app).
export const MAIN_BACKEND_URL =
  process.env.NEXT_PUBLIC_LARAVEL_MAIN_BACKEND || "https://apptest.clearcutoff.in/api";
