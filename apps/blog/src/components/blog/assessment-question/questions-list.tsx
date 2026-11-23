// Question data types shared by the question-bank pages (lib/question-bank,
// components/question-bank) and the quiz schema. The old client-side question
// list that lived here linked every card to a /question/<slug>-<id> page; those
// URLs now 301 to the chapter pages, so it was removed (phase 125).

export interface Question {
  id: number;
  question_id: string;
  exam_instance_id_b: string;
  stage_id: string;
  section_id: string;
  chapter_id: string;
  topic_id: string;
  question_number: string;
  ai_slug: string;

  translations: Translation[];

  chapter: QuestionChapter;
  topic: Topic;
  /** The question's subject (backend: `e_sections`, called "section" there
   * and in its own URL segment — `/subject/[subject_id]` resolves to one of
   * these). Only present on responses from `getQuestions()` (the year page's
   * endpoint); omitted elsewhere, so always optional. */
  section?: QuestionSection | null;
}

export interface Translation {
  id: number;
  question_new_id: number;
  locale: string;
  ai_slug: string;

  question: string;
  question_image: string | null;

  option_1_text: string | null;
  option_1_image: string | null;

  option_2_text: string | null;
  option_2_image: string | null;

  option_3_text: string | null;
  option_3_image: string | null;

  option_4_text: string | null;
  option_4_image: string | null;

  correct_option: string;
  explanation: string;
  /** Why the other options are wrong (phase 100). Absent/NULL when the question has none. */
  incorrect_explanation?: string | null;
}

// The per-locale {"en":{"name":"..."},"hi":{"name":"..."}} shape chapters,
// topics, and sections all carry their translated name in — see
// @/utils/question-translation's getLocalizedEntityName. Chapters/topics
// expose it as `translations` (a real DB column, array-cast by Eloquent, so
// it arrives already parsed); sections have no such column and carry the
// same shape inside `description` instead (arrives as a raw JSON string —
// getLocalizedEntityName handles both).
export type LocalizedNameBlob = Record<string, { name?: string | null }>;

export interface Topic {
  id: number;
  slug: string;
  topic_id: string;
  name: string;
  translations?: LocalizedNameBlob | null;
  children: Topic[];
  trends: unknown | null;
}

export interface QuestionChapter {
  id: number;
  slug: string;
  chapter_id: string;
  name: string;
  translations?: LocalizedNameBlob | null;
}

export interface QuestionSection {
  id: number;
  slug: string;
  section_id: string;
  description?: string | null;
  name: string;
}
