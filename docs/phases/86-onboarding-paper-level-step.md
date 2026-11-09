# Phase 86 — Paper/level step inside onboarding + all subjects by default

**Tickets:** CC-81 (Medium, queue 10)
**Repos:** CM (`apps/dashboard`), BE only if the `selectedexam` contract needs it (decision below)
**Branch:** `feature/onboarding-level-step` — created from `main`, docs only so far
**Created / start date:** 2026-11-09
**Status:** Blocked – Decision — backend contract READ (2026-11-09): "all subjects by default" is not possible; the user must choose how to shorten the flow (see §5)

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

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-09 | 🛑 **How do we shorten the flow, given "all subjects" does not exist?** Options: **(A) Move the whole existing choice into onboarding** (paper → combination/subject, same UI as the "add subject" modal, auto-skip a step with one option), then `create` + `selectedexam`, land on `/preparation/{group_code}?subject_selected=1` — saves the "विषय जोड़ें" tap, the modal, "Start Learning"; no backend change; choices unchanged. **(B)** Move only the paper — saves little, subject modal still follows. **(C)** Send every leaf (rejected: 6–21 rows, changes what a student owns). **(D)** Pre-select a default leaf, e.g. the most chosen one (silent wrong content for many; needs a business decision and data from the user). Recommendation: **(A)**, behind an Amplitude flag. | open |
| 2026-11-09 | 🛑 If (A): where does the subject choice sit for HTET Level 3 (21 subjects) — a plain list on the onboarding card, or a searchable list? (UI/UX choice for the user.) | open |

## 6. Blockers / risks
- HTET vs CTET have different tree depths; language and `exam_content_language` handling differ (see `EditCourseModal`).
- Back button and `useOnboardingStore.reset()` on mount need care.
- Backend change (if any) must deploy before the frontend.

## 7. Dependencies / packages added
None expected. Possibly one backend change (see §5).

## 8. Tests and verification
- [ ] tsc / eslint / `check:colors`; Playwright (mocked levels for a 1-root and a 3-root exam, en/hi/mr, back button)
- [ ] After deploy (user): onboarding completion > 90%, onboarding → content same day rises (Amplitude)

## 9. Next steps
After the 🛑 answer (recommended A): implement behind a flag on branch `feature/onboarding-level-step`: new `LevelStep` in `OnboardingWizard` (levels prefetched in `ExamStep` via `prefetchLevels`, reuse the modal's selection UI), `create` then `selectedexam`, then redirect; analytics `step_name: "level_selection"` on the existing `Onboarding Step Completed`; test 1-root and multi-root exams, en/hi/mr, 390 px, back button, failing second call.
