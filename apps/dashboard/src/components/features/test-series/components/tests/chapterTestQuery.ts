import { getChapterTestList, SectionalTestV2Data } from "@/lib/tests/getExam";

// The chapter-test list query, shared by ChapterTest (which renders it) and
// TestListPage (which prefetches it). ChapterTest is a next/dynamic chunk, so
// its own useQuery only starts once that chunk has downloaded; TestListPage
// starts the same request (same key, same fn) while the chunk is still on its
// way, and ChapterTest then finds it in the cache. Kept out of ChapterTest.tsx
// so importing it doesn't pull that chunk into the page.

/**
 * Passing paper_id vs. omitting it returns byte-identical data as long as
 * paper_id is the paper the backend would've defaulted to anyway, so it is
 * only sent once the user has picked a DIFFERENT paper than that default.
 * (See the comments in ChapterTest.tsx for why the default lives in the store.)
 */
export function chapterTestExplicitPaperId(
  paperId: number | string | null | undefined,
  defaultPaperId: number | string | null,
) {
  return paperId && paperId !== defaultPaperId ? paperId : undefined;
}

export function chapterTestQueryOptions(
  courseId: number | string | undefined,
  explicitPaperId: number | string | undefined,
) {
  return {
    queryKey: ["chapter-test", courseId, explicitPaperId ?? null] as const,
    queryFn: async (): Promise<SectionalTestV2Data> => {
      const res = await getChapterTestList(courseId, explicitPaperId);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  };
}
