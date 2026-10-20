import { ALLOWED_EXAMS } from "@/lib/exams";
import { searchIndexBody } from "@/lib/question-bank/search-index";
import { parseScopeQuery, type QuestionScope } from "@/lib/question-bank/scope";
import { findLevel, type ExamIndex } from "@/lib/seo/exam-index";
import { tryLoadExamIndex } from "@/lib/seo/load-exam-index";

// The question-bank pages show 50 questions per page; their search box still
// searches every page. On the first meaningful query (or a #q-<id> link to a
// question on another page) the page fetches this compact index: plain
// question/option text, group label and page number per question — no
// explanations, no markup, no ids beyond the anchor id. Bodies are memoised
// per server instance (lib/question-bank/search-index.ts).

const CACHE_SECONDS = 3600;

function known(index: ExamIndex, scope: QuestionScope): boolean {
  const subjects = index.levels.flatMap((l) => l.subjects);
  if (scope.kind === "chapter") return subjects.some((s) => s.chapters.includes(scope.chapter));
  if (scope.kind === "subject") {
    // A section must be one this slug actually shows on some level.
    return subjects.some((s) => s.slug === scope.subject && (!scope.section || s.sectionId === scope.section));
  }
  return Boolean(findLevel(index, scope.level));
}

const json = (body: unknown, status: number, cache: string) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": cache },
  });

export async function GET(request: Request) {
  const scope = parseScopeQuery(new URL(request.url).searchParams);
  if (!scope || !ALLOWED_EXAMS.includes(scope.exam)) return json({ error: "not found" }, 404, "public, max-age=300");

  // Only scopes that exist in the exam's navigation reach the backend, so this
  // public route can't be used to fan arbitrary slugs out to the API.
  const index = await tryLoadExamIndex(scope.exam);
  if (!index) return json({ error: "unavailable" }, 503, "no-store");
  if (!known(index, scope)) return json({ error: "not found" }, 404, "public, max-age=300");

  const body = await searchIndexBody(scope);
  if (body === null) return json({ error: "unavailable" }, 503, "no-store");

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`,
    },
  });
}
