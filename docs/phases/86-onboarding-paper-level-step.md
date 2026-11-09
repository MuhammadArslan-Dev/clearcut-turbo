# Phase 86 — Paper/level step inside onboarding + all subjects by default

**Tickets:** CC-81 (Medium, queue 10)
**Repos:** CM (`apps/dashboard`), BE only if the `selectedexam` contract needs it (decision below)
**Branch:** `feature/onboarding-level-step` — not created yet, not committed, not pushed
**Created / start date:** 2026-11-09
**Status:** Blocked – Decision — backend contract for "all subjects by default" must be read and confirmed first

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

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-09 | 🛑 **What does "select all subjects by default" mean in the backend?** Options: (a) send every leaf path in `selections` (no backend change, bigger payload, depends on tree depth per exam); (b) backend accepts a paper-only selection and treats it as "all subjects" (backend change + migration of meaning for `stage_id`); (c) keep subject choice but pre-tick all in the existing modal. Recommendation after reading the handler: decided with the user. Nothing built until answered. | open |

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
After the 🛑 answer: implement behind a flag on branch `feature/onboarding-level-step`.
