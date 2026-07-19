// src/lib/api/posts.ts
// Blog-side fetch helpers for exam-based blog posts (Phase 2 of the exam-blogs
// feature). Reads the clearcut-cms Payload `posts` collection over REST. The
// blog renders `content_html` (server-rendered from Lexical) with
// html-react-parser, so no Lexical dependency is needed here.
import 'server-only';
import { createFetchClient } from "@clearcut/api/fetch-client";

import type { Post, PayloadListResponse } from '@/types/blog/post';

const PAYLOAD_URL = process.env.NEXT_PUBLIC_PAYLOAD_URL;

if (!PAYLOAD_URL) {
  throw new Error('NEXT_PUBLIC_PAYLOAD_URL is not defined');
}

const client = createFetchClient({ baseUrl: PAYLOAD_URL, defaultRevalidate: 60 });

interface GetPostBySlugOptions {
  // Payload locale to request (e.g. 'en', 'hi'). Drives both localized fields
  // and the localized `content_html` output.
  locale?: string;
  // When set, also require the post's exam relationship to match this exam_id,
  // so a slug served under the wrong /{exam}/ URL resolves to null.
  examId?: string;
}

/**
 * Fetch a single published post by slug (optionally scoped to an exam).
 * Returns null when no matching post is found.
 */
export async function getPostBySlug(
  slug: string,
  { locale, examId }: GetPostBySlugOptions = {},
): Promise<Post | null> {
  const params = new URLSearchParams();
  params.set('where[slug][equals]', slug);
  if (examId) {
    // `exam` is a relationship; filter on the related exam's external key.
    params.set('where[exam.exam_id][equals]', examId);
  }
  if (locale) params.set('locale', locale);
  // depth=1 populates the `exam`/`heroImage` relationships one level deep.
  params.set('depth', '1');
  params.set('limit', '1');

  try {
    const data = await client.fetchJson<PayloadListResponse<Post>>(`/api/posts?${params.toString()}`);
    return data.docs?.[0] ?? null;
  } catch (error) {
    console.error(`Network or parsing error fetching post "${slug}":`, error);
    throw error;
  }
}

/**
 * Fetch published posts for an exam (for listings / static params).
 */
export async function getPostsByExam(
  examId: string,
  { locale, limit = 50 }: { locale?: string; limit?: number } = {},
): Promise<Post[]> {
  const params = new URLSearchParams();
  params.set('where[exam.exam_id][equals]', examId);
  if (locale) params.set('locale', locale);
  params.set('depth', '1');
  params.set('limit', String(limit));
  params.set('sort', '-publishedDate');

  try {
    const data = await client.fetchJson<PayloadListResponse<Post>>(`/api/posts?${params.toString()}`);
    return data.docs ?? [];
  } catch (error) {
    console.error(`Network or parsing error fetching posts for exam "${examId}":`, error);
    throw error;
  }
}
