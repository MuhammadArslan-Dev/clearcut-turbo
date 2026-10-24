import type { PrepTourTarget } from "./startGuideIds";

/**
 * "start": the chapter list — where to begin (CC-79). Runs after the
 * first-visit guide modal, and once more on a later visit if nothing has
 * been opened yet.
 * "topic": the open topic — what is on it and where to go next. Runs once,
 * the first time a student opens a topic.
 * The replay link runs every step that is on screen, in this order.
 */
export type PrepTourName = "start" | "topic";

export interface PrepTourStep {
  target: PrepTourTarget;
  tour: PrepTourName;
  /** Keys under the `startGuide` messages. */
  title: string;
  body: string;
  /**
   * Tapping the highlighted element moves the tour on (it changes something
   * in place), or ends it (it opens a modal or another page).
   */
  advanceOnClick: boolean;
  /** Without this element on screen the tour doesn't start. */
  required?: boolean;
  /** Only while the course isn't bought ("This chapter is free"). */
  freeUsersOnly?: boolean;
}

export const PREP_TOUR_STEPS: PrepTourStep[] = [
  { target: "subjects", tour: "start", title: "step1Title", body: "step1Body", advanceOnClick: true },
  { target: "freeChapter", tour: "start", title: "step2Title", body: "step2Body", advanceOnClick: true, freeUsersOnly: true },
  { target: "firstTopic", tour: "start", title: "step3Title", body: "step3Body", advanceOnClick: true, required: true },
  { target: "studyPath", tour: "topic", title: "studyPathTitle", body: "studyPathBody", advanceOnClick: true, required: true },
  { target: "video", tour: "topic", title: "videoTitle", body: "videoBody", advanceOnClick: false },
  { target: "contentTabs", tour: "topic", title: "contentTabsTitle", body: "contentTabsBody", advanceOnClick: true },
  { target: "startTest", tour: "topic", title: "startTestTitle", body: "startTestBody", advanceOnClick: false },
  { target: "nextTopic", tour: "topic", title: "nextTopicTitle", body: "nextTopicBody", advanceOnClick: false },
  { target: "paper", tour: "topic", title: "paperTitle", body: "paperBody", advanceOnClick: false },
  { target: "index", tour: "topic", title: "indexTitle", body: "indexBody", advanceOnClick: false },
  { target: "pageSwitch", tour: "topic", title: "pageSwitchTitle", body: "pageSwitchBody", advanceOnClick: false },
];
