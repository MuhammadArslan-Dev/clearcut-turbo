# Phase 109 — Target "Where your marks come from", Today's-plan navigation, desktop meter sheet

Date: 2026-11-13. Branch `fix/target-breakdown-nav-sheet` (frontend only; backend data already correct).

## 1. Client reports
1. Target → "Where your marks come from": after a Hindi / CDP test, unrelated subjects also show marks.
2. Target → Today's plan: tapping a topic opens Section 1 → Chapter 1 → Topic 1 instead of the chosen one.
3. Cutoff Meter details sheet needs a lot of scrolling on desktop (mobile is fine).

## 2. Root causes
### 2.1 Breakdown
`CutoffMeterService::getMastery` = `(correct + prior_correct) / (attempted + prior_attempts)` with the documented prior (1.5 / 3 = 50 %). A subject with **zero** answers therefore gets 50 % of its marks, and one with 4 answers 1/4 → 35.7 %, shown as plain numbers. Real data (user 16404, last `meter_history` row): Environmental Studies attempted 0 → "15/30"; Mathematics attempted 4 (1 correct) → "10.71/30"; Hindi/CDP answers feed only their own `section_id` (verified in `user_question_answers`, no cross-subject rows). So nothing is mixed between subjects — the unjustified values are the starting estimate, displayed as if earned.
Fix (display; the documented meter model/total is NOT changed): each subject row now shows its own evidence — "{correct} of {attempted} correct · {accuracy}%" from that subject's counted answers — and a subject with no answers shows "Not tested yet", a muted grey bar and "~15/30" (tilde = estimate), with one footnote explaining the starting estimate and that only answers in a subject change that subject. Values come from the API's per-section `correct`, `attempted`, `accuracy`, `section_marks`; nothing hard-coded (the % in the note is the API's own accuracy for an untested subject).
Open decision for the client: should the meter TOTAL also stop counting untested subjects at 50 %? That is a model change (spec prior), not done here.

### 2.2 Today's-plan navigation
`actionHref` sent `?chapter=&topic=` only. (a) No `section` — the preparation page opened the resume section, where that chapter does not exist; (b) `Sidebar` consumed the URL chapter/topic on the FIRST syllabus to arrive (the resume section's) and marked it applied, so the real section's chapters loaded with no target → chapter 1 / topic 1; (c) the page's own URL sync rewrites section/chapter/topic from the store, so reading the live URL later saw the resume position; (d) `selectSection` only searched the open paper, so a section of another paper left the paper unchanged.
Fix: `actionHref` adds `section` (the NBA row's `section_id`); `Sidebar` snapshots the URL it was opened with at first render and applies chapter/topic only when the loaded syllabus is that section and contains the chapter (or the topic's chapter); `selectSection` switches to the paper that owns the section; `flattenTopics` exported for the lookup. Course/level/paper ids stay the course's `group_code` route + the section's own paper.

### 2.3 Desktop sheet
`CutoffMeterInfoModal` was a single 460 px column (meter, 4 zones, 3 steps, keep card ≈ 1 000 px tall). Now `md+`: 880 px wide, two columns (meter + zones 2×2 | how it works + keep attempting); phone layout unchanged (single column, 4 zones in a row).

## 3. Files
`TargetPage.tsx` (MarksBreakdown, actionHref), `Sidebar.tsx`, `preparationPage.tsx`, `usePreparationDataStore.ts`, `CutoffMeterInfoModal.tsx`, `messages/{en,hi,mr}.json` (`target.breakdownCorrect|NotTested|Note`).

## 4. Verification
Real local app + backend, Playwright (Sonnet subagent + own traces), user 16404, course 6ae2df67cd86b (HTET).
- **Fix 1 PASS**: every subject row equals GET /v2/cutoff-meter data.sections (e.g. CDP 9 of 40 · 24% → 7/30; Mathematics 1 of 4 · 36% → 11/30; Environmental Studies not tested → grey bar, "~15/30" + footnote). en / hi / mr at 390 px, no overflow. Not verified: all-subjects-tested case (footnote hidden), amber/green bar colours (every tested subject is red here).
- **Fix 3 PASS**: sheet 880 px two columns at 1280x720, 1440x900, 1024x768 (scrollHeight = clientHeight, no scroll; before ≈ 1 000 px column); 768x1024 two columns, no scroll; 390x844 bottom sheet unchanged (single column, 4 zones in a row). Not verified: hi/mr on desktop, dark mode, swipe-to-dismiss.
- **Fix 2 PASS after 4 rounds** (real execution found 3 more causes than the first fix): (a) the opening URL was read at render time, which on a client-side navigation still holds the previous page's query → now read inside effects; (b) the saved section was re-hydrated over the selected one (React StrictMode re-runs the mount effects, and the old code recorded "applied" before the store was really on that section) → "applied" is set only once the store is on the URL's section; (c) the resume save/patch of the PREVIOUS visit's selection wrote the old position into the syllabus cache → blocked until the page is on the URL's section. Result: 5 consecutive client-side clicks Geography ↔ Schools of Psychology each land exactly on 51/134/1267 and 1/38/131 (URL stable 6 s, resume state equal), F5 keeps it, mobile 390 and /hi pass, console errors 0. Not verified: Marathi, browser Back path, same-section different-topic client push, a real tap back to Target in the mobile topic view.
