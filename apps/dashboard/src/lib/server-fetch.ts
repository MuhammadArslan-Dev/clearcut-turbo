import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchWithRetry } from "./api/fetchWithRetry";

// lib/api/server-fetch.ts
const API_BASE_URL = process.env.LARAVEL_MAIN_BACKEND!;

export async function serverFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const res = await fetchWithRetry(`${API_BASE_URL}${path}`, {
        ...options,
    });

    if (!res.ok) {
        throw new Error(await res.text());
    }

    return res.json();
}


export async function authFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {

    const token = (await cookies()).get("auth_token")?.value;


    const res = await fetchWithRetry(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`,
        },
    });

    if (res.status === 401) {
        // Stale/expired session token — same destination the middleware
        // sends unauthenticated visitors to.
        redirect("https://clearcutoff.in");
    }

    if (!res.ok) {
        throw new Error(await res.text());
    }

    return res.json();
}