# Phase 81 — Chapter / Sectional / Full Exam tests: motion (start, Nibbu note, submit animation, animated result)

**Tickets:** (new, from user)
**Repos:** CM (`apps/dashboard`, `packages/motion` only if a gap shows up)
**Branch:** local only on `feature/practice-test-flag` working tree — **not committed, not pushed, not deployed** (user instruction)
**Created / start date:** 2026-11-06
**Status:** In Review — implemented and tested locally (mocked API); awaiting the user's own test/approval; not pushed

> Reference: phase 79 (library) and phase 80 (Daily + Practice Test). Same look and motion for the test-series exam engine (`/exam/[examId]`), which serves Chapter, Sectional and Full-length tests.

---

## 1. Problem / objective
Chapter, Sectional and Full tests still use the old experience (plain countdown modal, no mascot, no "checking" animation, plain report cards). Give them the four approved stages — start, answer note, submit, result — without touching timer rules, question flow, scoring or API calls.

## 2. How the three tests are wired today (read from code, 2026-11-06)
- One engine for all three: `components/features/exam/pages/mainContent.tsx` at `/exam/[examId]` (`exam.type` = chapter | sectional | full).
- **Start:** list page -> `Pre-TestConfirmationModal` -> `CountDownModal` (5 s ring; the attempt is created in the background by `createChapterTest/createSectionsTest/createFullLengthTest`; then `flow.push(/exam/<uuid>)`).
- **Answering:** pick an option (local draft) -> "Save and Next" saves via `submitAnswer`. Timer is server driven (`useExamTimer`: heartbeat, auto-submit on expiry).
- **Submit:** top-bar "End Test" -> `ExamEndConfirmationSheet` -> `POST /v2/exam/end-exam/<id>`; expiry -> `handleAutoExpire` in mainContent. Both end in `useExamFinishNavigation` (back to the test list with the report open).
- **Result:** `ExamReportSheet` (opened on the list page): Summary tab = 4 plain cards + pie chart, Analysis tab = per-question review.

## 3. Decisions (by precedent from phase 80; flag them to the user at hand-over)
| Question | Decision |
|---|---|
| Real-time right/wrong feedback | **No** (same reasoning as Daily): the exam payload does not carry the correct option and these tests are graded/timed. Nibbu shows a neutral "Answer noted / Saved" note instead. |
| Start animation | Replaces the visuals of the existing `CountDownModal` with the library `TestIntro` (large). Same moment, same background creation of the attempt, redirect only when BOTH the intro finished and the attempt exists. Exam time budget unchanged (the old countdown was 5 s; intro is ~4.5 s, ~5.4 s for the "full" visual). |
| Submit animation | `SubmitOverlay` over the exam page; driven by a tiny shared store so the End-Test sheet and the timer expiry both use it; navigation to the report happens when the animation ends. |
| Result | Library `TestResult` (actions off) at the top of the report's Summary tab replaces the 4 plain cards; pie chart and Analysis tab stay. |
| Mapping | chapter -> `topic` visual, sectional + full -> `full` visual; badge text overridden ("Chapter test" / "Sectional test" / "Full test"). |

## 4. Plan
- [x] i18n strings en/hi/mr (`modals.json` -> `examMotion`).
- [x] Shared submit store + overlay wired into `ExamEndConfirmationSheet` and `handleAutoExpire` (+ double-submit guard).
- [x] Nibbu `NibNote` under the options in `mainContent.tsx`.
- [x] `CountDownModal` -> `TestIntro`.
- [x] `ExamReportSheet` summary -> `TestResult`.
- [x] Playwright E2E (mocked API) for chapter, sectional, full: start, answer, navigation, timer expiry, manual submit, failure paths, result; 320–1920 widths, Hindi.
- [x] Docs (DEVELOPMENT_RULES, README tracker).

