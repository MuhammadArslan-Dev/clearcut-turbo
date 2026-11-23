import { backendServerHeaders } from "@/lib/api/backend-headers";
import { ALLOWED_EXAMS } from "@/lib/exams";
import type { ExamIndex } from "@/lib/seo/exam-index";
import { loadExamIndex } from "@/lib/seo/load-exam-index";
import { chapterPageUrl, examSlugFromQuestion, parseQuestionId } from "@/lib/seo/question-redirect";
import { chapterFallback, locateQuestion, parentPathFor, type ChapterTarget } from "@/lib/seo/question-target";
import { fetchQuestionIndex } from "@/lib/sitemap/question-index";

// Old /question/<slug>-<id> URLs (en and /hi). Questions live on the chapter
// pages (approved structure, 2026-10-19), so every old URL answers ONE 301 to
// the canonical chapter page — incl. /page/N and `#q-<id>` — that renders it.
// Catch-all because old slugs could contain "/" (fractions like "3/7"); the
// id is always at the very end.
//
// Status rules (phase 125):
// - 301 to the chapter page, found in the cached question + exam indexes: no
//   backend call per redirect (Google crawls these old URLs heavily).
// - Not in the index -> one cached backend lookup of the id. A question no
//   chapter page renders (chapter without a slug, chapter not in navigation,
//   no translation) 301s to the nearest existing page: subject, level, exam.
// - 404 only when the backend answers that the id does not exist.
// - Never 503: indexes fall back to their last good copy, and if nothing at
//   all can be looked up, a temporary 302 (no-store) to the nearest hub keeps
//   the visitor moving and tells Google to come back to this URL.

const PERMANENT = { status: 301, cacheControl: "public, max-age=3600" };

function notFoundResponse(locale: string) {
  const home = locale === "hi" ? "/hi" : "/";
  return new Response(
    `<!doctype html><html lang="${locale === "hi" ? "hi" : "en"}"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Question not found | Clear Cutoff</title></head><body><h1>Question not found</h1><p><a href="${home}">Go to Clear Cutoff</a></p></body></html>`,
    { status: 404, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=600" } },
  );
}

function redirect(location: string, status: number, cacheControl: string) {
  return new Response(null, { status, headers: { Location: location, "Cache-Control": cacheControl } });
}

type BackendQuestion = {
  id?: number;
  stage_id_b?: string;
  exam_instance_id_b?: string;
  section_id_b?: string;
  chapter?: { slug?: string | null } | null;
  translations?: unknown[];
};

type Lookup = { kind: "found"; question: BackendQuestion } | { kind: "missing" } | { kind: "error" };

/** The backend's own row for one id (cached an hour). */
async function lookupQuestion(id: number): Promise<Lookup> {
  const base = (process.env.BACKEND_URL || "").replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/blog/get-questions?id=${id}&limit_q=1`, {
      headers: backendServerHeaders(),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return { kind: "error" };
    const json = await res.json();
    if (!Array.isArray(json?.data)) return { kind: "error" };
    const question = (json.data as BackendQuestion[]).find((q) => q.id === id);
    return question ? { kind: "found", question } : { kind: "missing" };
  } catch {
    return { kind: "error" };
  }
}

/** Every allowed exam's exam index (null where it can't be loaded at all). */
async function examIndexes(): Promise<Map<string, ExamIndex | null>> {
  const loaded = await Promise.all(ALLOWED_EXAMS.map((exam) => loadExamIndex(exam).catch(() => null)));
  return new Map(ALLOWED_EXAMS.map((exam, i) => [exam, loaded[i]]));
}

/** The chapter page for `id` from the cached indexes alone. */
async function fromIndexes(id: number, indexes: Map<string, ExamIndex | null>): Promise<ChapterTarget | null> {
  for (const exam of ALLOWED_EXAMS) {
    const examIndex = indexes.get(exam);
    if (!examIndex) continue;
    const questionIndex = await fetchQuestionIndex(exam).catch(() => null);
    const hit = questionIndex && locateQuestion(id, examIndex, questionIndex);
    if (hit) return hit;
  }
  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string; questionId: string[] }> },
) {
  const { locale, questionId: segments } = await params;
  const idParam = parseQuestionId(segments[segments.length - 1] ?? "");
  if (!idParam) return notFoundResponse(locale);
  const id = Number(idParam);

  const url = new URL(request.url);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || url.origin).replace(/\/+$/, "");
  const search = url.search && url.search !== "?" ? url.search : "";
  const hub = (path: string) =>
    `${siteUrl}${locale === "hi" ? "/hi" : ""}${path || (locale === "hi" ? "" : "/")}${search}`;

  const indexes = await examIndexes();
  const hit = await fromIndexes(id, indexes);
  if (hit) {
    // The /hi chapter page only when that page is a genuinely Hindi page (its
    // own canonical — lib/question-bank/hindi-page); otherwise /hi shows the
    // English page's content and canonicalizes to it, so /hi links land there.
    const location = chapterPageUrl({
      siteUrl,
      locale: locale === "hi" && hit.hindi ? "hi" : "en",
      exam: hit.exam,
      path: hit.path,
      chapter: hit.chapter,
      search,
      questionId: idParam,
      page: hit.page,
    });
    return redirect(location, PERMANENT.status, PERMANENT.cacheControl);
  }

  const lookup = await lookupQuestion(id);
  if (lookup.kind === "missing") return notFoundResponse(locale);
  if (lookup.kind === "error") {
    // Nothing to go on right now: send the visitor somewhere real, temporarily.
    return redirect(hub(""), 302, "no-store");
  }

  const { question } = lookup;
  const exam = examSlugFromQuestion(question);
  if (!exam || !ALLOWED_EXAMS.includes(exam)) return notFoundResponse(locale);
  if (Array.isArray(question.translations) && question.translations.length === 0) return notFoundResponse(locale);

  const examIndex = indexes.get(exam);
  if (!examIndex) return redirect(hub(`/${exam}`), 302, "no-store");

  // Known chapter the index doesn't list the question in (e.g. added since the
  // index was cached): the chapter's first page; its toolbar moves `#q-<id>`.
  const chapter = question.chapter?.slug ?? null;
  const path = chapterFallback(examIndex, chapter);
  if (path && chapter) {
    const location = chapterPageUrl({ siteUrl, locale: "en", exam, path, chapter, search, questionId: idParam });
    return redirect(location, PERMANENT.status, PERMANENT.cacheControl);
  }

  // No chapter page shows it: the nearest listing that exists. Exam and level
  // hubs have their own Hindi version; subject pages decide per page, so
  // English (its /hi copy canonicalizes there when it isn't Hindi).
  const parent = parentPathFor(examIndex, question);
  const location = parent.hub ? hub(parent.path) : `${siteUrl}${parent.path}${search}`;
  return redirect(location, PERMANENT.status, PERMANENT.cacheControl);
}
