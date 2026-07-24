
// new 

export interface QuestionContent {
  question: string;
  question_image: string | null;
}

export interface QuestionOption {
  option: number;
  text: string;
  image: string | null;
}

export interface QuestionAnswer {
  correct_option: string; // keeping string because your API returns "1"
  official_answer_key: string | null;
  explanation: string;
}

export interface QuestionAiMetadata {
  time_to_solve: number | null;
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
}

export interface QuestionTranslation {
  id: number;
  question_new_id: number;
  locale: string;
  content: QuestionContent;
  options: QuestionOption[];
  answer: QuestionAnswer;
  ai_metadata: QuestionAiMetadata;
}



export interface ExamContextA {
  exam_instance_id: string;
  stage_id: string;
  section_id: string;
  chapter_id: string;
  topic_id: string;
}

export interface ExamContextB {
  exam_instance_id: string;
  stage_id: string;
  section_id: string;
  chapter_id: string;
  topic_id: string;
}
export interface QuestionNew {
  id: number;
  question_id: string;
  question_number: string;
  exam_context_a: ExamContextA;
  exam_context_b: ExamContextB;
  translations: QuestionTranslation[];
}


export interface QApiResponse<T> {
  status: "success" | "error";
  message: string;
  data: T;
}
