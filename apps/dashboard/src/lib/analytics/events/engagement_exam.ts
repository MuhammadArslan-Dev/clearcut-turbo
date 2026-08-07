// src/lib/analytics/events/engagement_exam.ts

export type EngagementExamEventName =
  | 'Content Started'
  | 'Exam Edit Started'
  | 'Exam Edited';

export interface EngagementExamEventPayloads {
  'Content Started': {
    source: string;
    exam_name: string;
  };

  'Exam Edit Started': {
    exam_name: string;
  };

  'Exam Edited': {
    exam_detail_edited: string[];
    number_of_details_changed: number;
  };
}
