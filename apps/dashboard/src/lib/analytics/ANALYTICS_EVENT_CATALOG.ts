// src/lib/analytics/all-events.examples.ts
// ONE FILE — ALL EVENTS — NO EVENT MISSED

import { trackEvent } from "./browser";

/* =========================
   AUTH / ACQUISITION
========================= */

trackEvent("Authentication Initiated", {
  element_location: "hero",
  element_type: "button",
});

trackEvent("Authentication Options Viewed", {
  options_available: ["phone", "google"],
});

trackEvent("Authentication Method Selected", {
  auth_method: "phone_otp",
});

trackEvent("Authentication Form Interacted", {
  form_field: "input_phone_number",
});

trackEvent("Verification Sent", {
  verification_method: "Number",
  verification_mode: "SMS",
});

trackEvent("Verification Resent", {
  verification_method: "Number",
  resend_count: 2,
});

trackEvent("Authentication Outcome", {
  outcome: "signup_successful",
  auth_method: "phone_otp",
});

trackEvent("Signed Up", {
  signup_method: "phone_otp",
});

/* =========================
   ACTIVATION / ONBOARDING
========================= */

trackEvent("Onboarding Started", {
  entry_step_number: 1,
  entry_step_name: "language_selection",
});

trackEvent("Onboarding Step Completed", {
  step_number: 1,
  step_name: "language_selection",
  app_language_choice: "en",
});

trackEvent("Onboarding Step Reversed", {
  from_step_number: 2,
  to_step_number: 1,
});

trackEvent("Onboarding Completed", {
  entry_step_name: "exam_selection",
  up_onboarding_status: "string",
  up_chosen_exam_id: "string",
  up_preferred_app_language: "string",
});

trackEvent("Exam Details Selection Started", {
  step_number: 1,
  step_name: "paper_selection",
  content_language_choice: "en",
  paper_choice: "Paper 1",
  subject_combination_choice: "English & Hindi",
});

trackEvent("Exam Details Selection Completed", {});

/* =========================
   NAVIGATION
========================= */

trackEvent("Learning Path Switched", {
  from_path: "course",
  to_path: "tests",
});

trackEvent("Navigation Reversed", {
  from_page_context: "topic_detail",
  to_page_context: "course_dashboard",
  trigger_context: "video_completed",
});

trackEvent("Index Viewed", {
  source_page: "course_dashboard",
});

trackEvent("Index Navigated", {
  selected_content: "chapter",
  selected_chapter_id: "C_001",
  selected_chapter_name: "Growth",
});

trackEvent("Primary Nav Clicked", {
  tab_name: "Exams",
});

/* =========================
   COURSE ENGAGEMENT
========================= */

trackEvent("App Download Initiated", {
  widget_location: "course_page",
  widget_type: "floating_widget",
});

trackEvent("Section Switched", {
  from_section_id: "S_001",
  from_section_name: "English",
  to_section_id: "S_002",
  to_section_name: "Maths",
});

trackEvent("Area Switched", {
  parent_section_id: "S_002",
  parent_section_name: "Science",
  from_area_name: "Physics",
  to_area_name: "Chemistry",
});

trackEvent("Topic Viewed", {
  entry_point: "scroll",
  section_id: "S_007",
  section_name: "CDP",
  chapter_id: "C_0031",
  chapter_name: "Growth",
  topic_id: "T_00110",
  topic_name: "Development",
});

trackEvent("Content Details Viewed", {
  chapter_id: "C_0031",
  chapter_name: "Growth",
  topic_id: "T_00110",
  topic_name: "Development",
  content_detail_type: "Notes",
  content_id: "CN_00001",
});

trackEvent("Notes Downloaded", {
  content_id: "CN_00001",
  chapter_id: "C_0031",
  chapter_name: "Growth",
  topic_id: "T_00110",
  topic_name: "Development",
});

trackEvent("Video Started", {
  content_id: "CN_00002",
  section_id: "S_007",
  section_name: "CDP",
  chapter_id: "C_0031",
  chapter_name: "Growth",
  topic_id: "T_00110",
  topic_name: "Development",
  video_duration_seconds: 3041,
});

trackEvent("Video Seeked", {
  content_id: "CN_00002",
  chapter_id: "C_0031",
  chapter_name: "Growth",
  topic_id: "T_00110",
  topic_name: "Development",
  seek_method: "progress_bar",
  from_timestamp_seconds: 900,
  to_timestamp_seconds: 1500,
});

trackEvent("Video Playback Summary", {
  content_id: "CN_00002",
  section_id: "S_007",
  section_name: "CDP",
  chapter_id: "C_0031",
  chapter_name: "Growth",
  topic_id: "T_00110",
  topic_name: "Development",
  total_watch_time_seconds: 150,
  session_duration_seconds: 950,
  percent_coverage: 65,
  did_complete: true,
  did_watch: true,
  number_of_seeks: 4,
  end_reason: "video_ended",
});

