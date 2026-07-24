// src/lib/analytics/events/course_engagement.ts

export type CourseEngagementEventName =
  | "Section Switched"
  | "Area Switched"
  | "Topic Viewed"
  | "Content Details Viewed"
  | "Notes Downloaded"
  | "Video Started"
  | "Video Seeked"
  | "Video Playback Summary"
  | "PYQ Expanded"
  | "App Download Initiated"
  | "Topic Status Changed";

export interface CourseEngagementEventPayloads {
  "Section Switched": {
    from_section_id?: string;
    from_section_name: string;
    to_section_id?: string;
    to_section_name: string;
  };
  "App Download Initiated": {
    widget_location?: string;
    widget_type: string;
  };

  "Area Switched": {
    parent_section_id: string;
    parent_section_name: string;
    from_area_name: string;
    to_area_name: string;
  };

  "Topic Viewed": {
    entry_point?: string;
    section_id?: string;
    section_name: string;
    chapter_id?: string;
    chapter_name: string;
    topic_id?: string;
    topic_name: string;
    parent_topic_id?: string;
    parent_topic_name?: string;
  };

  "Content Details Viewed": {
    chapter_id?: string;
    chapter_name: string;
    topic_id?: string;
    topic_name: string;
    content_detail_type: string;
    content_id?: string;
  };

  "Notes Downloaded": {
    content_id?: string;
    chapter_id?: string;
    chapter_name: string;
    topic_id?: string;
    topic_name: string;
  };

  "Video Started": {
    content_id?: string;
    section_id?: string;
    section_name?: string;
    chapter_id?: string;
    chapter_name: string;
    topic_id?: string;
    topic_name: string;
    video_duration_seconds?: number;
  };

  "Video Seeked": {
    content_id: string;
    chapter_id: string;
    chapter_name: string;
    topic_id: string;
    topic_name: string;
    seek_method: string;
    from_timestamp_seconds: number;
    to_timestamp_seconds: number;
    timeline_concept_id?: string;
    timeline_concept_name?: string;
  };

  "Video Playback Summary": {
    content_id: string;
    section_id: string;
    section_name: string;
    chapter_id: string;
    chapter_name: string;
    topic_id: string;
    topic_name: string;
    total_watch_time_seconds: number;
    session_duration_seconds: number;
    percent_coverage: number;
    did_complete: boolean;
    did_watch: boolean;
    number_of_seeks: number;
    end_reason: string;
  };

  "PYQ Expanded": {
    question_id: string;
    chapter_id: string;
    chapter_name: string;
    topic_id: string;
    topic_name: string;
    question_position: number;
  };

  "Topic Status Changed": {
    topic_id?: string;
    topic_name: string;
    new_status: string;
    change_source?: string;
  };
}
