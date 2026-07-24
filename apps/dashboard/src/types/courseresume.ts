export interface ResumeStatePayload {
  id: number;
  course_id: string;
  paper_id: string | null;
  section_id: string | null;
  chapter_id: string | null;
  topic_id: number | null;
  last_accessed_at: string | null;
  // Enriched name fields (returned by getResumeState)
  topic_name: string | null;
  topic_number: number | null;
  chapter_name: string | null;
  chapter_number: number | null;
  section_name: string | null;
}

export interface ResumeStateResponse {
  message: string;
  data: {
    id: number;
    user_id: number;
    course_id: string;
    paper_id: string | null;
    section_id: string | null;
    chapter_id: string | null;
    topic_id: number | null;
    last_accessed_at: string | null;
    created_at: string;
    updated_at: string;
  };
}
