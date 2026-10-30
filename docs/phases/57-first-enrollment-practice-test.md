# Phase 57 — First-enrollment Practice Test

**Tickets:** (new, from user)
**Repos:** CM dashboard + backend (`clearcutoff-main-backend`)
**Branch:** `feature/first-enrollment-practice-test` (both repos) — not committed, not pushed
**Status:** (see Revision 7 for the load-time fix) Built and tested live with Playwright (2026-10-28, real local user, MAHATET + CTET courses): desktop 1440 + mobile 390, en + hi + mr, error paths. `tsc`, `eslint`, `check:colors` pass. Not committed, not pushed. Remaining: backend feature test, `pw-` token cleanup, entry via the real subject-selection modal (needs a course with no subjects).
**Created:** 2026-10-28

---

## Goal

After a learner enrols in a course and selects subjects, show a short Practice Test (5 random
questions, scoped to the chosen course and subjects) **before** the Preparation page. UI references:
`docs/screens/practice test/` (attempt + result, desktop + mobile). The tiger image is not used.

## Where it plugs in

- First-time flow: Onboarding → `/dashboard?user_type=new` → course card (`needsSubjects`, no `stage_id`)
  → `open("single")` → `BuySigleCourseModal.handlePurchase` → **`PracticeTestPromptSheet`** ("Take a quick practice test?")
  → *Take* = `/practice-test/{group_code}?subject_selected=1`, *Skip* (or backdrop / Esc / back) = `/preparation/{group_code}?subject_selected=1`.
- `PracticeTestPromptSheet` (`features/practice-test/`) is built from the shared `BottomSheet` (phones) / `Modal` (md+), like `ExamEndConfirmationSheet`; the picker is hidden while it shows.
- That modal only opens for a course with no subjects, or a newly added exam, so returning users are
  untouched. The edit-course modal (existing users changing papers) is unchanged.
- `subject_selected` is consumed by the global `FacebookPixel` on any route, so StartTrial still fires.
- Continue and Skip use `router.replace("/preparation/{group_code}")`, so Back doesn't return to the test.

## Backend (stateless — no migration, no tables)

| Endpoint | Purpose |
|---|---|
| `GET /v2/first-practice-test/{course}?count=5` | 5–10 random questions (clamped), mixed across the subjects, **never** `correct_option` / `explanation` |
| `POST /v2/first-practice-test/{course}/submit` `{answers:[{question_id, selected_option?}]}` | One request when the test is finished: correct option + explanation (all locales) per question. Omit/null `selected_option` = skipped. 404 if any question is outside the learner's scope, 422 on duplicates / bad option. Throttled 30/min |

- `{course}` = the enrolment `group_code`. Must be the caller's own, active enrolment **with `stage_id`**, else 404.
- Scope = same as the Daily Test: enrolment `stage_id` → `MappingNavigationSection` → sections →
  `MappingSectionChapter` → `question_new.chapter_id`, only questions whose translation has
  `correct_option` 1–4. One question per subject per pass, so no subject dominates.
- `submit` re-verifies every question is inside the caller's scope (404 otherwise). Answers/explanations exist **only** in this response, so nothing is revealed during the attempt.
- Files: `app/Services/FirstPracticeTestService.php`,
  `app/Http/Controllers/API/V2/FirstPracticeTest/FirstPracticeTestController.php`,
  `routes/Apis/V2/first-practice-test.php` (registered in `routes/api.php`).
- Own prefix on purpose: the existing `practice-test` routes (admin-authored tests, Telegram bot) have a
  catch-all `/{uuid}`.

## Frontend

- Route `(protected)/(exam)/practice-test/[courseId]` (layout = `ProtectedPage`, full-screen like Daily Test attempt).
- `features/practice-test/`: `PracticeTestPage` (attempt), `PracticeTestResult`, `AnimatedScoreRing`,
  `practiceTestSession` (sessionStorage resume, helpers). API: `lib/api/firstPracticeTest.ts`.
- **Reused from Daily Test / attempt-ui:** `AttemptTopbar`, `AttemptSummaryStrip`, `LiveTimeLeft`,
  `AttemptProgress`, `TipCard`, `QuestionMetaBar`, `QuestionsDock` (+ now-exported `STATUS_STYLE` /
  `ACTIVE_STYLE`), `StatusCountRow`, `QOption`, `OptionCard`, `CounterCard`, the `DailyTests.attempt.*`
  strings (timer, legend, mark, report).
