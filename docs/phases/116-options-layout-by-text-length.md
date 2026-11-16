# Phase 116 — MCQ options layout follows the option text length

**Tickets:** (new, from user)
**Repos:** CM (apps/dashboard, apps/blog, packages/ui)
**Branch:** `feat/options-layout-by-text-length` — not pushed
**Created / start date:** 2026-11-16
**Status:** In Review — merged to main 2026-11-16; seen in the browser on blog question cards, dashboard daily test and mini-test (en/hi/mr); 7 screens not reached (see section 8)

---

## 1. Problem / objective
Every screen laid the four MCQ options out in a fixed grid (`grid md:grid-cols-2` / `lg:` / `xl:`), whatever the text. A long option next to a short one leaves a ragged half-empty row. Wanted: all options short -> 2 columns (A B / C D); any option long -> one full-width column for the whole question; adapts per question and per screen size without touching selection, colours or the cards themselves.

## 2. Scope
- **In:** one shared rule + container, applied to every place options are rendered: dashboard exam/sectional (`exam/pages/mainContent.tsx`), mini-test (`MiniTest.tsx`), practice test (`PracticeTestPage.tsx`), daily test attempt, performance report (`ExamReportSheet.tsx`), daily-test review row, previous-paper modal, exam-instance modal, question tester, weekly test; blog question-bank cards (`question-interaction.tsx`), blog section card and assessment block.
- **Out:** the option card itself (`QOption`, `OptionCard`), colours, selection/reveal logic, the question *navigator* (`QuestionViewPanel` also uses `QOption` but is a list of question numbers, not options), dev-only motion preview pages, stray `* copy.tsx` files.

## 3. Implementation plan
- [x] `packages/ui/src/options-layout.ts` — pure rule `optionsLayout(options)` -> `single | compact | split`
- [x] `packages/ui/src/options-grid.tsx` — `<OptionsGrid options breakpoint className>` (forwardRef, server/client safe); exports added to `packages/ui/package.json`
- [x] Replace the 13 hard-coded grids (script, every anchor matched exactly once)
- [x] Unit tests `apps/dashboard/src/lib/options-layout.test.ts`
- [ ] Browser check on every screen (desktop + 390px, en/hi/mr, long and short questions)
- [ ] DEVELOPMENT_RULES §3 catalog + §11 changelog

## 4. Progress / completed changes
- 2026-11-16 — rule: a line break or more than 28 visible characters in ANY option -> `single` (1 column at every width). Every option <= 8 characters and none has an image -> `compact` (2 columns at every width, also on a phone). Anything else -> `split` = the screen's own previous behaviour (1 column, 2 from its breakpoint: md for report/modals/mini-test/blog assessment, lg for exam/daily/blog cards, xl for practice test). Markdown, HTML tags and LaTeX delimiters are not counted.

## 5. Decision log
| Date | Question | Answer |
|---|---|---|
| 2026-11-16 | What is "short" / "long"? | No number given. Chosen: long > 28 visible characters (about half a column at the md breakpoint), compact <= 8. Both are constants in `options-layout.ts`; change them there. |
| 2026-11-16 | Short options on a phone? | "2 columns when all short" read literally: only the very short (<= 8 chars) go 2-up on a phone; medium ones keep the previous 1 column below the screen's breakpoint. |

## 6. Blockers / risks
- Compact (2 columns on a 390px phone) is new on phones; Devanagari text is wider per character, so an 8-character Hindi option may wrap inside its card (wrapping is fine, nothing overflows).
- A question whose options are all very short now shows 2 columns on screens that were 1 column below md/lg (mini-test, daily test, practice test, exam).
- Tailwind classes live in `packages/ui` and rely on each app's `@source` for `packages/ui` (blog and dashboard already have it).

## 7. Dependencies / packages added
None (two new exports in `@clearcut/ui`).

## 8. Tests and verification
- [x] `vitest` — 9 new tests for the rule (boundaries, markup stripping, line breaks, images, empty, order independence); dashboard suite 53/53
- [x] `tsc` — no errors in the touched files (dashboard and blog backlogs unchanged); `check:colors` no new colours
- [x] Browser (Playwright, sonnet low, local): blog /ctet/paper-1/year/ctet-2023, /subject/mathematics, /hi/... — single, compact and split all seen, columns match the rule at 1440 and 390, select + "Show Explanation" work, container top/height unchanged on select. Dashboard daily test attempt (10 questions: 5 single, 5 split) and mini-test (layout changes per question; at 390: compact, compact, single, split, split); /hi and /mr daily attempt render and match.
- [ ] **Not verified (not reached in the browser):** practice test (backend 404 locally), exam/sectional attempt (403, test user is on the free plan), performance report sheet and daily-test review rows (result page locked behind the paywall), PreviousModal, downloadable-content ExamInstanceModal, question tester, weekly test; the xl (1280px) practice-test breakpoint; compact layout on any dashboard screen at 1440; blog split breakpoint between widths and Hindi select/reveal. Same component and `tsc` clean, but not seen.
- [ ] Blog year page has a horizontal overflow from `<code>` elements in the explanation (not the options grid); not checked whether it predates this change.

## 9. Next steps
Browser verification, then DEVELOPMENT_RULES, then commit/merge on the user's go-ahead.
