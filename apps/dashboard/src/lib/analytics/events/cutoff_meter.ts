// src/lib/analytics/events/cutoff_meter.ts
// Cutoff Meter lifecycle events (phase 108). Spec: docs/analytics/cutoff-meter-tracking.md

export type CutoffMeterEventName =
  | "Cutoff Meter Viewed"
  | "Cutoff Meter Clicked"
  | "Cutoff Meter Info Viewed"
  | "Cutoff Meter Unlocked"
  | "Cutoff Meter Score Updated"
  | "Cutoff Meter Zone Changed"
  | "Cutoff Meter Action Clicked";

export type CutoffMeterSurface = "learn_card" | "target_page" | "info_sheet";
export type CutoffMeterZoneName = "needs_work" | "almost_there" | "clear_zone" | "safe_zone";

/** Sent with every Cutoff Meter event; every value is read from the backend response. */
export interface CutoffMeterBaseProps {
  surface: CutoffMeterSurface;
  /** The course's group_code. */
  course_id?: string;
  exam_name?: string;
  /** Level / paper the student picked (from the enrolment). */
  level?: string;
  paper?: string;
  meter_status: "locked" | "unlocked";
  zone?: CutoffMeterZoneName;
  colour?: "red" | "yellow" | "green";
  /** The score the student sees (display_meter). */
  score?: number;
  max_marks: number;
  cutoff_value: number;
  /** Marks to the cutoff; negative = above it. */
  gap?: number;
  /** score / max_marks × 100. */
  percent?: number;
  confidence?: "low" | "medium" | "high";
  is_early_estimate: boolean;
  is_cooling: boolean;
  tests_count?: number;
  counted_answers: number;
  model_version: string;
}

export interface CutoffMeterEventPayloads {
  "Cutoff Meter Viewed": CutoffMeterBaseProps & { unlock_questions_needed?: number };
  "Cutoff Meter Clicked": CutoffMeterBaseProps & { click_target: "info_sheet" };
  "Cutoff Meter Info Viewed": CutoffMeterBaseProps & { opened_from: "learn_card" | "target_page" };
  "Cutoff Meter Unlocked": CutoffMeterBaseProps & {
    previous_status: "locked";
    current_status: "unlocked";
    trigger: "test_submit" | "refresh";
    trigger_test_type?: string;
    trigger_test_id?: string;
  };
  "Cutoff Meter Score Updated": CutoffMeterBaseProps & {
    previous_score: number;
    current_score: number;
    score_change: number;
    previous_zone?: CutoffMeterZoneName;
    current_zone?: CutoffMeterZoneName;
    trigger: "test_submit" | "refresh";
    trigger_test_type?: string;
    trigger_test_id?: string;
  };
  "Cutoff Meter Zone Changed": CutoffMeterBaseProps & {
    previous_zone: CutoffMeterZoneName;
    current_zone: CutoffMeterZoneName;
    previous_colour?: "red" | "yellow" | "green";
    current_colour?: "red" | "yellow" | "green";
    direction: "up" | "down";
    trigger: "test_submit" | "refresh";
    trigger_test_type?: string;
    trigger_test_id?: string;
  };
  "Cutoff Meter Action Clicked": CutoffMeterBaseProps & {
    action_id: string;
    action_type: string;
    rank: number;
    plan_position?: number;
    section_id?: number | null;
    topic_id?: number | null;
    test_id?: number | null;
    expected_gain?: number | null;
    est_time_min: number;
    is_locked_plan: boolean;
  };
}