## 5. Progress
- 2026-11-06: code read, plan written.
- 2026-11-06: implemented. Files: `exam/store/useExamSubmitStore.ts` (new), `exam/pages/mainContent.tsx` (SubmitOverlay, NibNote, expiry via the store, keyboard guard), `exam/components/modals/ExamEndConfirmationSheet.tsx` (uses the store; navigation moved to the animation's onFinish), `test-series/components/modals/CountDownModal.tsx` (TestStartIntro instead of the old ring modal), `exam-report/ExamReportSheet.tsx` (TestResult hero replaces the 4 cards), `messages/{en,hi,mr}/modals.json` (`examMotion`), library: `TestResult` got opt-in `noCutoff` (+ `NEUTRAL_OUTCOME_COPY`).
- Found by the report test: the library result invents a cutoff (60%) when none is given -> "Cutoff 5", "Cutoff cleared!", "Just 0 marks away" on tests that have no cutoff. Fixed with `noCutoff` (hides chip/tick, neutral wording: "Great score!" / "Good effort!" / "Every attempt builds your score"). Daily Test still shows the old cutoff wording (not touched, see risks).

## 6. Risks
- Daily Test result still shows the cutoff wording (it never passed `cutoff`); `noCutoff` can be applied there too if the user wants.
- On short phones the Nibbu note sits just above the fixed footer; long questions push it below the fold (same as Daily).
- The server timer starts when the attempt is created, i.e. during the intro (as with the old 5 s countdown). Not changed.
- `ExamReportSheet` is also opened from attempt history: the result animation plays there too.

## 7. Dependencies
None.

## 8. Tests and verification
Playwright against the local dev server, API mocked at the network layer (no backend, no DB):
- Start: CountDownModal -> `TestIntro` for chapter (topic visual, "Chapter test · <scope>", 10 q / 10 min) and full (full visual, Hindi). The attempt is created in the background; with a 7 s create-exam the intro waits on "Go!" and the redirect to `/exam/<id>` happens right after the response; exactly one create request.
- Answering (chapter, 375x667): option tap shows the Nibbu note "Answer noted"; after Save and Next and coming back it says "Nice, keep going!"; `submitAnswer` payloads correct (`user_option` "2" for the 2nd option); resume of a half-done exam restores position (Hindi page, full).
- Submit, manual (chapter, 375x667): End sheet -> overlay "Chapter test submitted" with 3/5 progress while end-exam is in flight -> navigates to the test list; one end-exam request.
- Submit, timer expiry (sectional, 1280x800; heartbeat reports 0 remaining): overlay appears, end-exam called once, both saved answers kept, navigates to the list.
- Submit failure (full, Hindi, end-exam request aborted): overlay still plays and the learner is sent to the list like before (error logged); the 2 requests seen are the existing `apiFetch` network retry.
- Result (report sheet harness): chapter / sectional / full at 375, 768, 1280: animated ring, tinted stat cards, time, section-wise marks for sectional/full, no cutoff wording, no horizontal overflow. Tiers checked: >=60% green, near amber ("Good effort!"), low ("Every attempt builds your score").
- `@clearcut/motion` typecheck clean; dashboard `tsc` no errors in the changed files; `check:colors` no new colours; eslint on the new/changed code: no new errors (remaining ones are pre-existing non-null assertions in those files).
- Full flow from the real test list (2026-11-06, mocked API only: course, test list, create-exam, get-exam, heartbeat, answer, end-exam): list -> card -> Pre-Test modal -> Start -> intro -> `/exam/<id>` -> answer every question (Nibbu note) -> Save and End Test -> Submit -> submit overlay -> back on the list -> Performance Report opens with the animated result. Passed for chapter (390x844), sectional (1280x800, 2 sections) and full-length (768x1024, 3 sections with section-wise marks); one create-exam, one end-exam, every answer saved. A second test started right after the first in the same browser (persisted exam store left over) also ran clean.
- NOT done: real phones/tablets (not possible from here), reduced-motion toggle, real backend (create/end-exam/heartbeat contracts were mocked from the code, not from live responses), full 150-question exam performance, Marathi UI pass.
