import { ExamEnrollmentWithExam } from "@/lib/dashboard/learning";
import { ResumeStatePayload } from "@/types/courseresume";
import { DataItem } from "./topic-content-type";

export interface LocalizedText {
  name: string;
  group?: string;
  detail?: string;
}

export interface Paper {
  id: number;
  name: string; // JSON string coming from backend
}

export interface Exam {
  id: number;
  name: string;
}

export interface Stage {
  id: number;
  uuid: string;
  parent_id: number;
  name: string;
  group: string;
  translation: string; // JSON string
}

export interface MainData {
  id: number;
  uuid: string;
  exam: Exam;
  stage: Stage;
}

export interface SectionArea {
  id: number;
  name: string;
}

export interface Section {
  id: number;
  uuid: string;
  section_id?: string;
  name: string;
  areas: { areas: SectionArea[] } | null;
  type: string;
  translation: any;
}

export interface Content {
  id: number;
  uuid?: string;
  content_id?: string;
  entity_id?: string | number;
  primary_language?: string;
  content_link?: string;
  content_title?: string;
  video_time?: string;
  content_flag?: string;
  is_multilingual?: boolean | null;
}

export interface TopicTrend {
  id: number;
  uuid: string;
  topic_trend_id?: string | null;
  topic_id: number;
  exam_id: number;
  stage_id: number;
  trend_last_exams?: string | null;
  topic_importance?: string | null; // "High" | "Medium" | "Low"
  weightage_marks_min?: number | null;
  weightage_marks_max?: number | null;
  estimated_weightage_percent?: number | null;
  avg_questions_per_instance?: number | null;
  total_exams?: number | null;
  last_appeared_year?: string | null;
  pyq_distribution?: number[] | null; // list of years
  total_questions_in_pyq?: number | null;
  source?: string | null; // e.g. "Based on CTET PYQs (2018-2024)"
}

export interface Topic {
  id: number;
  uuid: string;
  topic_id: string;
  name: string;
  topic_order: number;
  primary_language: string;
  difficulty_level: string;
  data: DataItem[];
  content: Content[];
  children: Topic[];
  trends: TopicTrend | null;
  has_mini_test?: boolean;
}

export interface Chapter {
  id: number;
  uuid: string;
  chapter_id: string;
  name: string;
  chapter_order: number;
  primary_language: string;
  locked: boolean;
  topics: Topic[];
  area?: string;
}

export interface ExamSyllabusData {
  course: ExamEnrollmentWithExam;
  paper: Paper[];
  mainData: MainData;
  sections: Record<number, Section[]>;
  paper_id: number;
  section_id: number;
}

export interface GetExamSyllabusResponse {
  status: "success" | "error";
  message: string;
  data: ExamSyllabusData;
}
export interface GetChapterResponse {
  status: "success" | "error";
  message: string;
  data: {
    chapters: Chapter[];
    state: ResumeStatePayload;
  };
}
