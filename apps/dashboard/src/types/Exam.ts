export type MarkingSchema = {
  correct: number;
  wrong: number;
  unattempted: number;
};

export type ExamMetadata = {
  exam_date: string;
  exam_mode: string;
  duration: string;
  cutoff: string;
};

export type ExamTranslationContent = {
  state: string;
};

export type ExamTranslation = {
  [languageCode: string]: ExamTranslationContent;
};

export type Exam = {
  id: number ; // 1
  uuid?: string; // "ab83beee-3236-4523-bd13-7dd3d4ef2034"
  exam_id?: string; // "teaching_HTET"

  name?: string; // "Haryana Teacher Eligibility Test"
  short_name?: string; // "HTET"
  slug?: string | null;

  state?: string; // "Haryana"
  conducting_body?: string; // "Board of School Education, Haryana (BSEH)"

  exam_type?: string; // "Eligiblity"
  evaluation_type?: string; // "MCQ"
  exam_frequency?: string; // "Biannual"
  upcoming_exam_date?: string; // "2026"

  price?: string; // "299.00"
  combo_price?: string; // "599.00"
  rating?: string; // "4.9/5"

  logo_url?: string; // svg url

  // if you parse the JSON string use MarkingSchema; if not, keep it as string
  marking_schema?: MarkingSchema | string;

  ai_evaluation_supported?: boolean; // false
  status?: string; // "Active"
  metadata?: ExamMetadata | string | null;

  created_at?: string; // ISO dates as strings
  updated_at?: string;
  deleted_at?: string | null;

  translation?: ExamTranslation;
};

export type MyCourse = {
  id: number;
  uuid: string;
  exam_id: string;
  user_id: string | number;
  stage_id: string | number;
  group_code: string | number;
  status: string | number;
  attempt_year: string | number;
  enrollment_type: string | number;
  enrolled_at: string | number;
  created_at: string | number;
  exam: Exam;
};

export type ExamEnrollment = {
  id: number;
  uuid: string;

  user_id: number;
  exam_id: number | null;
  stage_id: number | null;

  selections: Record<string, any> | null;

  enrolled_at: string | null;
  status:
    | "trial"
    | "trial_end"
    | "active"
    | "completed"
    | "dropped"
    | "expired"
    | "cleared";

  purchase_id: string | null;
  attempt_year: number | null;

  study_mode: "online" | "offline" | "hybrid";
  enrollment_type: "single_stage" | "full_exam" | "trial";

  trial_converted_at: string | null;
  metadata: Record<string, any> | null;

  group_code: string | null;
  language: string | null;
  price: number | null;
  edit_count: number;

  last_accessed_at: string | null;
  active_level: number | null;
study_guide_seen: boolean;

  created_at: string;
  updated_at: string;
};
