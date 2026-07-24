// ===============================
// TRANSLATION
// ===============================

export interface Option {
  text: string | null;
  image: string | null;
}

export interface Translation {
  id: number;
  locale: string;

  text: string | null;
  image: string | null;

  options: Option[];

  correct_option: string | null;
  explanation: string | null;
}


// ===============================
// QUESTION MASTER
// ===============================

export interface QuestionMaster {
  id: number;

  exam_instance_id: number | null;
  stage_id: number | null;
  section_id: number | null;

  translations: Translation[];
}


// ===============================
// ATTEMPT QUESTION
// ===============================

export interface AttemptQuestion {
  id: number;

  question_id: number;

  unit_type: string | null;
  unit_id: number | null;

  order: number;

  time_limit: number | null;

  user_option: string | null;
  is_correct: number | string | null;

  visited: boolean;
  marked_for_review: boolean;
  time_spent: number | null;

  question: QuestionMaster;
}


// ===============================
// SECTION MASTER
// ===============================

export interface SectionMaster {
  id: number;
  uuid: string;

  section_id: number;

  name: string;
  areas: string | null;

  type: string | null;

  total_questions: number;
  fl_total_questions: number;

  total_marks: number;
}


// ===============================
// ATTEMPT SECTION
// ===============================

export interface AttemptSection {
  id: number;

  section_id: number;
  order: number;

  section: SectionMaster;

  questions: AttemptQuestion[];
}


// ===============================
// EXAM
// ===============================

export interface Exam {
  id: number;
  uuid: string;

  type?: string;

  status: string;

  started_at: string | null;
  submitted_at: string | null;
  total_duration_seconds: string | null;
  time_used_seconds: string | null;
  last_activity_at: string | null;

  result: any;
  course: any;

  sections: AttemptSection[];
}
