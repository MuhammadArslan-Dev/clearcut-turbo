import { create } from "zustand";
import {
  ExamSyllabusData,
  Paper,
  Section,
  Chapter,
  Topic,
} from "../types/types";

/* ----------------------------------
   HELPERS
----------------------------------- */

export const getNextTopic = (state: PreparationState): Topic | undefined => {
  const {
    selectedPaperId,
    selectedSectionId,
    selectedChapter,
    selectedTopic,
    chapters,
    sectionsByPaperId,
  } = state;

  if (
    !selectedPaperId ||
    !selectedSectionId ||
    !chapters ||
    !selectedChapter ||
    !selectedTopic
  ) {
    return undefined;
  }

  const topicIndex = getIndex(selectedChapter.topics, selectedTopic);

  // 1️⃣ Next topic in same chapter
  if (topicIndex + 1 < selectedChapter.topics.length) {
    return selectedChapter.topics[topicIndex + 1];
  }

  // 2️⃣ First topic of next chapter
  const chapterIndex = getIndex(chapters, selectedChapter);
  if (chapterIndex + 1 < chapters.length) {
    return chapters[chapterIndex + 1].topics[0];
  }

  // 3️⃣ First topic of next section
  const sections = sectionsByPaperId[selectedPaperId];
  const sectionIndex = sections.findIndex((s) => s.id === selectedSectionId);

  if (sectionIndex + 1 < sections.length) {
    return undefined; // section changes → chapters will reload
  }

  return undefined;
};

export const getPrevTopic = (state: PreparationState): Topic | undefined => {
  const {
    selectedPaperId,
    selectedSectionId,
    selectedChapter,
    selectedTopic,
    chapters,
    sectionsByPaperId,
  } = state;

  if (
    !selectedPaperId ||
    !selectedSectionId ||
    !chapters ||
    !selectedChapter ||
    !selectedTopic
  ) {
    return undefined;
  }

  const topicIndex = getIndex(selectedChapter.topics, selectedTopic);

  // 1️⃣ Previous topic in chapter
  if (topicIndex > 0) {
    return selectedChapter.topics[topicIndex - 1];
  }

  // 2️⃣ Last topic of previous chapter
  const chapterIndex = getIndex(chapters, selectedChapter);
  if (chapterIndex > 0) {
    const prevChapter = chapters[chapterIndex - 1];
    return prevChapter.topics[prevChapter.topics.length - 1];
  }

  // 3️⃣ Previous section (unknown until chapters load)
  const sections = sectionsByPaperId[selectedPaperId];
  const sectionIndex = sections.findIndex((s) => s.id === selectedSectionId);

  if (sectionIndex > 0) {
    return undefined;
  }

  return undefined;
};

const getIndex = <T extends { id: number }>(
  list: T[] | undefined,
  item?: T,
) => {
  if (!list || !item) return -1;
  return list.findIndex((i) => i.id === item.id);
};

const flattenTopics = (topics: Topic[]): Topic[] => {
  const result: Topic[] = [];

  for (const topic of topics) {
    if (topic.children?.length) {
      result.push(...topic.children);
    } else {
      result.push(topic);
    }
  }

  return result;
};


export type TopicProgress = {
  chapterId?: number | string;
  videoWatched: boolean;
  notesTaken: boolean;
  miniTestDone: boolean;
  status: "in_progress" | "completed";
};

/* ----------------------------------
   STORE STATE
----------------------------------- */

interface PreparationState {
  papers: Paper[];
  mainData?: ExamSyllabusData["mainData"];

  chapters?: Chapter[];
  selectedChapter?: Chapter;
  selectedTopic?: Topic;
  selectedSection?: Section;
  nextTopic?: Topic;
  prevTopic?: Topic;

  progressByTopicId: Record<number, TopicProgress>;

  loading: boolean;
  error: boolean;

  sectionsByPaperId: Record<number, Section[]>;
  chaptersBySectionId: Record<number, Chapter[]>;

