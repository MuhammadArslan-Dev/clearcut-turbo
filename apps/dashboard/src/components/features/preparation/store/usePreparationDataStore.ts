import { create } from "zustand";
import {
  ExamSyllabusData,
  Paper,
  Section,
  SectionArea,
  Chapter,
  Topic,
} from "../types/types";

import { ExamEnrollmentWithExam } from "@/lib/dashboard/learning";
import { ResumeStatePayload } from "@/types/courseresume";
import { trackEvent } from "@/lib/analytics/browser";

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
type TopicField = "videoWatched" | "notesTaken" | "miniTestDone";

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
  course?: ExamEnrollmentWithExam | null;
  papers: Paper[];
  mainData?: ExamSyllabusData["mainData"];

  chapters?: Chapter[];
  selectedChapter?: Chapter;
  selectedTopic?: Topic;
  selectedSection?: Section;
  nextTopic?: Topic;
  prevTopic?: Topic;

  progressByTopicId: Record<number | string, TopicProgress>;

  loading: boolean;
  error: boolean;

  sectionsByPaperId: Record<number, Section[]>;
  chaptersBySectionId: Record<number, Chapter[]>;

  selectedPaperId?: number;
  selectedSectionId?: number;
  selectedArea?: SectionArea | null;

  /* ACTIONS */
  hydrateFromApi: (data: ExamSyllabusData) => void;
  selectPaper: (paperId: number) => void;
  selectSection: (sectionId: number) => void;
  selectArea: (area: SectionArea | null) => void;
  setState: (loading?: boolean, error?: boolean) => void;

  setChapters: (chapters?: Chapter[], state?: ResumeStatePayload) => void;
  setChapter: (chapter?: Chapter) => void;
  setTopic: (topic?: Topic) => void;

  markTopicFieldDone: (topicId: number, field: TopicField) => void;

  progressByTopic: (data: Record<number | string, TopicProgress>) => void;
  goToNextTopic: () => void;
  goToPrevTopic: () => void;
  markGuideAsSeen: () => void;
  guideShownThisSession: boolean;
  setGuideShownThisSession: () => void;
}

/* ----------------------------------
   STORE
----------------------------------- */

