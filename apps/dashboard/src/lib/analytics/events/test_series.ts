// src/lib/analytics/events/test_series.ts

export type TestSeriesEventName =
  | 'Test List Filtered'
  | 'Test Card Clicked'
  | 'Test Details Viewed'
  | 'Test Started'
  | 'Question Viewed'
  | 'Question Status Changed'
  | 'Question Answered'
  | 'Test Question Navigated'
  | 'Test Submitted'
  | 'Performance Report Viewed'
  | 'Performance Report Tab Viewed'
  | 'Performance Report Shared'
  | 'Report Question Expanded'
  | 'Test Retake Initiated';

export interface TestSeriesEventPayloads {
  'Test List Filtered': {
    filter_type: string;
  };

  'Test Card Clicked': {
    test_id: string;
    test_name: string;
    test_status: string;
  };

  'Test Details Viewed': {
    test_id: string;
    test_name: string;
    source: string;
    test_type: string;
    test_status: string;
    attempt_number: number;
    is_retake: boolean;
  };

  'Test Started': {
    test_id?: string;
    source_topic_id?: string;
    source_topic_name?: string;
    section_id?: string;
    section_name?: string;
    test_session_id: string;
  };

  'Question Viewed': {
    test_id: string;
    test_type: string;
    test_session_id: string;
    question_id: string;
    question_position: number;
  };

  'Question Status Changed': {
    test_id: string;
    test_session_id: string;
    question_id: string;
    new_status: string;
  };

  'Question Answered': {
    is_correct: boolean;
  };

  'Test Question Navigated': {
    test_id: string;
    test_type: string;
    test_session_id: string;
    navigation_method: string;
    from_question_position: number;
    to_question_position: number;
    question_state_on_departure: string;
  };

  'Test Submitted': {
    test_id: string;
    test_type: string;
    test_session_id: string;
    attempt_number: number;
    correct_count: number;
    incorrect_count: number;
    unattempted_count: number;
    score: number;
    percent_score: number;
    submission_reason: string;
    time_taken_seconds: number;
  };

  'Performance Report Viewed': {
    test_id: string;
    test_type: string;
    attempt_number: number;
    score: number;
    entry_point: string;
  };

  'Performance Report Tab Viewed': {
    test_id: string;
    attempt_number: number;
    tab_name: string;
  };

  'Performance Report Shared': {
    test_id: string;
    attempt_number: number;
    score: number;
    share_method: string;
  };

  'Report Question Expanded': {
    test_id: string;
    question_id: string;
    attempt_number: number;
    answer_status: string;
  };

  'Test Retake Initiated': {
    test_id: string;
    test_name: string;
    test_type: string;
    restarting_from_attempt: number;
    previous_score: number;
    source: string;
  };
}
