/**
 * `data-tour` ids of the preparation page tours (the CC-79 "start here" tour
 * and the topic tour). Components render them with
 * `data-tour={PREP_TOUR.<key>}`; the steps live in prepTourSteps.ts.
 * `pnpm --filter dashboard check:tour` fails when an id has no step or no
 * component renders it.
 */
export const PREP_TOUR = {
  subjects: "prep-subjects",
  freeChapter: "prep-free-chapter",
  firstTopic: "prep-first-topic",
  startTest: "prep-start-test",
  nextTopic: "prep-next-topic",
  pageSwitch: "prep-page-switch",
} as const;

export type PrepTourTarget = keyof typeof PREP_TOUR;