export const usePreparationStore = create<PreparationState>((set) => ({
  course: null,
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
  selectedArea: null,
  guideShownThisSession: false,

  /* ----------------------------------
     HYDRATE
  ----------------------------------- */
  hydrateFromApi: (data) => {
    const firstPaperId = data.paper?.[0]?.id;
    const firstSection = firstPaperId
      ? data.sections?.[firstPaperId]?.[0]
      : undefined;

    const firstSectionId = firstSection?.id;

    set((state) => ({
      course: {
        ...data?.course,
        // preserve locally-set flag so the guide modal doesn't reopen
        // after navigating away and back while the API call is still in-flight
        study_guide_seen:
          state.course?.study_guide_seen || data?.course?.study_guide_seen,
      },
      papers: data.paper,
      mainData: data.mainData,
      sectionsByPaperId: data.sections,

      selectedPaperId: data?.paper_id ?? firstPaperId,
      selectedSectionId: data?.section_id ?? firstSectionId,
      selectedSection: firstSection,

      loading: false,
      error: false,
    }));
  },

  progressByTopic: (data) => {
    set({
      progressByTopicId: data,
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

  setChapters: (chapters, state) =>
    set(() => {
      // Reset if empty
      if (!chapters || chapters.length === 0) {
        return {
          chapters: [],
          selectedChapter: undefined,
          selectedTopic: undefined,
        };
      }

      // Try to restore previous chapter if it exists
      const restoredChapter = state?.chapter_id
        ? chapters.find((chapter) => chapter.id === Number(state.chapter_id))
        : undefined;

      const selectedChapter = restoredChapter ?? chapters[0];

      const flatTopics = selectedChapter?.topics
        ? flattenTopics(selectedChapter.topics)
        : [];

      const restoredTopic = state?.topic_id
        ? flatTopics.find((topic) => topic.id === Number(state?.topic_id))
        : undefined;

      const selectedTopic = restoredTopic ?? flatTopics[0];

      // // Flatten topics safely
      // const flatTopics = selectedChapter?.topics
      //   ? flattenTopics(selectedChapter.topics)
      //   : [];

      // const selectedTopic = flatTopics[0];

      return {
        chapters,
        selectedChapter,
        selectedTopic,
      };
    }),

  setChapter: (chapter) =>
    set(() => {
      if (!chapter) {
        return { selectedChapter: undefined, selectedTopic: undefined };
      }

      const flat = flattenTopics(chapter.topics);
      const firstLeaf = flat[0];

      return {
        selectedChapter: chapter,
        selectedTopic: firstLeaf,
      };
    }),

  setTopic: (topic) =>
    set({
      selectedTopic: topic,
    }),

  /* ----------------------------------
     UI SELECTION
  ----------------------------------- */

  selectArea: (area) =>
    set({
      selectedArea: area,
      selectedChapter: undefined,
      selectedTopic: undefined,
    }),

  selectPaper: (paperId) =>
    set((state) => {
      const firstSection = state.sectionsByPaperId?.[paperId]?.[0];

      return {
        selectedPaperId: paperId,
        selectedSectionId: firstSection?.id,
        selectedSection: firstSection,
        selectedArea: null,
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
        selectedArea: null,
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

      const sections = sectionsByPaperId[selectedPaperId];
      const currentSection = sections?.find((s) => s.id === selectedSectionId);

      const flatTopics = flattenTopics(selectedChapter.topics);
      const topicIndex = getIndex(flatTopics, selectedTopic);

      /* 1️⃣ Next topic in same chapter */
      if (topicIndex + 1 < flatTopics.length) {
        const nextTopic = flatTopics[topicIndex + 1];

        trackEvent("Topic Viewed", {
          entry_point: "next",
          section_name: currentSection?.name ?? "",
          chapter_name: selectedChapter.name,
          topic_name: nextTopic.name,
          // parent_topic_name: flatTopics.find((t) => t.id === nextTopic?.parentId)
          //   ?.name,
        });

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

        trackEvent("Topic Viewed", {
          entry_point: "next",
          section_name: currentSection?.name ?? "",
          chapter_name: nextChapter.name,
          topic_name: firstTopic.name,
          parent_topic_name: '',
        });

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
      const sectionIndex = sections.findIndex(
        (s) => s.id === selectedSectionId,
      );

      if (sectionIndex + 1 < sections.length) {
        const nextSection = sections[sectionIndex + 1];

        // no topic yet — next section will load chapters/topics async
        trackEvent("Topic Viewed", {
          entry_point: "next_section",
          section_id: nextSection.id.toString(),
          section_name: nextSection.name,
          chapter_id: undefined,
          chapter_name: "",
          topic_id: undefined,
          topic_name: "",
          parent_topic_id: undefined,
          parent_topic_name: undefined,
        });

        return {
          selectedSectionId: nextSection.id,
          selectedSection: nextSection,
          selectedArea: null,
          chapters: undefined,
          selectedChapter: undefined,
          selectedTopic: undefined,
        };
      }

      // console.log("🎉 Paper Complete");
      return {};
    }),

  markTopicFieldDone: (topicId, field) => {
    set((state) => {
      const topic = state.progressByTopicId[topicId];
      if (!topic) return state;

      const updated = { ...topic, [field]: true };

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
    });
  },

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

    const sections = sectionsByPaperId[selectedPaperId];
    const currentSection = sections?.find(
      (s) => s.id === selectedSectionId
    );

    const flatTopics = flattenTopics(selectedChapter.topics);
    const topicIndex = getIndex(flatTopics, selectedTopic);

    /* 1️⃣ Previous topic */
    if (topicIndex > 0) {
      const prevTopic = flatTopics[topicIndex - 1];

      trackEvent("Topic Viewed", {
        entry_point: "prev",
        section_name: currentSection?.name ?? "",
        chapter_name: selectedChapter.name,
        topic_name: prevTopic.name,
        // parent_topic_name: flatTopics.find(
        //   (t) => t.id === prevTopic.parentId
        // )?.name,
      });

      return {
        selectedTopic: prevTopic,
      };
    }

    /* 2️⃣ Previous chapter */
    const chapterIndex = getIndex(chapters, selectedChapter);
    if (chapterIndex > 0) {
      const prevChapter = chapters[chapterIndex - 1];
      const flatPrev = flattenTopics(prevChapter.topics);
      const lastTopic = flatPrev[flatPrev.length - 1];

      trackEvent("Topic Viewed", {
        entry_point: "prev",
        section_name: currentSection?.name ?? "",
        chapter_name: prevChapter.name,
        topic_name: lastTopic.name,
        // parent_topic_name: flatPrev.find(
        //   (t) => t.id === lastTopic?.parentId
        // )?.name,
      });

      return {
        selectedChapter: prevChapter,
        selectedTopic: lastTopic,
      };
    }

    /* 3️⃣ Previous section */
    const sectionIndex = sections.findIndex(
      (s) => s.id === selectedSectionId
    );

    if (sectionIndex > 0) {
      const prevSection = sections[sectionIndex - 1];

      // No topic yet — section change will load chapters/topics async
      trackEvent("Topic Viewed", {
        entry_point: "prev_section",
        section_name: prevSection.name,
        chapter_name: "",
        topic_name: "",
        parent_topic_name: undefined,
      });

      return {
        selectedSectionId: prevSection.id,
        selectedSection: prevSection,
        selectedArea: null,
        chapters: undefined,
        selectedChapter: undefined,
        selectedTopic: undefined,
      };
    }

    // console.log("🚫 Already at beginning");
    return {};
  }),

  markGuideAsSeen: () =>
    set((state) => {
      if (!state.course) return state;
      return {
        course: { ...state.course, study_guide_seen: true },
      };
    }),

  setGuideShownThisSession: () => set({ guideShownThisSession: true }),

}));
