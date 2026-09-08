"use client";
import useSWR, { preload } from "swr";

import { Exam } from "@/types/Exam";

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch exams");
    return res.json();
};

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_MAIN_BACKEND || "http://clearcutoff-main-backend.test";

// The exams list doesn't vary by UI language (no `lang` in the query) — the
// same key/fetcher is exported so OnboardingWizard can `preload()` it the
// moment the wizard mounts (during the Language step), letting the request
// resolve in the background before ExamStep ever needs it, instead of only
// starting once the user reaches step 2 and staring at a skeleton for it.
export const EXAMS_URL = `${LARAVEL_API_URL}/blog/exam?status=active`;

export function preloadExams() {
    preload(EXAMS_URL, fetcher);
}

export function useExams() {
    const { data, error, isLoading } = useSWR<Exam[]>(EXAMS_URL, fetcher, {
        revalidateOnFocus: false,   // don't refetch on window focus
        dedupingInterval: 60_000,   // 1 min: same key calls are deduped
    });

    return {
        exams: data ?? [],
        loading: isLoading,
        error,
    };
}