trackEvent("PYQ Expanded", {
  question_id: "HTET_101",
  chapter_id: "C_0031",
  chapter_name: "Growth",
  topic_id: "T_00110",
  topic_name: "Development",
  question_position: 2,
});

trackEvent("Topic Status Changed", {
  topic_id: "T_00110",
  topic_name: "Development",
  new_status: "Completed",
  change_source: "manual_user_action",
});

/* =========================
   ENGAGEMENT – EXAM
========================= */

trackEvent("Content Started", {
  source: "learn_dashboard",
  exam_name: "CTET",
});

trackEvent("Exam Edit Started", {
  exam_name: "REET_2025",
});

trackEvent("Exam Edited", {
  exam_detail_edited: ["content_language", "level_details"],
  number_of_details_changed: 2,
});

/* =========================
   TEST SERIES
========================= */

trackEvent("Test List Filtered", {
  filter_type: "sectional",
});

trackEvent("Test Card Clicked", {
  test_id: "ST_1",
  test_name: "Sectional Test 1",
  test_status: "mandatory",
});

trackEvent("Test Details Viewed", {
  test_id: "ST_1",
  test_name: "Sectional Test 1",
  source: "test_dashboard",
  test_type: "sectional",
  test_status: "mandatory",
  attempt_number: 1,
  is_retake: false,
});

trackEvent("Test Started", {
  test_session_id: "ts_xyz_12345",
});

trackEvent("Question Viewed", {
  test_id: "ST_1",
  test_type: "sectional",
  test_session_id: "ts_xyz_12345",
  question_id: "Q_10",
  question_position: 5,
});

trackEvent("Question Status Changed", {
  test_id: "ST_1",
  test_session_id: "ts_xyz_12345",
  question_id: "Q_10",
  new_status: "marked_for_review",
});

trackEvent("Question Answered", {
  is_correct: true,
});

trackEvent("Test Question Navigated", {
  test_id: "ST_1",
  test_type: "sectional",
  test_session_id: "ts_xyz_12345",
  navigation_method: "save_and_next",
  from_question_position: 5,
  to_question_position: 6,
  question_state_on_departure: "answered",
});

trackEvent("Test Submitted", {
  test_id: "ST_1",
  test_type: "sectional",
  test_session_id: "ts_xyz_12345",
  attempt_number: 1,
  correct_count: 85,
  incorrect_count: 5,
  unattempted_count: 10,
  score: 85,
  percent_score: 85,
  submission_reason: "user_confirmed",
  time_taken_seconds: 3600,
});

trackEvent("Performance Report Viewed", {
  test_id: "ST_1",
  test_type: "sectional",
  attempt_number: 1,
  score: 85,
  entry_point: "test_submission",
});

trackEvent("Performance Report Tab Viewed", {
  test_id: "ST_1",
  attempt_number: 1,
  tab_name: "Overview",
});

trackEvent("Performance Report Shared", {
  test_id: "ST_1",
  attempt_number: 1,
  score: 85,
  share_method: "whatsapp",
});

trackEvent("Report Question Expanded", {
  test_id: "ST_1",
  question_id: "Q_10",
  attempt_number: 1,
  answer_status: "correct",
});

trackEvent("Test Retake Initiated", {
  test_id: "ST_1",
  test_name: "Sectional Test 1",
  test_type: "sectional",
  restarting_from_attempt: 1,
  previous_score: 85,
  source: "performance_tab",
});

/* =========================
   MONETIZATION
========================= */

trackEvent("Payment Paywall Rendered", {
  property_source: "onboarding_completed",
  is_user_premium: false,
});

trackEvent("Purchase Intent Initiated", {
  entry_point: "learn_dashboard",
  product_id: "CTET_2024",
});

trackEvent("Payment Initiated", {
  exam_name: "CTET",
  payment_flow: "new_attempt",
  final_price: 999,
  payment_attempt: 1,
});

trackEvent("Payment Outcome", {
  outcome: "payment_successful",
  final_price: 999,
  payment_session_id: "pay_xyz_12345",
});

trackEvent("Subscription Status Updated", {
  new_status: "active",
  plan_name: "Single Exam Plan",
  exam_id: "CTET",
  exam_name: "CTET",
});

/* =========================
   ACCOUNT
========================= */

trackEvent("Profile Option Clicked", {
  option_selected: "personal_details",
});

trackEvent("Profile Edit Started", {
  section_edited: "personal_details",
});

trackEvent("Profile Updated", {
  updated_fields: ["name", "gender"],
});

trackEvent("Language Setting Changed", {
  language_type: "app_language",
  from_language: "en",
  to_language: "hi",
});

/* =========================
   SYSTEM
========================= */

trackEvent("Error Occurred", {
  error_type: "api_error",
  error_message: "Could not load manifest",
  page_context: "topic_detail",
});
