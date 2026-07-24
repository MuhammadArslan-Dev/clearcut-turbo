export async function apiFetch(
  path: string,
  options: RequestInit = {}
) {
  return fetch(`${process.env.NEXT_PUBLIC_LARAVEL_MAIN_BACKEND}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}
