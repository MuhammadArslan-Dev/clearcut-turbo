// src/lib/analytics/events/exam.ts

export type ExamEventName = "Exam Switched" | "New Exam Added";

export interface ExamEventPayloads {
  "Exam Switched": {
    from_exam_id: string | number;
    from_exam_name: string;
    to_exam_id: string | number;
    to_exam_name: string;
    source: string;
  };

  "New Exam Added": {
    exam_name: string;
    source: string;
    selected_paper_ids: Array<string | number>;
    selected_paper_names: string[];
    selected_navigation_ids: Array<string | number>;
    selected_navigation_names: string[];
  };
}
