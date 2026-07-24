// src/lib/analytics/events/video.ts

export type SeekMethod =
  | 'progress_bar'
  | 'timeline_scrub'
  | 'concept_click';

export type VideoEndReason =
  | 'video_ended'
  | 'navigated_away'
  | 'error';

// --- Event names ---

export type VideoEventName =
  | 'Video Started'
  | 'Video Seeked'
  | 'Video Playback Summary';

// --- Payloads ---

export interface VideoEventPayloads {
  'Video Started': {
    content_id?: string;
    chapter_id?: string;
    chapter_name: string;
    topic_id?: string;
    topic_name: string;
    video_duration_seconds?: number;
  };

  'Video Seeked': {
    seek_method: SeekMethod;
    from_timestamp_seconds: number;
    to_timestamp_seconds: number;
    content_id: string;
  };

  'Video Playback Summary': {
    total_watch_time_seconds: number;
    session_duration_seconds: number;
    percent_coverage: number;
    did_complete: boolean;
    did_watch: boolean;
    number_of_seeks: number;
    end_reason: VideoEndReason;
  };
}
