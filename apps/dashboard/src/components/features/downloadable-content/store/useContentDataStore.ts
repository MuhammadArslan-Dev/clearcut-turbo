import { create } from "zustand";
import { Paper, Section } from "../../preparation/types/types";

interface CourseState {
  papers: Paper[];
  sectionsMap: Record<number, Section[]>;

  selectedPaperId: number | null;
  selectedSections: number | null;

  // Tracks ContentShell's syllabus fetch — papers/sectionsMap stay empty
  // until setData runs, so notes-page/paper-page use this to render a
  // skeleton instead of a tab bar that's empty for one tick and then pops in.
  isLoading: boolean;

  setData: (papers: Paper[], sections: Record<number, Section[]>) => void;
  setLoading: (isLoading: boolean) => void;
  selectPaper: (paperId: number) => void;
  toggleSection: (sectionId: number) => void;
}

export const useContentDataStore = create<CourseState>((set, get) => ({
  papers: [],
  sectionsMap: {},

  selectedPaperId: null,
  selectedSections: null,
  isLoading: true,

  setData: (papers, sections) => {
    const firstPaperId = papers[0]?.id;
    const firstSections = sections[firstPaperId] || [];

    set({
      papers,
      sectionsMap: sections,
      selectedPaperId: firstPaperId,
      selectedSections: firstSections[0] ? firstSections[0].id : null,
      isLoading: false,
    });
  },

  setLoading: (isLoading) => set({ isLoading }),

  selectPaper: (paperId) => {
    const { sectionsMap } = get();
    const newSections = sectionsMap[paperId] || [];

    set({
      selectedPaperId: paperId,
      selectedSections: newSections[0] ? newSections[0].id : null,
    });
  },

  toggleSection: (sectionId) => {
    set({
      selectedSections: sectionId,
    });
  },
}));
