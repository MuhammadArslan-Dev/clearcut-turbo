# Phase 85 — Small UI fixes batch (dead taps, retry, labels)

**Tickets:** CC-175 · CC-177 · CC-176 · CC-178 · CC-90 (all assigned to Arslan, Rohit's queue 8 Nov 2026; Jira project `CC`)
**Repos:** CM (`apps/dashboard` only; `@clearcut/ui` is NOT changed)
**Branch:** `fix/ui-small-fixes-batch` — not created yet, not committed, not pushed
**Created / start date:** 2026-11-09
**Status:** Not Started — plan approved by the user 2026-11-09; two items are `Blocked – Decision` (CC-90 popup identity, CC-178 which card)

> One phase for five small, related frontend fixes (the user asked small tasks to be grouped). Each ticket keeps its own section below. Nothing here touches the backend. Do not edit the stale `* copy.tsx` files (`MiniTest copy.tsx`, `Content copy*.tsx`, `full-exam-selection copy*.tsx`).

---

## 1. Problem / objective
Students tap buttons that do nothing or move away, get dead-end error screens, or see labels that look like buttons. Common root pattern (DEVELOPMENT_RULES §3.1): `@clearcut/ui/button` has `disabled:pointer-events-none`, so a disabled button **swallows the tap with no feedback**. Shared fix pattern: keep the button enabled, style it `aria-disabled`, and show a hint on tap — copy the existing `buy-sigle-course-modal.tsx` `showPickHint` pattern (toasts are `react-toastify`).

## 2. Scope
- **In:** the five tickets below, at the call sites; en/hi/mr strings; Playwright check.
- **Out:** `packages/motion` (never re-time/redesign), `@clearcut/ui/button` and `StatusChip` themselves (used in ~15 places), backend, the slow daily-test endpoints (CC-149, phase 90), anything on the Learn dashboard (`MainButton` is shared with `MyCourseCard`).

## 3. Implementation plan

### CC-175 — Topic practice: 'Check My Answer' / 'Next Question' miss taps (Medium→High, queue 08)
File: `apps/dashboard/src/features/preparation/components/modal/MiniTest.tsx` (Footer 586–692, root `motion.div layout` 213–216, skeleton ~745); store `features/preparation/store/useMiniTestStore.ts` (`checkAnswer` is a silent no-op with no pick, l.87–97); option row `components/ui/cards/QuestionMaterial/Qoption/QOption.tsx` (**shared** by `PreviousModal`, `ExamInstanceModal`, exam + daily test pages).
Evidence: last week (1–8 Nov) 'Next Question' 396 dead taps / 61 sessions; layout shift 0.74–0.96.
Causes found: Check is `disabled={!hasSelected}` (swallowed tap; hint only on question 1 and hard-coded English); root `layout` animates size on every content change; footer is not a fixed-height bar (Previous appears from Q2, 200px wrappers, finish button differs); scroll area `min-h-30dvh/max-h-90dvh` + `justify-between` moves the footer when the explanation grows; skeleton shape differs from real content; option rows are clickable `Card`s with no button role or pressed state; buttons are `md` (36px, not 44px).
- [ ] Pinned footer, fixed height, three fixed slots (Previous / primary / hint — hint slot always rendered), `size="lg"` (44px), `shrink-0`.
- [ ] Remove `layout` from the root `motion.div`; reserve space for the explanation; skeleton matches the real content.
- [ ] Check stays enabled + `aria-disabled` look; tap with no pick → `toast.info(t("pickOption"))` (hi: "पहले एक विकल्प चुनें").
- [ ] Option rows as `<button>`/`as="button"` through an **opt-in** prop on `QOption` (default unchanged).
- [ ] Instant pressed state on these buttons only (`transition-none active:scale-[.98]`).
- [ ] i18n: reuse `modals.miniTest.buttons.{previous,next,result}` (`messages/{en,hi,mr}/modals.json` ~l.187–202); add `check, finish, pickOption, questionOf, correctWrong, loadFailed, tryAgain`.
- Must not break: `OptionMotion`, `QuestionSlide`, `AnswerFeedback` untouched; `AnimatePresence` keys unchanged; re-run the motion preview.
- Done when: layout shift on topic test < 0.1; dead taps on the two buttons drop 80%+ vs 1–8 Nov (**needs the user's Clarity check**).

### CC-177 — Daily test 'Failed to load test…' with no retry (High, queue 09)
File: `app/[locale]/(protected)/(exam)/daily-test-attempt/[courseId]/[testId]/[[...attempt]]/page.tsx` — start effect l.160–230 (`.catch` 223–229 maps 403→locked, everything else→`loadFailed`), error `<p>` l.516–522; API `lib/api/dailyTests.ts:163`; text `messages/{en,hi,mr}/dailyTests.json:84`. No timeout/AbortController; `fetchWithRetry` retries only network throws once; nothing reaches Sentry.
- [ ] Extract the start call into `loadAttempt()` with a request-id guard (stale hung response must not overwrite a newer one; must not double-POST — effect deps `historyLoading`, `completedAttemptId`, `retake`).
- [ ] One auto-retry after ~1 s, only for `isNetworkFailure(err)` or status ≥ 500; never 4xx (backend `start` is idempotent and resumes).
- [ ] Error block: `Button` "Try again" + `Link` from `@/i18n/navigation` to `/dashboard` (+ existing `attempt.backToHistory`). Keep it off the `submitFailed` branch.
- [ ] Sentry via `lib/sentry/sentry-logger.ts` (`logger.error`; tags `module:"daily-test-attempt"`; extras `testId`, `courseId`, status via `err.toContext()`; user id; `logger.breadcrumb` when `isNetworkFailure`).
- [ ] New keys `attempt.retry`, `attempt.goDashboard` in dailyTests en/hi/mr. Not `useSlowLoad` (plain POST, not a query).
- Likely deeper cause: slow daily-test endpoints → tracked in phase 90 (CC-149).

### CC-176 — Preparation page: 'View notes', save button, Video tab don't respond (Medium, queue 24)
- Notes: `features/preparation/components/RelatedContent/Content.tsx` `Notes` (183–510). "View notes" only appears **after** a full PDF download; the button is `disabled` while downloading (taps swallowed); `window.open(blobUrl)` is blocked by in-app browsers.
  - [ ] Use the existing `usePdfViewer()` (`features/downloadable-content/components/PdfViewerModal.tsx`; DEVELOPMENT_RULES §10: never hand-roll PDF opening): View shows immediately with a loader, separate Download button. Keep firing `Notes Downloaded`, `Topic Status Changed (notesTaken)`, `updateLearningProgress`.
- `features/preparation/components/MainVideo/ChapterDetailHeader.tsx` (45–160): chapter title and the "Video › Notes › Topic Test" row are static but look tappable.
  - [ ] Make them select/scroll to the matching tab (`useScrollToSection`) and the breadcrumb open the chapter index (`usePreparationModalStore.open("chapter-index")`), or drop the interactive styling. Keep `data-tour` ids (`pnpm check:tour` in CI).
- The save-and-continue button is **not on the preparation page**: it is `modals.editCourseModal.saveContinue` in `components/modals/course/edit-course-modal/edit-course-modal.tsx:635–655`, `disabled` until a subject path is complete.
  - [ ] Keep it enabled + `showPickHint` pattern.
- No floating "Unlock" overlay found (the paywall widget sits inside the sidebar). Candidates to confirm in Playwright: the 0.35 s pane slide-in and the `StartGuide` tour overlay. Report what is found.

### CC-178 — 'English' / 'हिंदी' labels look like buttons (Medium, queue 25)
- Notes-card language chip (`Content.tsx:355–361`) and the PDFCard "Language: …" line (`features/downloadable-content/components/cards/CourseContentCard.tsx:120–155`) are **labels**. Real toggles (`ExamInstanceModal`, `ExamReportSheet`, `PracticeTestPage`, `weekly-test-page`) already work — leave.
  - [ ] Restyle at the call site only (`variant="soft" tone="neutral"`, drop `bg-brand/7 text-brand`); use `courseLanguageToLocale`/i18n instead of hard-coded "English".
  - [ ] "Pages: 6" is hard-coded (`Content.tsx:369`): read the real page count from the notes API or remove the line.
- 🛑 Decision needed: see §5 (which card the ticket's screenshot shows).

### CC-90 — Onboarding: popup blocks taps, 'Continue' looks active (Medium, queue 07)
- **Finding:** the `.styles-module__popup` class belongs to the `agentation` dev toolbar (`components/thirdparties/DevAgentation.tsx`, rendered only when `NODE_ENV === "development"`), so it cannot exist in production. The Clarity recording is from 25 Sep. 🛑 see §5.
- Real, fixable part: Continue buttons are correctly `disabled` (`!data.language`; `!data.exam || isSubmitting`) but the disabled look is only `opacity-50` on a blue button, with a faded arrow (`ui/button/main-button.tsx` `AnimatedArrowIcon`), so it still reads as active; `disabled:pointer-events-none` eats the tap.
  - [ ] At the call sites (`features/onboarding/steps/LanguageStep.tsx:132–144`, `ExamStep.tsx:310–316`): grey token look when not ready, no shimmer, keep enabled + `aria-disabled`, hint on tap (`Onboarding` namespace, en/hi/mr; no `request.ts` change). `MainButton` change must be opt-in (used on Learn).
  - [ ] Do not break the phase 84 animation (`ENROLL_TIMEOUT_MS` 40 s, `fail()`).

## 4. Progress / completed changes
- 2026-11-09 — phase file written (docs only). Code exploration done read-only.
- 2026-11-09 — **CC-175 built** on branch `fix/ui-small-fixes-batch` (not pushed; **not yet checked in a browser**):
  - `features/preparation/components/modal/MiniTest.tsx`: root `motion.div` has no `layout` animation and a fixed height (`h-[85dvh] md:h-[min(85dvh,760px)]`); content area is `flex-1 min-h-0` with its own scroll; skeleton and `LoadFailed` sit in the same slot; Footer is a fixed `h-[88px]` bar with fixed slots (Previous | one 220px primary button | 20px hint line), all buttons `size="lg"` (44px) with instant pressed state (`transition-none active:scale-[.98]`); **Check My Answer is no longer `disabled`** — it is `aria-disabled` + faded, and tapping it with nothing picked shows an inline hint (`pickOption`) instead of doing nothing; hard-coded English in the footer replaced by i18n keys.
  - `components/ui/cards/QuestionMaterial/Qoption/QOption.tsx`: new opt-in `pressable` prop (touch-manipulation + `active:scale-[.985]`); default unchanged, only MiniTest passes it.
  - `messages/{en,hi,mr}/modals.json`: `miniTest.buttons.{check,finish,pickOption,selectToContinue}` appended (existing keys byte-identical, asserted).
  - **Not done on purpose:** skeleton was not redrawn (it now sits in the same fixed slot, so it can no longer move the footer); the other hard-coded English strings in `Content` / `LoadFailed` ("Questions x/y", "Couldn't load the test") were not in the ticket and are left alone.
- 2026-11-09 — **CC-177 built** (same branch, not pushed): `daily-test-attempt/.../page.tsx` — start call wrapped in `startWithRetry` (one retry after 1 s for `isNetworkFailure` or status ≥ 500, never 4xx) inside the existing effect, which now has a `cancelled` guard (stale/hung response cannot overwrite a newer state) and a `loadTick` dep so "Try again" re-runs it exactly once; load failures go to Sentry via `logger.error` (tags `module:"daily-test-attempt"`, extras `courseId`, `testId`, `retake`, `ApiError.toContext()`), network failures only as a breadcrumb; the error screen now shows a **Try again** button, a **Go to dashboard** link and **Back to history** (only for `loadFailed`, not `submitFailed`). `messages/{en,hi,mr}/dailyTests.json`: `attempt.retry`, `attempt.goDashboard` appended (existing keys asserted identical).
- 2026-11-09 — **Browser tests done for CC-175 and CC-177** (Chrome against the local dashboard on :3020 and the local Laragon backend, real data of local user 6252 — see §8).
- 2026-11-09 — **Finding (not fixed): no `ToastContainer` is mounted anywhere in the repo**, although `react-toastify` is installed and ~6 `toast.*` calls exist in the dashboard (e.g. the daily-test attempt page). Those toasts probably never appear. For that reason CC-175 uses an inline hint, not a toast. 🛑 see §5.

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-09 | 🛑 **CC-90 — which popup did QA/the Clarity recording show?** The class in the ticket is the dev-only `agentation` toolbar. Options: (a) ticket came from a dev/staging build → fix only the Continue look (recommended); (b) a real production popup exists → send the Clarity link/screenshot, I trace it; (c) also hide `DevAgentation` on staging. Implication: no popup change is made until answered. | open |
| 2026-11-09 | 🛑 **No `ToastContainer` anywhere — do the existing ~6 `toast.*` calls show anything?** Options: (a) leave as is, report only (default; this phase uses inline hints); (b) mount one `ToastContainer` in the locale layout (small, but it would make the existing toasts start appearing — a visible behaviour change); (c) first check on the live site whether any toast ever shows. | open |
| 2026-11-09 | 🛑 **CC-178 — which screen/card shows the 'English / हिंदी' chip?** Found only on the Notes card and the PDF card; not on daily-test, test-series or practice cards. Options: (a) restyle those two as labels (recommended); (b) make them real language toggles (only if both languages exist for that content); (c) send the screenshot. | open |

## 6. Blockers / risks
- `QOption` and `StatusChip` are shared: additive/call-site changes only.
- CC-175 touches motion-library screens: keep keys/timings; check the phase 65/79 topic-test result flow still works.
- CC-176: moving PDF opening to `usePdfViewer` changes behaviour in in-app browsers (intended); verify download analytics still fire.
- Clarity numbers (dead taps) can only be confirmed by the user after deploy.

## 7. Dependencies / packages added
None (no new packages). New i18n keys only.

## 8. Tests and verification
- [x] CC-175: `tsc --noEmit` — 93 source errors, same as before, none in `MiniTest.tsx` / `QOption.tsx` (a raw run shows +18 errors only in generated `.next/types/**` left by an earlier `turbo build`, not source)
- [x] CC-175: eslint JSON counts before vs after — `MiniTest.tsx` 12 errors / 5 warnings → 12 / 5 (all pre-existing `any` etc.), `QOption.tsx` 0 / 0 → 0 / 0; `pnpm check:colors` passes (no new colours)
- [x] CC-177: `tsc` 92 source errors (none in the page), eslint 0 errors / 4 warnings before and after
- [x] **CC-175 in Chrome, real local data** (CTET trial course, topic 81, long Hindi explanation): Check / Next Question stay at the same rect (desktop `x=658 y=519 220×44`, with Previous `x=758`; mobile iframe 390px `85,560 220×44`) before pick, after pick, after Check and with the explanation scrolled; CLS **0** (0 shifts) over Next → pick → Check; tapping Check with nothing picked keeps the button enabled (`aria-disabled`, not `disabled`) and shows the inline hint; Hindi (`/hi`) shows "मेरा उत्तर जाँचें" and "पहले एक विकल्प चुनें". Not measured: CLS of the OLD code (no baseline run), Marathi visually, the last-question "Finish Topic Test" state, a real Android phone / FB in-app browser (needs the user).
- [x] **CC-177 in Chrome** — mock failures injected by a local test proxy (`localhost:8099` → Laragon backend; Chrome in this session got 503 for `*.test` preflights but bypasses proxies for localhost): (A) real local backend 500 → error screen, 2 start POSTs (original + auto-retry); (B) first request dropped (network) then success → test opens by itself; (E) 500 ×2 → error screen → **Try again** → exactly 1 new POST → test opens; (D) 404 → 1 POST, no auto-retry; (C) 403 → "This test is locked" unchanged. Not verified: Sentry events (DSN was disabled for the local run), Hindi/Marathi wording on this screen, "Go to dashboard" navigation.
- Local-environment notes: the local DB `clearcut` has no `daily_test_attempts.attempt_number` column (migration not run locally), so the local `history`/`start` endpoints really 500 — that is local drift, not production; no migration was run. A new local token `pw-phase85` (id 198718, user 19392) was created and is left in place per the "keep the test session" rule; the browser used the token the user supplied (id 198719, user 6252).
- [ ] eslint on the other touched files; `pnpm check:tour` if the header is touched
- [ ] Playwright (Sonnet subagent), mobile 390 + desktop, en/hi/mr, mocked API: topic test (tap Check with no pick, long explanation, no layout jump), daily test (500 → auto-retry → Retry button), notes view, onboarding Continue
- [ ] Layout shift measured before/after on the topic test

## 9. Next steps
Create branch `fix/ui-small-fixes-batch` from `main`; do CC-175 and CC-177 first (no open decision); CC-176 next; CC-178 and CC-90 only after the 🛑 answers (the Continue-look part of CC-90 is independent and may proceed).