- Attempt: a pick is only **saved** (tap the chosen option again to clear it) — no right/wrong, no explanation. Subtle entrance
  (fade-up strip/card/sidebar, fade between questions) with `framer-motion` (already in the app), none for reduced motion.
- Result: ring + score count-up, staggered fade-up blocks (no confetti), question-wise table; *View Explanation* expands the
  question, option cards (correct green / yours red) and the explanation — the only place explanations appear.
- i18n: new `PracticeTest` namespace — `messages/{en,hi,mr}/practiceTest.json`, registered in `src/i18n/request.ts`.
- 120 s per question (5 questions = the "10 Minutes" in the mock). Timer resumes after a refresh.
- Finish sends all answers in one `submit` request (skipped ones included). On failure the learner stays on the test with an inline
  error (the app has **no `ToastContainer` mounted**, so `react-toastify` toasts are invisible) and can tap Finish again.
- Empty question pool → straight to Preparation (never an empty test). Load error → Retry
  (`cancelQueries` first, per DEVELOPMENT_RULES §2.2) + "Go to Preparation".

## Assumptions / known gaps

- "Report Question" only fires the same `react-toastify` toast as the Daily Test; there is no report endpoint **and no toast container, so it shows nothing** (pre-existing, same on the Daily Test).
- `submit` can be called repeatedly (30/min) to read the answers for the test's questions. Accepted: no score is stored, no stakes.
- Done/skipped is not persisted: the test is reachable only from the first-subject-selection modal, and
  `replace` removes it from history. Typing the URL again just shows another test.
- No analytics events added yet (reuse existing ones per the analytics rule — decide which).
- Retake draws a fresh random set.
- `PracticeTestResult` has its own score ring and stat cards; the Daily Test's `ScoreRing` / `StatBlock`
  are file-local to its page and differ in layout. Consolidate later if wanted.

## Verification checklist

- [x] `npx tsc --noEmit -p .` — no errors in touched files
- [x] `npx eslint src/components/features/practice-test` — clean
- [x] `pnpm check:colors` — no new hardcoded colours (dashboard 427, was 525)
- [x] `pint` on the backend files, `route:list` shows both routes
- [x] Endpoint with a real token: 5 questions, no answers in payload, clamp 5–10, bad course / out-of-scope question → 404, no token → 401
- [ ] New-course flow through the real modal (no local course without subjects — route tested directly; Skip → `/preparation`, Back → previous page, session cleared)
- [x] Desktop 1440 + mobile 390, en + hi (or mr): attempt, correct/incorrect reveal, skip, finish, result, retake
- [x] Refresh mid-test resumes (answers, timer); refresh on result keeps the result
- [x] Load-error retry sends a request (assert request count); empty pool redirects
- [x] Backend feature test `tests/Feature/FirstPracticeTestTest.php` (5 tests, 82 assertions, MySQL, `DatabaseTransactions`; no leftover fixtures)

## Playwright findings fixed during testing (2026-10-28)

- Desktop bottom bar was transparent, so the explanation text showed behind Previous/Next → solid page background.
- Result table: raw `$…$` LaTeX in question text → `MathRender`; on mobile the result icon + View button vanished (wrapper blocked `truncate`) → constrained grid cell.
- Mobile topbar: the long Skip label squeezed the title → short label (`skipShort`) below `sm`.
- Hard-coded English in shared `AttemptProgress` / `QuestionsDock` → optional label props (default unchanged, Daily Test / full exam untouched).
- Questions now show in the app language when the question has that translation (toggle unchanged).
- Dev-only: the shared dev server returned 500 ("Jest worker … child process exceptions", §9) and had to be restarted with `--max-old-space-size=4096`.
- Unrelated, seen in the console: `GET /v2/daily-tests/{course}/history` returns 500 for two of this test user's courses on the Learn dashboard.
- Scope note: `check` verifies the question is in the learner's chapters; chapters can be shared between exams, so a question from one of their courses can also be checked through another of their courses (never another user's).

## Update 2026-10-28 (confirmation sheet, no reveal, calmer result) — verified in Playwright

- Both paths through the real picker (enrolment POST mocked, no DB write): *Take* → practice test; *Skip* → `/preparation/…?subject_selected=1`
  with **zero** `first-practice-test` requests; backdrop tap = skip; desktop modal + 390 px bottom sheet; en + hi.
