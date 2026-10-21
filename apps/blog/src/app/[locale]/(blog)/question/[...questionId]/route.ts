import { backendServerHeaders } from "@/lib/api/backend-headers";
import { ALLOWED_EXAMS } from "@/lib/exams";
import { canonicalChapterPath } from "@/lib/seo/exam-index";
import { loadExamIndex } from "@/lib/seo/load-exam-index";
import { chapterPageUrl, examSlugFromQuestion, parseQuestionId } from "@/lib/seo/question-redirect";
import { loadScope } from "@/lib/question-bank/scope";
import { pageOfIndex } from "@/lib/question-bank/pagination";
import { isHindiPage } from "@/lib/question-bank/hindi-page";

// Individual question pages were replaced by the shared chapter pages, which
// render every question with an `id="q-<id>"` anchor. Each old
// /question/<slug>-<id> URL (en and /hi) now 301s straight to the canonical
// chapter page (incl. /page/N) that shows it — one hop, no chain through the
// old slug redirect.
// Catch-all because old slugs could contain "/" (fractions like "3/7"),
// which split them across path segments; the id is always at the very end.

const RETRY_AFTER_SECONDS = "300";

function notFoundResponse(locale: string) {
  const home = locale === "hi" ? "/hi" : "/";
  return new Response(
    `<!doctype html><html lang="${locale === "hi" ? "hi" : "en"}"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Question not found | Clear Cutoff</title></head><body><h1>Question not found</h1><p><a href="${home}">Go to Clear Cutoff</a></p></body></html>`,
    { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

function unavailableResponse() {
  return new Response("Temporarily unavailable, please retry.", {
    status: 503,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Retry-After": RETRY_AFTER_SECONDS, "Cache-Control": "no-store" },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string; questionId: string[] }> },
) {
  const { locale, questionId: segments } = await params;
  const id = parseQuestionId(segments[segments.length - 1] ?? "");
  if (!id) return notFoundResponse(locale);

  const base = (process.env.BACKEND_URL || "").replace(/\/$/, "");
  let questions: Array<{ id?: number; stage_id_b?: string; exam_instance_id_b?: string; chapter?: { slug?: string } | null }>;
  try {
    const res = await fetch(`${base}/blog/get-questions?id=${id}&limit_q=2`, {
      headers: backendServerHeaders(),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return unavailableResponse();
    const json = await res.json();
    if (!Array.isArray(json?.data)) return unavailableResponse();
    questions = json.data;
  } catch {
    return unavailableResponse();
  }

  const question = questions.find((q) => q.id === Number(id));
  const exam = question ? examSlugFromQuestion(question) : null;
  const chapter = question?.chapter?.slug;
  if (!question || !exam || !ALLOWED_EXAMS.includes(exam) || !chapter) return notFoundResponse(locale);

  let path;
  try {
    path = canonicalChapterPath(await loadExamIndex(exam), chapter);
  } catch {
    return unavailableResponse();
  }
  if (!path) return notFoundResponse(locale);

  // Chapter pages show 50 questions per page: send the visitor to the page
  // that holds this question, using the same data and order the chapter page
  // renders. A question that doesn't render there (no translation) falls back
  // to page 1. If the chapter can't be loaded, don't guess: a wrong 301 would
  // be cached.
  const loaded = await loadScope({ kind: "chapter", exam, chapter });
  if (!loaded.ok) return unavailableResponse();
  const index = loaded.cards.findIndex((c) => c.id === Number(id));
  const page = index >= 0 ? pageOfIndex(index) : 1;

  // The canonical URL of that page, in one 301: English, or the /hi chapter
  // page for an old /hi link when that page is a genuinely Hindi page (its
  // own canonical — lib/question-bank/hindi-page). Otherwise /hi shows the
  // English page's content and canonicalizes to it, so /hi links land there.
  const toHindi = locale === "hi" && isHindiPage(loaded.cards, page);
  const location = chapterPageUrl({
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin,
    locale: toHindi ? "hi" : "en",
    exam,
    path,
    chapter,
    search: new URL(request.url).search,
    questionId: id,
    page,
  });

  // An hour, not a day: the page number can change if questions are added
  // or removed earlier in the chapter.
  return new Response(null, {
    status: 301,
    headers: { Location: location, "Cache-Control": "public, max-age=3600" },
  });
}
