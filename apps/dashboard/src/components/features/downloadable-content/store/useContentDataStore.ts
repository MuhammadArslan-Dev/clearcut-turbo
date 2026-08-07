import { create } from "zustand";
import { Paper, Section } from "../../preparation/types/types";

interface CourseState {
  papers: Paper[];
  sectionsMap: Record<number, Section[]>;

  selectedPaperId: number | null;
  selectedSections: number | null;

  setData: (papers: Paper[], sections: Record<number, Section[]>) => void;
  selectPaper: (paperId: number) => void;
  toggleSection: (sectionId: number) => void;
}

export const useContentDataStore = create<CourseState>((set, get) => ({
  papers: [],
  sectionsMap: {},

  selectedPaperId: null,
  selectedSections: null,

  setData: (papers, sections) => {
    const firstPaperId = papers[0]?.id;
    const firstSections = sections[firstPaperId] || [];

    set({
      papers,
      sectionsMap: sections,
      selectedPaperId: firstPaperId,
      selectedSections: firstSections[0] ? firstSections[0].id : null,
    });
  },

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
