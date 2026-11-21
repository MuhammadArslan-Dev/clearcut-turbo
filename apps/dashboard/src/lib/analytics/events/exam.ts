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
    // Phase 122 (`dash_all_setup_first_202611`): where the sheet was opened from, whether this was the learner's first
    // level, seconds since the enrolment was created, and the variant for a learner in the experiment.
    setup_source?: string;
    first_setup?: boolean;
    time_since_enrolment_s?: number;
    experiment_flag?: string;
    experiment_variant?: string;
  };
}
