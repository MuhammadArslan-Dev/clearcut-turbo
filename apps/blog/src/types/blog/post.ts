// Types for exam-based blog posts served by the clearcut-cms Payload API.
// Mirrors the `posts` collection (src/collections/Posts.ts) fields the blog reads.

// The exam relationship, populated (depth >= 1) on the post. Mirrors the
// `exams` collection; `exam_id` is the stable external key used in blog URLs.
export interface PostExam {
  id: string;
  exam_id: string;
  name?: string;
  short_name?: string;
  logo_url?: string;
}

export interface PostHeroImage {
  id: string;
  url?: string;
  alt?: string;
  filename?: string;
}

// A Payload `media` doc as populated inside an attachment (depth >= 1).
// mimeType/filesize drive the file-type icon and formatted size in the UI.
export interface PostAttachmentFile {
  id: string;
  url?: string;
  filename?: string;
  mimeType?: string;
  filesize?: number;
  alt?: string;
}

// One row of the Posts `attachments` array field — a downloadable resource
// (PDF, Excel, CSV, etc.) shown in the article's "Resources" section.
export interface PostAttachment {
  id: string;
  label?: string;
  file?: PostAttachmentFile | string | null;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  // Server-rendered HTML of the Lexical `content` field (virtual `content_html`).
  // Contains <h2>/<h3> headings the blog uses to build the Contents TOC.
  content_html?: string;
  exam?: PostExam | string | null;
  heroImage?: PostHeroImage | string | null;
  author?: { id: string; name?: string } | string | null;
  attachments?: PostAttachment[];
  publishedDate?: string;
  _status?: 'draft' | 'published';
  updatedAt?: string;
  createdAt?: string;
}

// A single entry in an article's table of contents, extracted from the
// H2/H3 headings in `content_html`. `id` matches the heading's injected id.
export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

// Shape of Payload's REST list response (`/api/posts?...`).
export interface PayloadListResponse<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}
