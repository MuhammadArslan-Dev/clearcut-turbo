"use client";
import useSWR from "swr";

import { Exam } from "@/types/Exam";


const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch exams");
    return res.json();
};

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_MAIN_BACKEND || "http://clearcutoff-main-backend.test";


export function useExams(language?: string) {
    // const [data, setData] = useState<Exam[]>([]);
    // const [loading, setLoading] = useState(false);
    // const [error, setError] = useState<Error | null>(null);

    // useEffect(() => {
    //     if (!language) {
    //         setData([]);
    //         return;
    //     }

    //     let cancelled = false;
    //     setLoading(true);
    //     setError(null);

    //     fetchExams(language)
    //         .then((exams) => {
    //             if (!cancelled) setData(exams);
    //         })
    //         .catch((err) => {
    //             if (!cancelled) setError(err as Error);
    //         })
    //         .finally(() => {
    //             if (!cancelled) setLoading(false);
    //         });

    //     return () => {
    //         cancelled = true;
    //     };
    // }, [language]);

    // return { exams: data, loading, error };


    const shouldFetch = Boolean(language);

    const { data, error, isLoading } = useSWR<Exam[]>(
        shouldFetch
            ? `${LARAVEL_API_URL}/blog/exam?status=active`
            : null, // null = SWR won’t run
        fetcher,
        {
            revalidateOnFocus: false,   // don't refetch on window focus
            dedupingInterval: 60_000,   // 1 min: same key calls are deduped
        }
    );

    return {
        exams: data ?? [],
        loading: isLoading,
        error,
    };
}