- During the attempt: no right/wrong, no panel, no network (session `checks` empty); exactly one `POST …/submit` at Finish.
- Result at 390 + 1440: staggered fade-in, ring count-up, expanded row shows question + option colours + explanation.
- Submit failure (request aborted): stays on Q5, answers kept, inline error, retry succeeds.
- Backend `submit` via curl: ok, skipped, out-of-scope (404), duplicate ids / bad option / empty (422), wrong course (404), no token (401), old `/check` route gone (404).

## Desktop layout (2026-10-28, follow-up)
Three columns from `lg`: **Questions** panel in a left sidebar, the question card in the centre (stretches to the footer), **Skip Practice Test** in a right sidebar (240 px, 260 px from `xl`). Both sidebars are `sticky top-0`, so a very long question scrolls in the centre only and nothing is clipped; options go two-up only from `xl` (a 1024 px screen leaves the centre ~440 px). The pinned footer is one white strip with the buttons under the centre column (both sidebar widths left empty) and the "Need help?" row directly beneath it, no gap; phones are unchanged (sidebars hidden, Questions dock, footer + help). Verified at 1024×768, 1366×768, 1440×900, 1920×1080 and 390×844, including a 40-line question.

---

## Revision 2 — prompt can be dismissed by accident, then is gone (2026-10-29)

**Status:** Completed, verified (not committed, not pushed)
**Start date:** 2026-10-29

### 1. Problem
- Closing the prompt (backdrop / Esc / drag / back) counted as **Skip**: it wrote `practice_test = skipped` and sent the learner to Preparation. The enrolment already exists at that point and `BuySigleCourseModal` only opens for a course without subjects, so the prompt could never be offered again.
- The prompt was a bottom sheet on phones; the backdrop closed it on desktop.
- Feedback (2026-10-29, `/practice-test/…`, 394px): result cards on phones should be full width with no rounded corners.

### 2. Scope
- **In:** non-dismissible prompt (explicit *Take* / *Skip* only), full-screen on phones, centred modal on desktop, resume of an unanswered prompt, backend status for it, result cards full-bleed on phones, tests.
- **Out:** a new permanent "take the practice test" entry for learners who pressed *Skip* (no new UI pattern without a decision); offering the test to learners enrolled before this feature (they stay `not_taken` and are never asked).

### 3. Changes
- **Backend** `UserStateRegistry`: `practice_test` gets status `offered` (`not_taken → offered → skipped|completed`; client may set `offered`/`skipped`, never `completed`). Only a learner who was actually shown the prompt is `offered`, so only they can be asked again.
- `lib/api/userState.ts`: `offered` status, `offerPracticeTest(course)`.
- `BuySigleCourseModal`: marks `offered` when the prompt opens (fire-and-forget; no extra enrolment call → no duplicate rows).
- `Sheets/Modal`: optional `dismissible={false}` (backdrop + Esc do nothing); default unchanged for every other modal.
- `PracticeTestPromptSheet`: full-screen `dialog` on phones (`safe-area` padding, buttons pinned at the bottom), non-dismissible `Modal` from `md`. Only *Take* / *Skip* close it.
- `PreparationShell`: if the course is `offered`, the same prompt shows on entry **before** the Preparation guide is claimed. *Take* → `/practice-test/{code}`; *Skip* → `skipped`, stays on the page, guide claim then runs. Read errors fail open (guide unaffected).
- `PracticeTestResult`: cards `max-md:!rounded-none`, wrapper `px-0` on phones (heading keeps `px-4`), stat grid `gap-px`; background is solid `--color-primary-bg-soft` on phones (was a blue→white fade, so white cards vanished into the white middle), gradient kept from `md`; desktop unchanged.

