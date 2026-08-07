export interface VideoConcept {
  name: string;
  time: string; // e.g. "00:00"
  description: string;
}

export interface ContentItem {
  id: number;
  topic_content_id: number;
  language: string;
  video_link: string;
  video_title: string;
  video_description: string | null;
  video_thumbnail: string | null;
  video_time: string; // e.g. "0:58:48"
  video_concepts: VideoConcept[];
}

export interface VideoContent {
  id: number;
  b_content_id: string;
  b_topic_id: string;
  topic_id: number;
  is_published: number;
  type: "video";
  content: ContentItem[];
}

export interface NoteItem {
  id: number;
  topic_content_id: number;
  language: string;
  title: string;
  note_content: string;
  link: string;
  thumbnail: string | null;
}

export interface NoteContent {
  id: number;
  b_content_id: string;
  b_topic_id: string;
  topic_id: number;
  is_published: number;
  type: "note";
  content: NoteItem[];
}

export type DataItem = VideoContent | NoteContent;
