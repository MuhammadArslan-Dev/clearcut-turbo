# Phase 86 — Paper/level step inside onboarding + all subjects by default

**Tickets:** CC-81 (Medium, queue 10)
**Repos:** CM (`apps/dashboard`), BE only if the `selectedexam` contract needs it (decision below)
**Branch:** `feature/onboarding-level-step` — committed locally, not pushed
**Created / start date:** 2026-11-09
**Status:** In Progress — option A built behind flag `onboarding_level_step` (default OFF) and browser-tested; open points listed in §5/§8

> Start only after phase 85 and the money phases (87, 88). Nothing implemented.

---

## 1. Problem / objective
After onboarding, new students tap 4–5 more times before seeing content ("विषय जोड़ें" → pick paper → continue → pick subject → Start Learning). About 650 students (15%) are lost at this step (Clarity: https://clarity.microsoft.com/player/o8pe7lwvxo/1oh4v7v/qepid3). Goal: ask paper/level inside onboarding (only for exams that have levels, e.g. CTET Paper 1/2, HTET Level 1/2/3), select all subjects by default, and land on the first-content screen. Onboarding completion must stay above 90%.

## 2. Scope
- **In:** a level step after Exam in the onboarding wizard; all-subjects default; redirect to the first content; strings en/hi/mr; analytics via existing events.
- **Out:** reviving the old commented-out level flow, redesigning the buy/edit course modals, the first-test A/B (CC-133), the free-unlocks test (CC-164).

## 3. Implementation plan (current code, verified read-only 2026-11-09)
Today: `features/onboarding/OnboardingWizard.tsx` has two steps (`LanguageStep`, `ExamStep`; level step commented out ~l.61–67). `ExamStep.handleEnroll` → `POST /v2/enrollment/create` (`lib/api/onboarding.ts:76`) which takes **only `exam_id`** (backend `EnrollmentController::enrolledToCourse` validates only that; `stage_id` stays null / `resolveUnambiguousStageId`), then `router.replace("/dashboard?user_type=new")`. The dashboard shows "विषय जोड़ें" because `!activeExam.stage_id`; that opens `components/modals/course/buy-sigle-course/buy-sigle-course-modal.tsx` (levels from `GET /v1/exam/all-levels/{id}` via `hooks/onboarding/useLevels.ts`; step 0 paper, step 1 subject path; submits `POST /v1/exam/selectedexam {exam_id, selections:{rootId:[pathIds…]}}`, then `/preparation/{group_code}?subject_selected=1`).
- [ ] 1. **Read-only first:** read the backend `/v1/exam/selectedexam` handler (`ExamController`) to learn what a paper-only selection or "all subjects" means (frontend model = one path per root, no "all subjects" value). 🛑 If it needs a backend change → stop and ask (see §5).
- [ ] 2. Frontend: level step after Exam, only for exams whose levels have more than one root (`levels.filter(parent_id === null).length > 1`); reuse the `buy-sigle-course-modal` selection UI (`OptionSelectionCard`, `transCache`, `parseTranslation`); prefetch levels in `ExamStep` for the chosen exam (`prefetchLevels` in `useLevels.ts`).
- [ ] 3. After enrolment go straight to `/preparation/{group_code}?subject_selected=1` (group_code is in `enrolledToCourse`'s response `data.group_code`); keep "विषय जोड़ें" for later changes. Mind the phase 57/58/72 practice-test prompt order and the phase 84 enrolment animation.
- [ ] 4. Analytics: add `step_name: "level_selection"` to the existing `Onboarding Step Completed` (`lib/analytics/events/onboarding.ts`); reuse `New Exam Added`. No new events.
- [ ] 5. i18n: `Onboarding` namespace (`messages/{en,hi,mr}/onboarding.json`, already registered). Behind an Amplitude flag if the backend side is not ready.

## 4. Progress / completed changes
- 2026-11-09 — phase file written; code read only.
- 2026-11-09 — **step 1 done (read-only, nothing changed): the backend contract.**
  - `POST /v1/exam/selectedexam` (`ExamController::enrollExam`) validates `exam_id` + `selections` (min 1). Each entry of `selections` is a **path of navigation ids**; one enrolment row is written per entry (updated in place if the exam row exists, group_code kept) and its `stage_id` = the LAST id of the path. The key of each entry is arbitrary.
  - Content hangs ONLY on leaf navigation nodes: `getOrderedSections($stageId)` reads `mapping_navigation_sections` where `navigation_id = stageId`. A paper (root) that has children has 0 sections → a root-only selection would give an EMPTY course.
  - The leaves are **alternatives**, not parts of one course (local DB, `e_navigations` + `mapping_navigation_sections`): CTET Paper 1 = 3 language combinations (leaf = 5 sections each); CTET Paper 2 = 3 combinations × {Social Studies, Maths and Science} = 6 tracks; HTET Level 1 = leaf itself (6 sections), Level 2 = 12 subjects, Level 3 = 21 subjects. Exams with more than one paper: 7 of 10 largest; CTET 6068 and HTET 5617 enrolments.
  - So **"select all subjects by default" cannot be built as written**: sending every leaf would create 6–21 enrolment rows per student (different course data, access, counts, analytics) and a root-only stage gives nothing. What CAN be moved is the same choice (paper → combination/subject) into onboarding.
  - `POST /v2/enrollment/create` (unchanged) creates the row (status `trial`, dates, `active_level`) with `stage_id` null for multi-leaf exams; `selectedexam` then updates that row in place — exactly what the existing modal does today. **No backend change is needed** if onboarding calls `create` and then `selectedexam` with the chosen path; if the second call fails the student is still enrolled and sees today's "विषय जोड़ें".

- 2026-11-09 — **built (option A), flag `onboarding_level_step`, default OFF = today's flow:**
  - `lib/onboarding/levelChoice.ts` (pure rules: leaf count, `needsLevelChoice` = more than one leaf, single paper auto-picked (CC-111), changing an earlier choice drops later ones, a group per depth, case-insensitive filter that keeps the selected option) + 7 Vitest tests.
  - `lib/experiments/onboardingLevelFlag.ts` — Amplitude flag, ON only for variant `on`, never throws, 1.5 s timeout.
  - `OnboardingWizard.tsx` — asks the flag while the student is on the language step; flag on => a third step (`LevelChoiceStep`, loaded dynamically), flag off/unconfirmed => the two steps exactly as before.
  - `ExamStep.tsx` — flag on: levels are prefetched when an exam is picked; Continue goes to step 3 only if the exam has more than one leaf, otherwise (or if the levels did not load) it enrols right there as before.
  - `LevelChoiceStep.tsx` — paper (skipped when there is one) then each further group (combination, subject); a search box for any group with more than 8 options ("Search subject" / hi / mr, "No subject found"); Start stays enabled but looks not-ready until a leaf is picked and says why on tap (CC-90 pattern, hint floats above the button); then `enrollment/create` (unchanged) and `selectedexam` with the picked path (exactly what the "add subjects" modal saves) and `/preparation/{group_code}?subject_selected=1`; if the `practice_test` flag is on and the test is not done, `offerPracticeTest` is recorded first so Preparation asks Take/Skip as it does after the modal; completion animation (phase 84) reused; synchronous in-flight guard.
  - Analytics: existing `Onboarding Step Completed` (`step_name: level_selection`, plus `selected_navigation_ids/names`) and existing `Onboarding Completed`; no new event names. i18n: two keys appended to `Onboarding.subject` in en/hi/mr.
  - Backend: no change.

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-09 | ✅ ANSWERED by the user: **option A**, with a **searchable list** for long subject lists. (Original question follows.) 🛑 **How do we shorten the flow, given "all subjects" does not exist?** Options: **(A) Move the whole existing choice into onboarding** (paper → combination/subject, same UI as the "add subject" modal, auto-skip a step with one option), then `create` + `selectedexam`, land on `/preparation/{group_code}?subject_selected=1` — saves the "विषय जोड़ें" tap, the modal, "Start Learning"; no backend change; choices unchanged. **(B)** Move only the paper — saves little, subject modal still follows. **(C)** Send every leaf (rejected: 6–21 rows, changes what a student owns). **(D)** Pre-select a default leaf, e.g. the most chosen one (silent wrong content for many; needs a business decision and data from the user). Recommendation: **(A)**, behind an Amplitude flag. | open |
| 2026-11-09 | ✅ If (A): HTET Level 3 (21 subjects) — **searchable list** | user (answered) |
| 2026-11-09 | 🛑 Turn the flag on: create `onboarding_level_step` in Amplitude (variant `on`), roll out gradually, watch onboarding completion (> 90%) and onboarding → content same day. | open |

## 6. Blockers / risks
- HTET vs CTET have different tree depths; language and `exam_content_language` handling differ (see `EditCourseModal`).
- Back button and `useOnboardingStore.reset()` on mount need care.
- Backend change (if any) must deploy before the frontend.

## 7. Dependencies / packages added
None expected. Possibly one backend change (see §5).

## 8. Tests and verification
- [x] tsc 93 = clean `main` 93; eslint touched files 0 errors (wizard/ExamStep warnings unchanged); `check:colors` passes; all dashboard Vitest 26 passed (7 new).
- [x] **Browser test (Chrome, local dashboard + local backend for the real exams/levels; the two POSTs `enrollment/create` and `selectedexam` and the flag were stubbed in the page, so no enrolment was written):**
  - flag ON, CTET: indicator shows 3 steps; step 3 asks the paper; Start tapped with nothing picked → "Select an option first" shown without moving the button; Paper 2 → "Language subject" group → "Optional subject" group → Start turns blue only when complete; payload `selections` = `[52,56,60]` (Paper 2 → English and Hindi → Maths and Science), then `/preparation/{group}?subject_selected=1`; Paper 1 → combo is the leaf (`[51,53]`).
  - **Bug found and fixed:** a double/triple click on Start sent `create=2, saved=2` (state guard is async); a synchronous ref guard was added; re-test: triple click → `create=1, saved=1`. (The same async-state guard exists in the older `ExamStep` enrol path: not changed here.)
  - `selectedexam` 500: error "Something went wrong. Please try again." shown, selection kept, button active; retry → +1 `create` and +1 `selectedexam` (2,2), then success.
  - HTET Level 3 (21 subjects): search box shown; "phy" → Physical Education, Physics, Geography; "zzzq" → "No subject found".
  - flag OFF: "2/2" steps, Continue enrols in ExamStep (`{"exam_id":3}` only, `selectedexam` not called) and goes to `/dashboard?user_type=new` — unchanged.
  - Hindi at 390 px, UP PGT (one paper): paper question skipped, subject list in Hindi with Hindi search placeholder and Start bar at the bottom.
- [ ] **Not verified:** Marathi visually, back button from step 3 and re-entering with a different exam, an exam whose levels fail to load (should fall through to plain enrolment: reasoned, not run), practice-test flag ON path with a real backend, the Preparation page for a freshly enrolled real user (the group code was stubbed), the real backend write (`create` then `selectedexam` on a fresh user), the completion animation over the Preparation page, desktop layout beyond one screenshot, real phone, Amplitude events (disabled locally), and the effect on onboarding completion (needs the rollout).
- [ ] After deploy (user): onboarding completion > 90%, onboarding → content same day rises (Amplitude)

## 9. Next steps
Before any rollout: run `create` + `selectedexam` once against a fresh local user (not the shared fixture) and open the resulting Preparation page; check the back button; then the user creates the Amplitude flag and rolls out gradually. No merge/deploy without approval.
