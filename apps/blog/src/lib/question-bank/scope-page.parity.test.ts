import { describe, expect, it } from "vitest";
import { ALLOWED_EXAMS } from "@/lib/exams";
import { loadExamIndex } from "@/lib/seo/load-exam-index";
import { canonicalSubjects } from "@/lib/seo/exam-index";
import { fetchQuestionIndex } from "@/lib/sitemap/question-index";
import { loadYears } from "./load";
import { pageCount } from "./pagination";
import { fromFullScope, isHindiScopePage, pagedScope, type ScopePage } from "./scope-page";
import { loadScope, type QuestionScope } from "./scope";

// Live parity check (not part of CI): every page built from the question index
// + /blog/get-questions-by-ids must equal the page built from the full scope.
//   PARITY_BACKEND=http://clearcutoff-main-backend.test/api npx vitest run scope-page.parity
const BACKEND = process.env.PARITY_BACKEND;
const MAX_PAGES = Number(process.env.PARITY_MAX_PAGES ?? 3);

function comparable(p: ScopePage) {
  return {
    ok: p.ok,
    total: p.total,
    hindi: isHindiScopePage(p),
    cards: p.cards,
    chapters: p.chapters,
    // What the quiz structured data reads from each raw question.
    raw: p.raw.map((q) => ({
      id: q.id,
      chapter: q.chapter?.slug ?? null,
      translations: (q.translations ?? []).map((t) => [t.locale, t.question, t.option_1_text, t.option_2_text, t.option_3_text, t.option_4_text, t.correct_option, t.explanation]),
    })),
  };
}

describe.runIf(BACKEND)("scope pages: index + by-ids == full scope", () => {
  it("matches on every scope", { timeout: 3_600_000 }, async () => {
    process.env.BACKEND_URL = BACKEND;
    const scopes: QuestionScope[] = [];
    for (const exam of ALLOWED_EXAMS) {
      const [index, questions, years] = await Promise.all([loadExamIndex(exam), fetchQuestionIndex(exam), loadYears(exam)]);
      for (const chapter of Object.keys(questions.chapters)) scopes.push({ kind: "chapter", exam, chapter });
      for (const s of canonicalSubjects(index)) scopes.push({ kind: "subject", exam, subject: s.slug, section: s.sectionId });
      for (const level of index.levels) {
        for (const y of years ?? []) if (y.instance_id) scopes.push({ kind: "year", exam, level: level.slug, year: y.instance_id.toLowerCase().replace(/_/g, "-") });
      }
    }
    const mismatches: string[] = [];
    let pages = 0;
    for (const scope of scopes) {
      const full = await loadScope(scope);
      const last = Math.min(pageCount(full.cards.length), MAX_PAGES);
      for (let page = 1; page <= last; page++) {
        pages++;
        const paged = await pagedScope(scope, page);
        const expected = JSON.stringify(comparable(fromFullScope(full, page, scope)));
        if (!paged) mismatches.push(`${JSON.stringify(scope)} p${page}: paged path unavailable`);
        else if (JSON.stringify(comparable(paged)) !== expected) {
          const a = comparable(paged);
          const b = comparable(fromFullScope(full, page, scope));
          const diff = (Object.keys(a) as (keyof typeof a)[]).filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
          mismatches.push(`${JSON.stringify(scope)} p${page}: ${diff.join(",")} paged=${JSON.stringify(diff.map((k) => a[k])).slice(0, 400)} full=${JSON.stringify(diff.map((k) => b[k])).slice(0, 400)}`);
        }
      }
    }
    console.log(`scopes=${scopes.length} pages=${pages} mismatches=${mismatches.length}`);
    for (const m of mismatches) console.log(`MISMATCH ${m}`);
    expect(mismatches).toEqual([]);
  });
});
