import { TestsList } from "@/lib/tests/getExam";
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

  setData: (
    recommendedTests: RecommendedTestData | null,
    progressData: ProgressData | null,
  ) => void;

  setLoading: (loading: boolean) => void;
  setPapers: (papers: Paper[] | null) => void;
  setPaper: (paper: Paper | null) => void;
  setDefaultPaperId: (endpoint: string, paperId: number | null) => void;
  setError: (error: boolean) => void;

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

  setPapers: (papers) => set({ papers }),
  setPaper: (paper) => set({ paper }),
  setDefaultPaperId: (endpoint, paperId) =>
    set((state) => ({
      defaultPaperIdByEndpoint: { ...state.defaultPaperIdByEndpoint, [endpoint]: paperId },
    })),

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
