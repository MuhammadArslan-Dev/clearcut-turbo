import { SectionalSection, TestsList } from "@/lib/tests/getExam";
import { create } from "zustand";
import { Paper } from "../../preparation/types/types";

/* ---------------- Types ---------------- */

export type RecommendedTestData = {
  id: number;
  title: string;
  description?: string;
  image?: string;
  course?: string;
  slug?: string;
  time?: string;
  duration?: string;
  difficulty?: string;
  totalQuestions?: number;
  totalMarks?: number;
  passPercentage?: number;
  sectionId?: number | string;
  paperId?: number | string;
  courseId?: number | string;
  test?: TestsList | null;
};

export type ProgressData = {
  title: string;
  subtitle: string;
  total: number;
  completed: number;
  testType: string;
};

interface TestListDataStore {
  isLoading: boolean;
  isError: boolean;
  papers: Paper[] | null;
  paper: Paper | null;

  // The paper id each test-series endpoint defaulted to on its own most
  // recent no-paper_id response, per query-key prefix ("chapter-test",
  // "sectional-test", ...). Lives here (not a per-component ref) so it
  // survives a tab switch unmounting/remounting the component — otherwise
  // a fresh ref reset the "is this the default paper or a real override"
  // check on every remount, computing a different query key than the tab's
  // first visit did and missing the cache on every revisit.
  defaultPaperIdByEndpoint: Record<string, number | null>;

  recommendedTests: RecommendedTestData | null;
  progressData: ProgressData | null;

  // Sections for whichever test-series tab is currently mounted
  // (chapter-tests or sectional-tests — full-length-papers has no sections).
  // Powers the shell-level "Index" button/modal, which lives outside
  // ChapterTest/SectionalTest and otherwise has no access to their data.
  indexSections: SectionalSection[] | null;
  selectedSectionId: number | string | null;

  setData: (
    recommendedTests: RecommendedTestData | null,
    progressData: ProgressData | null,
  ) => void;

  setLoading: (loading: boolean) => void;
  setPapers: (papers: Paper[] | null) => void;
  setPaper: (paper: Paper | null) => void;
  setDefaultPaperId: (endpoint: string, paperId: number | null) => void;
  setError: (error: boolean) => void;
  setIndexSections: (sections: SectionalSection[] | null) => void;
  setSelectedSectionId: (id: number | string | null) => void;

  refetch: () => Promise<void>;
}

/* ---------------- Store ---------------- */

export const useTestListDataStore = create<TestListDataStore>((set) => ({
  isLoading: false,
  isError: false,
  papers: null,
  paper: null,
  defaultPaperIdByEndpoint: {},

  recommendedTests: null,
  progressData: null,
  indexSections: null,
  selectedSectionId: null,

  setPapers: (papers) => set({ papers }),
  // ChapterTest and SectionalTest share this single `paper` across a tab
  // switch by design (see their own comments), but each tab's data-init
  // effect calls this with the paper object its OWN response just returned
  // — a fresh object every fetch even when it's the same paper by id. Since
  // `paper.id` also feeds those effects' query-key derivation
  // (`explicitPaperId`), a same-id-different-object write here can flip
  // `paper`'s reference, which those effects then chase, deriving a new
  // query key, refetching, and calling this again — the "Maximum update
  // depth exceeded" loop on tab switch (CLEARCUTOFF-NEXTJS-APP-7A).
  // Comparing by id (not reference) before notifying breaks that cycle.
  setPaper: (paper) =>
    set((state) => (state.paper?.id === paper?.id ? state : { paper })),
  setDefaultPaperId: (endpoint, paperId) =>
    set((state) =>
      state.defaultPaperIdByEndpoint[endpoint] === paperId
        ? state
        : {
            defaultPaperIdByEndpoint: {
              ...state.defaultPaperIdByEndpoint,
              [endpoint]: paperId,
            },
          },
    ),
  // Same reasoning as setPaper: ChapterTest/SectionalTest recompute
  // `sections` (and re-call this) from a fresh React Query response object
  // on every render where their query key derivation is unsettled. Bailing
  // out when the section list is unchanged by id stops this from cascading
  // into the Index modal / anything else subscribed to `indexSections`.
  setIndexSections: (indexSections) =>
    set((state) => {
      const prev = state.indexSections;
      const same =
        prev === indexSections ||
        (!!prev &&
          !!indexSections &&
          prev.length === indexSections.length &&
          prev.every((s, i) => s.id === indexSections[i]?.id));
      return same ? state : { indexSections };
    }),
  setSelectedSectionId: (selectedSectionId) =>
    set((state) =>
      state.selectedSectionId === selectedSectionId ? state : { selectedSectionId },
    ),

  setData: (recommendedTests, progressData) =>
    set({
      recommendedTests,
      progressData,
      isLoading: false,
      isError: false,
    }),

  setLoading: (loading) =>
    set({
      isLoading: loading,
    }),

  setError: (error) =>
    set({
      isError: error,
      isLoading: false,
    }),

  refetch: async () => {
    try {
      set({ isLoading: true, isError: false });

      // Example API call (replace with real one)
      const res = await fetch("/api/tests");
      const data = await res.json();

      set({
        recommendedTests: data.recommendedTests,
        progressData: data.progressData,
        isLoading: false,
      });
    } catch (err) {
      console.error(err);

      set({
        isError: true,
        isLoading: false,
      });
    }
  },
}));
