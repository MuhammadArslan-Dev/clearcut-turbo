// ===============================
// QUESTION TESTER TYPES
// Mirrors backend QuestionTranslationResource + QuestionTesterController@show
// ===============================

export interface TesterOption {
  option: number;
  text: string | null;
  image: string | null;
}

export interface TesterTranslation {
  id: number;
  question_new_id: number;
  locale: string;

  content: {
    question: string | null;
    question_image: string | null;
  };

  options: TesterOption[];

  answer: {
    correct_option: string | null;
    official_answer_key: string | null;
    explanation: string | null;
  };

  ai_metadata: {
    time_to_solve: string | null;
    difficulty_level: string | null;
    question_type: string | null;
    chapter_name: string | null;
    topic_name: string | null;
    subtopic_name: string | null;
    cognitive_skill: string | null;
    is_pedagogy: boolean;
    is_not: boolean;
    question_tags: string | null;
    slug: string | null;
  };
}

export interface QuestionTesterData {
  id: number;
  question_id: string | null;
  question_number: string | null;

  mapping: {
    exam_instance_id: string | null;
    stage_id: string | null;
    label_id: string | null;
    section_id: string | null;
    chapter_id: string | null;
    topic_id: string | null;
    subtopic_id: string | null;
  };

  available_locales: string[];
  has_translations: boolean;
  translations: TesterTranslation[];

  neighbors: {
    prev_id: number | null;
    next_id: number | null;
  };
}

export interface QuestionTesterResponse {
  status: string;
  message: string;
  data: QuestionTesterData;
}