### 6. Risks / notes
- Guide claim now waits for one extra `GET /user-state` (fails open).
- A learner who closes the tab on the prompt is asked again on the next Preparation visit until *Take*/*Skip*; mid-test abandon also keeps `offered` (resume).
- Pre-existing, not touched: `GET /v2/daily-tests/{id}/history` 500 for some courses; the dev-only agentation toolbar overlaps the bottom-right of the phone prompt.

### 7. Dependencies
None.

### 8. Tests and verification (2026-10-29, local DB `clearcut`, fixtures deleted afterwards)
- [x] Backend: `UserStateTest` 29 passed (2 new: `offered` transitions / client cannot complete / answers never re-open; submit completes an `offered` test) + `FirstPracticeTestTest` 5 passed; `pint` clean.
- [x] `tsc` (touched files clean), `eslint` (no new warnings), `check:colors` (no new colours).
- [x] Real first-time flow (Exams → UPTET → Paper 1 → Start Learning): prompt shows, **one** enrolment row, state `offered`; backdrop click and Esc keep it open (desktop 1440 and phone 390/394).
- [x] Refresh on the prompt keeps it; leaving and coming back via Dashboard → Continue Learning / direct URL shows it again, guide not claimed until answered.
- [x] *Take* → `/practice-test/{code}`; abandoning the test and returning to Preparation shows the prompt again.
- [x] *Skip* → state `skipped`, stays on Preparation, guide claimed (`shown`), prompt does not return after reload.
- [x] Completed test (submit) → prompt never returns. Learner with `not_taken` (existing enrolment) → no prompt.
- [x] Phone result screen: all cards 394px wide, radius 0; desktop radii unchanged (16/14px).
- [x] Phone result screen background: light blue top to bottom, white cards separated by blue strips (screenshot top + scrolled).
- [ ] Not tested: desktop *Skip* click (same handler as phone), `hi`/`mr` copy of this prompt (strings unchanged).

### 9. Next steps
- Decide whether learners who pressed *Skip* need a way back (e.g. a small card on Preparation). Not built.
- Merge-time: see Phase 64 note on `UserStateRegistry.php:99`.

---

## Revision 3 — no timer, elapsed time on the result, question slide + micro-interactions (2026-10-29)

**Status:** Completed, verified (not committed, not pushed)
**Start date:** 2026-10-29

### 1. Objective
- Remove the countdown and every time limit from the Practice Test (it used to show a 10-minute timer and auto-submit at zero).
- Measure elapsed time silently and show it on the result ("1 min 34 sec").
- Slide the next question in from the right and the previous one from the left, plus small playful, restrained feedback (Duolingo-like feel, not its UI).

### 2. Scope
- **In:** `PracticeTestPage`, `PracticeTestResult`, `practiceTestSession`, new `usePracticeElapsed`, `PracticeTestPromptSheet` copy, `AttemptSummaryStrip` (`time` now optional), en/hi/mr `headerMeta`.
- **Out:** Daily Test / full exam keep their timers (`AttemptSummaryStrip` unchanged when `time` is passed); no new packages (framer-motion was already used here); no sound; no right/wrong shown during the test (answers are still only revealed on submit).

### 3. Implementation
- **No timer:** removed `LiveTimeLeft`, `PRACTICE_SECONDS_PER_QUESTION`, `remainingSeconds` and the auto-submit. `headerMeta` (topbar, prompt, result) is now "{count} Questions • Mixed Topics" in en/hi/mr. The strip shows progress + tip only.
- **Elapsed time** (`usePracticeElapsed`): active time only. It runs while the page is mounted and visible, pauses on `visibilitychange` hidden / `pagehide` / unmount (and saves), resumes after a refresh from `session.elapsedMs`. Captured at the **Finish tap** (not when the server answers) and stored in the session with `finishedAt`. The result shows it with the existing "{min} min {sec} sec" / "{sec} sec" strings; tests stored before this change fall back to `finishedAt − startedAt`. Retake starts at 0.
- **Slide:** `AnimatePresence mode="wait"` + `custom` direction (`directionRef`, set from the target index vs the current one, so the question grid also slides the right way). 32 px + opacity, 200 ms ease-out; reduced motion = fade only; the card has `overflow-x-clip`. Answers/marks live in the session, so nothing is lost.
- **Micro-interactions:** option tap press (0.98) and one soft pop when it becomes selected (`initial={false}`, not replayed on revisit); desktop question-grid cell press + pop for the active one; Previous/Next press (0.96); progress bar already eased (CSS). Result: row status icons spring in, staggered top to bottom after the blocks settle, a correct answer with the livelier spring; not-attempted and reduced motion stay still. Ring + count-up were already there.

### 6. Risks / notes
- A paused/hidden tab is not counted, so "time taken" is time actually spent on the test, not wall-clock since start.
- If a page is killed without `pagehide` (crash), at most the time since the last save (last answer/navigation) is lost.
- Not built: animated "N% Complete" label (the bar itself eases).

### 7. Dependencies
None.

### 8. Tests and verification (2026-10-29, local DB `clearcut`, fixture user deleted afterwards)
- [x] `tsc` (touched files clean), `eslint` (clean), `check:colors` (no new colours).
- [x] Desktop 1440: no timer, topbar "5 Questions • Mixed Topics", strip = progress + tip only.
- [x] Slide, sampled per frame: **Next** → old question leaves left (388→356 px), new one enters from the right (420→388); **Previous** → old leaves right (388→420), new enters from the left (356→388); ~200 ms, smooth.
- [x] Answer persistence: option B on Q1 stays selected after Next → Previous; stored `answers` survive a refresh.
- [x] Elapsed: stopwatch frozen while the tab is hidden (4 s hidden = no change), resumed on visible (+3.07 s after 3 s), continues across a refresh (79.6 s → 90.1 s), unchanged by submit latency.
- [x] Submit + result: "1 min 34 sec" for a 93.85 s run on desktop; Retake resets (36 sec on the next run, phone 390).
- [x] Phone 390: no timer, full-bleed layout intact, no horizontal overflow during any slide (scrollWidth 390 at 60/120/200 ms), Previous/Next/Finish work.
- [ ] Not tested: `hi`/`mr` result screens (only `headerMeta` strings changed), reduced-motion preference, a real mobile browser (Chromium emulation only).

### 9. Next steps
- Commit when asked. Open from earlier revisions: way back for learners who pressed *Skip*, phase 59 status.

---

## Revision 4 — prompt matches the approved design (2026-10-29)

**Status:** Completed, verified (not committed, not pushed)
- Design: `Downloads/Quick Practice Test Onboarding Screen.png`. Built to match: illustration on top, two-line title ("Take a Quick" dark / "Practice Test?" brand blue), body, **"No Pressure!"** note card (target icon), **Take Practice Test** (filled) + **Skip, go to Preparation** (outlined). The old "5 Questions • … • Mixed Topics" chip and the clipboard icon circle are gone.
- Image: only the illustration is cropped from the design and saved as `apps/dashboard/public/images/practice-test-prompt.webp` (780×602, **16 KB**, quality 84), loaded with `next/image` `priority`. Everything else is real text/CSS (en/hi/mr via `prompt.titleTop`, `titleAccent`, `noPressureTitle`, `noPressureBody`). Hindi/Marathi strings are new translations: have them reviewed.
- Phones: full-screen, image full-bleed, buttons pinned to the bottom (`heading-xlarge` title, `body-large` body). Desktop: same content in the non-dismissible centred `Modal`, image 380 px with soft-faded edges (CSS mask). Entrance: image fades in, text and note rise in sequence; none for reduced motion.
- Verified on the real prompt (phone 390 and desktop 1440): layout matches the design, backdrop/Esc still do not close it. `tsc`, `eslint`, `check:colors` clean.
- Not verified: `hi`/`mr` rendering of the new lines (text length), a real phone.

**Revision 4b (2026-10-29, page feedback on `/dashboard/my-courses`, 1536×738):** the desktop modal cut off its buttons on short screens. Fix: the illustration width follows the viewport height (`min(380px, 28vh × 1.296)`), tighter spacing; the modal now fits with no inner scroll at 1536×738 (content 590 px in a 590 px box, buttons end at 640 of 664). *Take Practice Test* is now the shared `ShimmerButton` (size `lg`, shimmer sweep, off for reduced motion); *Skip* is `size="md"` outlined. Verified by measuring the real modal at 1536×738.

---

## Revision 5 — component-level skeletons, Previous/Next icons, "Show Explanation" (2026-10-29)

**Status:** Completed, verified (not committed, not pushed)
**Start date:** 2026-10-29

### 1. Objective
1. Both screens get full, component-level skeletons that match the final layout (no full progress bar, no empty header/content while loading, no layout shift).
2. Previous/Next buttons: correct directional icons, size, alignment and colour per variant (today the Previous chevron is `white` on an outlined button, so it is invisible).
3. During the test an answer no longer reveals anything. A **Show Explanation** button appears under the question once an answer is picked; clicking it expands that question's explanation (same `QuestionExplanation` + styling as the Results screen).

### 2. Scope
- **In:** `PracticeTestPage` (+ its skeleton), `PracticeTestResult` skeleton, session shape, API client, en/hi/mr strings, **one new backend endpoint**, backend tests.
- **Out:** Daily Test; the final submit/score flow (unchanged); a persistent "hide/show all".

### 3. Design / decisions
- **Backend:** the explanation (and the correct option, which `QuestionExplanation` shows) used to exist only in `POST …/submit`, which also *completes* the test. New `POST /v2/first-practice-test/{course}/explanation` `{question_id}` → `{question_id, correct_option, explanation, translations}`. Same scope check as submit (own enrolment + question in the learner's subjects → else 404); **does not touch `practice_test` state**; throttled. ⚠️ Trade-off accepted by the request: a learner can now read the correct option of a question before submitting, only by explicitly pressing the button; there are no stakes (no score stored beyond the one-time completion).
- **Session:** `explained: Record<question_id, explanation>` (cached, so toggling and navigating never refetch) and `shown: question_id[]` (which are open). Both survive refresh and are keyed by question id, so an explanation can never attach to another question. Old stored sessions without them keep working.
- **UI:** button appears only while an answer is selected (clear the answer → button and panel hide, cache kept); label toggles Show/Hide; while fetching the panel shows an explanation-shaped skeleton; a failed fetch shows an inline error and the button retries (no toast container exists). The panel is inside the question's animated wrapper, so it slides with the question.
- **Icons:** `ChevronIcon` defaults to `color="white"`; Previous (outlined) and Next (filled) now use `leftIcon`/`rightIcon` with `color="currentColor"` so the icon follows the button variant, disabled state included.
- **Skeletons:** `PracticeTestSkeleton` rebuilt from the real structure (topbar, progress strip + tip, question navigator, question card with meta bar / title / lines / 4 options, skip card, pinned footer with two buttons, phone question dock) using the same wrappers/paddings as the screen; new `PracticeTestResultSkeleton` (topbar, greeting, score card, next-step card, 5 stat cards, table card, footer). The result skeleton also shows while the final submit is in flight; a failed submit returns to the test with the inline error.

### 6. Risks
- Showing the correct option before submit (above). The new endpoint is the only place it can be read early.
- Skeleton and screen can drift: both use the same wrapper classes; measured side by side at the end.

### 7. Dependencies
None.

### 8. Tests and verification (2026-10-29, local DB `clearcut`; Playwright fixture user 19392 left in place on purpose)
- [x] Backend `FirstPracticeTestTest` 7 passed (2 new: explanation returns the correct option + text and creates **no** `practice_test` state, then submit agrees; scope: 401 / 422 / 404 foreign question / 404 foreign course); `pint` clean.
- [x] `tsc`, `eslint`, `check:colors` clean.
- [x] **Show Explanation** (desktop 1440, phone 390): no button before an answer; the button appears after picking one and nothing is revealed; click → explanation-shaped skeleton → "Answer & Explanation" panel (same `QuestionExplanation` as the result); label Hide/Show toggles, panel hides; **one** request per question (cached), Next → Previous keeps it open; clearing the answer hides button + panel and keeps the cache. The button is centred and `size="sm"` (32 px).
- [x] Association: explanations opened on all 5 questions, then submitted: every question's correct option and text equals the submit result's.
- [x] Icons: Previous (outlined) shows its left chevron in the brand colour (dimmed when disabled), Next shows the right chevron in white, Finish shows a check; all follow `currentColor`.
- [x] Skeletons measured against the real screens: test screen desktop (strip, navigator, question card, footer within 0-4 px; header now within 1 px), phone (header, strip, question card top and footer identical); result desktop (header/greeting/score card/stat row within 1-3 px, table 9 px lower, below the fold) and phone (header, greeting, stat cards, table identical, top cards ±16 px depending on the copy length). Result skeleton shows while the final submit is in flight (submit delayed 3.5 s in the test) and no horizontal overflow on phone.
- [x] Failed submit (request aborted): back on the test, inline "Couldn't submit…" error, Finish enabled; the second try reaches the result.
- [x] Elapsed time still shown on the result ("2 min 17 sec" in the run).
- [ ] Not tested: `hi`/`mr` text of the new strings on screen (JSON valid), reduced motion, a real phone, the explanation text of questions with images/LaTeX-heavy content.

### 9. Next steps
- Commit when asked. Open: a way back for learners who pressed *Skip*, phase 59 status.

---

## Revision 6 — result screen: fewer buttons, lighter phone background (2026-10-29)

**Status:** Completed, verified (not committed, not pushed)
**Start date:** 2026-10-29

### 1. Objective
- Remove the **Continue to Preparation** button from the "Next Step" card and the **Retake Practice Test** button from the footer, without gaps or alignment problems on phone and desktop.
- The phone background of the result screen is too blue: make it lighter.

### 2. Scope / decisions
- **In:** `PracticeTestResult` (card + footer + background), its skeleton (`PracticeTestSkeletons`) so loading and loaded still match, the now-unused retake plumbing in `PracticeTestPage`.
- **Kept:** the footer's **Continue to Preparation** (the only exit from the result, so it stays and is centred, full width on phones). The Next Step card keeps its icon, title, text and illustration; with no button it is shorter, so its content is centred in the stretched card instead of leaving an empty bottom.
- **Consequence:** with Retake gone there is no way to retake from the result screen (a typed URL would resume the finished result; the only way to a fresh test is a new enrolment flow). `retake` and the `onRetake` prop are removed as dead code. Not touched: the backend (a retake never had its own endpoint).
- **Background (phones):** the solid `--color-primary-bg-soft` is replaced by a lighter tint of the same token; desktop gradient unchanged.

### 3. Changes
- `PracticeTestResult`: the Next Step card no longer has a button (content centred vertically in the stretched card, illustration sits at the card bottom); the footer keeps one button, **Continue to Preparation**, centred (424 px from `md`, full width on phones), now the shared `ShimmerButton` (size `lg`, shimmer off for reduced motion). Removed `onRetake`, the Retake button and `RotateCcw`.
- `PracticeTestPage`: removed the dead `retake`, `nonce` / `setNonce` (query key is `["first-practice-test", courseId]`).
- Phone background: the solid `--color-primary-bg-soft` is now that token at 40 % (desktop gradient unchanged), in the screen and in the result skeleton.
- `PracticeTestSkeletons`: result skeleton has one footer pill (45 px, like the real button), no card button, same lighter background.
- The `result.retake` strings stay in the en/hi/mr files (unused, harmless).

### 6. Risks / notes
- No way to retake from the result any more; a finished test is final for that course (the practice-test gate also sends a completed course to Preparation).

### 8. Tests and verification (2026-10-29)
- [x] `tsc`, `eslint`, `check:colors` clean.
- [x] Phone 390: only "Continue to Preparation" exists (no Retake), footer 61-65 px with one full-width button, Next Step card shows no gap below its text, no horizontal overflow, background clearly lighter than before.
- [x] Desktop 1440: the footer button is centred exactly (720 px = viewport centre), Next Step card content centred, no empty space; shimmer sweeps (overlay x position changes between samples).
- [x] Navigation: View Explanation still expands a row; Continue to Preparation goes to `/preparation/<course>`; a completed course opened by URL is redirected to Preparation (gate), as before.
- [x] Skeleton vs result: header, greeting, stat row, table identical on phone; desktop within 1-3 px (table 9 px). Top cards on phone follow the score text length (±24 px); footer 1 px.
- [ ] Not tested: `hi`/`mr` result screens, a real phone.

---

## Revision 7 — Practice Test took 3-4 s to open: root cause + fix (2026-10-30)

**Status:** Completed, measured and verified locally (backend branch `perf/practice-test-load`, frontend on `feature/practice-test-flag`; not committed in the backend, nothing deployed)

### 1. Problem
After *Take Practice Test* (or opening `/practice-test/{course}`) the skeletons stayed for 3-4 s.

### 2. Where the time went (measured, local MySQL `clearcut`: 37k questions, 60k translations)
| Step | Before |
|---|---|
| Enrolment lookup, sections (5 subjects), chapters | ~10 ms |
| **`pick()`: one `WHERE EXISTS(question_trans ...) ORDER BY RAND() LIMIT n` per subject** | **3.3-4.6 s** (5 x ~800-950 ms, run one after the other) |
| Load the 5 chosen questions + translations | ~3 ms |
| Payload | 4-13 KB (not a factor) |

Two causes inside that query (`EXPLAIN`):
1. `exists(question_trans.correct_option between 1 and 4)` is planned as a semi-join that **scans all of `question_trans`** (38k rows, `correct_option` has no index) into a temporary table and filesorts it, per subject.
2. `question_new.chapter_id` is a **`varchar(50)`** but the chapter ids were bound as integers, so MySQL compared numerically and scanned the whole `chapter_id` index (37,184 rows) instead of a range (491 rows). Same pitfall costs ~300 ms even after (1) is fixed.
Smaller: Eloquent `pluck()` of ~3k ids hydrated models (80 ms vs 7 ms with the query builder). Frontend added a serial round trip (`user-state` check, then questions).

### 3. Changes (no migration, no new index, no new dependency)
- `FirstPracticeTestService::randomAnswerableIds()` replaces the `ORDER BY RAND()` query: candidate ids come from the `chapter_id` index (plain query-builder rows), are shuffled in PHP, and a small batch (max(4 x n, 20)) is checked against `question_trans` through its `question_new_id` index; the next batch is only read if too many were unanswerable. Same distribution as before (uniform among answerable questions), never a short sample while answerable questions exist.
- `chapterIds()` returns **strings** (used by `pick()` and by the scope check of `submit` / `explanation`).
- Selection, section mixing (one per subject per pass), scope rules, response shape and the answer-hiding rules are unchanged.
- Frontend: `PracticeTestPage` starts the questions request while the "already completed?" check runs (the test still opens only after that check passes; a completed course still goes to Preparation). `PracticeTestPromptSheet` takes `courseCode` and prefetches the test while the prompt is open (`practiceTestQuery.ts`, same query key, 2 min cache, silent on failure, skipped when a test is already in progress).
- Files: backend `app/Services/FirstPracticeTestService.php`, `tests/Feature/FirstPracticeTestTest.php`; frontend `practice-test/PracticeTestPage.tsx`, `PracticeTestPromptSheet.tsx`, new `practiceTestQuery.ts`, `PreparationShell.tsx`, `buy-sigle-course-modal.tsx` (one prop each).

### 4. Measurements (same machine, same fixture enrolments, before vs after)
Controller-level (in-process request through the kernel, 5 warm runs, median): UPTET **4282 ms -> 81 ms**, REET **3438 ms -> 61 ms**. `pick()` SQL time 4.5 s -> ~40 ms.
Browser (headed Chromium, Next **dev** server, vardata mocked, 5 runs, median; "visible" = first question + Next button rendered):
| Scenario | Old backend + old frontend | New backend | New backend + new frontend |
|---|---|---|---|
| A: open `/practice-test/{course}` directly (from navigation start) | 7670 ms (6744-12432) | 1921 ms (1828-2197) | **1741 ms** (1543-1935) |
| B1: tap *Take* as soon as the prompt shows (click -> visible) | 5905 ms (5699-6062; one 30 s outlier) | ~1460 ms (3 clean runs: 1300 / 1463 / 1492) | **1408 ms** (1141-1593) |
| B2: tap *Take* 3 s after the prompt shows | not measured | not measured | **1160 ms** (922-1304) |
Questions request itself (start -> end, one sample each): ~4.6 s -> ~165 ms. In the new frontend the `user-state` check and the questions request start in the same millisecond (1652 / 1655 ms); with prompt prefetch exactly **one** questions GET per run.
Dev-server numbers (no production build, HMR, hydration in dev); the absolute remainder (~1.2-1.7 s) is app boot + route chunk + the `user-state` check + entrance animation, not the test generation.

### 5. Verified
- Backend: `FirstPracticeTestTest` 8 passed (new: answerable-only, distinct, in scope, random across runs, < 1.5 s); old vs new "answerable" id set identical in 10/10 real sections; int vs string chapter binding returns identical rows (no non-canonical `chapter_id` values); `pint` clean.
- Browser (new code): direct URL shows 5 distinct questions with 4 options each and no `correct_option` in the stored payload; full run answer x5 -> Finish -> result with score and time -> Continue -> `/preparation/...`; flag OFF direct URL -> Preparation with **0** test requests; completed course -> Preparation (now 1 questions GET happens in parallel, no error flash); prompt -> Skip -> Preparation (1 prefetch GET, harmless); `vitest` 9/9, `tsc`/`eslint` clean for the touched files.

### 6. Remaining / not done
- Production numbers are not measured (prod DB size/plan may differ; the new queries use indexes in any plan). Not tested on a real phone or over a slow network.
- Prefetch gain is modest (~250 ms, B1 vs B2) now that the API is fast; costs one extra cheap GET when a learner skips. Remove `courseCode` props if that is not wanted.
- The `user-state` check still runs before the test shows (needed for the completed-course redirect).
- Same pitfall likely elsewhere: ~58 `where/whereIn('chapter_id'|'section_id'|'topic_id', ...)` calls across the backend (Daily Test, Mini Test, ...) pass integers to `varchar` columns. Not touched (unrelated); worth a separate look, or a migration changing the columns to bigint.
- Deploy: backend change must go to `main` of the backend repo (auto-deploys); dashboard change to `main` here.

