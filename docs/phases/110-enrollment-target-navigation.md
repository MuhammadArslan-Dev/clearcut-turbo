# Phase 110 — First enrolment → Preparation, afterwards → Target

Date: 2026-11-13. Branches: frontend `feat/enrollment-target-nav` (on top of phase 109), backend `feat/enrollment-learning-started`.

## 1. Rule
- First time in a course (no saved topic position on the server) → Preparation (onboarding, unchanged).
- Once the student has studied in it → every entry point OUTSIDE the course pages opens Target.
- Inside the course area the Course / Tests tabs and the Target plan's topic links still open Preparation directly (that is how the syllabus is reached from Target; redirecting them would hide the syllabus and loop).
- Direct URLs and refreshes are not redirected.

## 2. Source of truth
Backend `CourseRepository::markLearningStarted`: `learning_started` on every enrolment of `GET /v2/get-my-active-courses` and `/v2/get-my-courses` = a `user_course_resume_states` row (mode `learning`, topic set) exists for the course's `group_code`. The Preparation page writes that row when the student first settles on a topic (phase 107), so it survives refresh, other devices and sessions; no browser flag. Per course `group_code`, so several courses / papers / levels are independent (a new paper of an already-studied course counts as started).

## 3. Frontend
`hooks/course/useCourseHome.ts` → `courseHome(groupCode, query?)`: Target when `learning_started` and the Cutoff Meter capability (Target) is on, else Preparation (also while the course list loads or for a just-bought course → previous behaviour, nothing can dead-end). `["my-courses"]` is refreshed after the first position is saved (phase 107), so the very next entry point already says Target.

## 4. Entry points switched
Learn: My Course card Continue (active card + carousel cards, `MyCoursesWrapTwo`), `ResumeBar`, `NextMilestone`, `TodayGoals`; Profile → `SubscriptionWrap` View; `payment/success` page and `payment-success-modal`; `payment/initiated` (back-fallback and "already active" redirect); `edit-course-modal` continue; `buy-sigle-course-modal` (new paper of a started course → Target); Practice Test exits (`PracticeTestPage`, `PracticeTestFlagGate`). Unchanged on purpose: onboarding `LevelChoiceStep` (new account), Target's own redirect-to-Preparation when the meter is off / not found, `PageSwitchTab`, Target plan links.

## 5. Files
Backend: `app/Repositories/CourseRepository.php`. Frontend: `hooks/course/useCourseHome.ts` (new), `lib/dashboard/learning.ts` (type), and the entry-point files listed in §4.

## 6. Verification
Real local app + backend (user 16404, 7 courses; `learning_started` from GET /v2/get-my-active-courses: true for HPTET, HTET, REET, CTET, MAHATET; false for UPTET, UTET).
| Check | Result |
|---|---|
| Learn card Continue — started courses (HTET, HPTET, CTET, MAHATET) | → /target/<code>, stable (PASS) |
| Learn card Continue — first-time course (UPTET) | → /preparation/<code> (PASS); within seconds of Preparation settling on a topic the saved row flips `learning_started` to true, the next Continue → /target (PASS). UTET control stayed false |
| Start Today's Goals, Complete next milestone, bottom ResumeBar, Edit → Save and Continue Learning (HTET) | → /target/6ae2df67cd86b (PASS) |
| Inside the course: Target → Course tab stays on Preparation 5.5 s; Tests tab; Target plan Learn row → /preparation?section&chapter&topic stable; Target tab back | PASS (no loops) |
| Direct URLs: /preparation/<started> hard load + F5 stay on Preparation; /target/<first-time> renders locked Target, no redirect | PASS |
| Profile → Subscriptions View: both rows are expired courses not in the active list → Preparation fallback (as designed) | fallback PASS; started-course case not testable |
Console errors: none from the app. Not verified: mobile 390 px and Hindi passes, REET card, payment-success flow (needs a real payment), edit-modal for a first-time course, DB-level comparison (API only), one unexplained one-time /target → /preparation → /target flip seen once by the test agent while a stray second tab was open (not reproduced in 4 clean repeats).
Observed, not caused by this phase: once, a hard load of /target/<code> in the Playwright context bounced to clearcutoff.in → app.clearcutoff.in/dashboard (the context also held production cookies); the other hard loads stayed on localhost. Worth a separate look at the hard-load auth check.
Decision note: a course counts as "started" as soon as the Preparation page auto-selects its first topic and saves the position (that is the server record asked for) — not only after an explicit student action.