  selectedPaperId?: number;
  selectedSectionId?: number;

  /* ACTIONS */
  hydrateFromApi: (data: ExamSyllabusData) => void;
  selectPaper: (paperId: number) => void;
  selectSection: (sectionId: number) => void;
  setState: (loading?: boolean, error?: boolean) => void;

  setChapters: (chapters?: Chapter[]) => void;
  setChapter: (chapter?: Chapter) => void;
  setTopic: (topic?: Topic) => void;

  markTopicFieldDone: (
    topicId: number,
    field: "videoWatched" | "notesTaken" | "miniTestDone",
  ) => void;

  goToNextTopic: () => void;
  goToPrevTopic: () => void;
}

/* ----------------------------------
   STORE
----------------------------------- */

export const usePreparationStore = create<PreparationState>((set) => ({
  papers: [],
  mainData: undefined,

  chapters: undefined,
  selectedChapter: undefined,
  selectedTopic: undefined,
  nextTopic: undefined,
  prevTopic: undefined,

  progressByTopicId: {},

  loading: false,
  error: false,

  sectionsByPaperId: {},
  chaptersBySectionId: {},

  selectedPaperId: undefined,
  selectedSectionId: undefined,

  /* ----------------------------------
     HYDRATE
  ----------------------------------- */

  hydrateFromApi: (data) => {
    const firstPaperId = data.paper?.[0]?.id;
    const firstSection = firstPaperId
      ? data.sections?.[firstPaperId]?.[0]
      : undefined;

    const firstSectionId = firstSection?.id;

    set({
      papers: data.paper,
      mainData: data.mainData,
      sectionsByPaperId: data.sections,

      selectedPaperId: firstPaperId,
      selectedSectionId: firstSectionId,
      selectedSection: firstSection,

      loading: false,
      error: false,
    });
  },

  /* ----------------------------------
     BASIC SETTERS
  ----------------------------------- */

  setState: (loading, error) =>
    set({
      loading: loading ?? false,
      error: error ?? false,
    }),

  setChapters: (chapters) =>
    set(() => {
      if (!chapters || chapters.length === 0) {
        return {
          chapters: [],
          selectedChapter: undefined,
          selectedTopic: undefined,
        };
      }

      const firstChapter = chapters[0];
      const firstTopic = firstChapter.topics?.[0];

      return {
        chapters,
        selectedChapter: firstChapter,
        selectedTopic: firstTopic,
      };
    }),

  setChapter: (chapter) =>
    set({
      selectedChapter: chapter,
      selectedTopic: chapter?.topics?.[0],
    }),

  setTopic: (topic) =>
    set({
      selectedTopic: topic,
    }),

  /* ----------------------------------
     UI SELECTION
  ----------------------------------- */

  selectPaper: (paperId) =>
    set((state) => {
      const firstSection = state.sectionsByPaperId?.[paperId]?.[0];

      return {
        selectedPaperId: paperId,
        selectedSectionId: firstSection?.id,
        selectedSection: firstSection,
        chapters: undefined,
        selectedChapter: undefined,
        selectedTopic: undefined,
      };
    }),

  selectSection: (sectionId) =>
    set((state) => {
      const paperId = state.selectedPaperId;
      const sections = paperId ? state.sectionsByPaperId?.[paperId] : undefined;

      const selectedSection = sections?.find(
        (section) => section.id === sectionId,
      );

      return {
        selectedSectionId: sectionId,
        selectedSection,
        chapters: undefined,
        selectedChapter: undefined,
        selectedTopic: undefined,
      };
    }),

  /* ----------------------------------
     NAVIGATION
  ----------------------------------- */

  goToNextTopic: () =>
    set((state) => {
      const {
        selectedPaperId,
        selectedSectionId,
        selectedChapter,
        selectedTopic,
        chapters,
        sectionsByPaperId,
        progressByTopicId,
      } = state;

      if (
        !selectedPaperId ||
        !selectedSectionId ||
        !chapters ||
        !selectedChapter ||
        !selectedTopic
      ) {
        return {};
      }

      const topicIndex = getIndex(selectedChapter.topics, selectedTopic);

      /* 1️⃣ Next topic in same chapter */
      if (topicIndex + 1 < selectedChapter.topics.length) {
        const nextTopic = selectedChapter.topics[topicIndex + 1];

        return {
          selectedTopic: nextTopic,
          progressByTopicId: progressByTopicId[nextTopic.id]
            ? progressByTopicId
            : {
                ...progressByTopicId,
                [nextTopic.id]: {
                  chapterId: selectedChapter.id,
                  videoWatched: false,
                  notesTaken: false,
                  miniTestDone: false,
                  status: "in_progress",
                },
              },
        };
      }

      /* 2️⃣ Next chapter */
      const chapterIndex = getIndex(chapters, selectedChapter);
      if (chapterIndex + 1 < chapters.length) {
        const nextChapter = chapters[chapterIndex + 1];
        const firstTopic = nextChapter.topics[0];

        return {
          selectedChapter: nextChapter,
          selectedTopic: firstTopic,
          progressByTopicId: progressByTopicId[firstTopic.id]
            ? progressByTopicId
            : {
                ...progressByTopicId,
                [firstTopic.id]: {
                  chapterId: nextChapter.id,
                  videoWatched: false,
                  notesTaken: false,
                  miniTestDone: false,
                  status: "in_progress",
                },
              },
        };
      }

      /* 3️⃣ Next section */
      const sections = sectionsByPaperId[selectedPaperId];
      const sectionIndex = sections.findIndex(
        (s) => s.id === selectedSectionId,
      );

      if (sectionIndex + 1 < sections.length) {
        return {
          selectedSectionId: sections[sectionIndex + 1].id,
          chapters: undefined,
          selectedChapter: undefined,
          selectedTopic: undefined,
        };
      }

      // console.log("🎉 Paper Complete");
      return {};
    }),

  markTopicFieldDone: (topicId, field) =>
    set((state) => {
      const topic = state.progressByTopicId[topicId];
      if (!topic) return {};

      const updated = {
        ...topic,
        [field]: true,
      };

      const completed =
        updated.videoWatched && updated.notesTaken && updated.miniTestDone;

      return {
        progressByTopicId: {
          ...state.progressByTopicId,
          [topicId]: {
            ...updated,
            status: completed ? "completed" : "in_progress",
          },
        },
      };
    }),

  goToPrevTopic: () =>
    set((state) => {
      const {
        selectedPaperId,
        selectedSectionId,
        selectedChapter,
        selectedTopic,
        chapters,
        sectionsByPaperId,
      } = state;

      if (
        !selectedPaperId ||
        !selectedSectionId ||
        !chapters ||
        !selectedChapter ||
        !selectedTopic
      ) {
        return {};
      }

      const topicIndex = getIndex(selectedChapter.topics, selectedTopic);

      /* 1️⃣ Previous topic */
      if (topicIndex > 0) {
        return {
          selectedTopic: selectedChapter.topics[topicIndex - 1],
        };
      }

      /* 2️⃣ Previous chapter */
      const chapterIndex = getIndex(chapters, selectedChapter);
      if (chapterIndex > 0) {
        const prevChapter = chapters[chapterIndex - 1];
        return {
          selectedChapter: prevChapter,
          selectedTopic: prevChapter.topics[prevChapter.topics.length - 1],
        };
      }

      /* 3️⃣ Previous section */
      const sections = sectionsByPaperId[selectedPaperId];
      const sectionIndex = sections.findIndex(
        (s) => s.id === selectedSectionId,
      );

      if (sectionIndex > 0) {
        return {
          selectedSectionId: sections[sectionIndex - 1].id,
          chapters: undefined,
          selectedChapter: undefined,
          selectedTopic: undefined,
        };
      }

      // console.log("🚫 Already at beginning");
      return {};
    }),
}));
