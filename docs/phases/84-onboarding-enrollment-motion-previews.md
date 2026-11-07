# Phase 84 — Onboarding + Enrollment animations adapted to the real screens (Motion Library previews only)

**Tickets:** (new, from user)
**Repos:** CM (`packages/motion`, `apps/dashboard` preview route only)
**Branch:** local on `feature/practice-test-flag` working tree — not committed, not pushed
**Created / start date:** 2026-11-07
**Status:** In Review — both previews built and checked locally (not committed); nothing touches the real onboarding / enrollment screens

---

## 1. Problem / objective
The approved `OnboardingComplete` and `EnrollSuccess` animations (phase 79) look generic: the user says they do not reflect the real onboarding and exam-enrollment screens. Rebuild both so they follow the real screens, flow and data (same approach as the Mini Test tab), and make them previewable in the Motion Library gallery. Keep the approved motion quality (drop/hop, confetti, ticking steps, curtain, chip flight, stamp, zoom). **Do not wire anything into the real onboarding / enrollment screens.**

## 2. What the real flows are (read from the code, 2026-11-07)
**Onboarding** (`features/onboarding/OnboardingWizard` → `/onboarding`): 2 steps, indicator "1/2", "2/2".
1. `LanguageStep` — "Welcome to" + Clear Cutoff logo, "Choose **Language**" / "You can change this anytime.", three `OptionSelectionCard`s (हिंदी / English / मराठी, circle icon + radio/check), `MainButton` "Continue".
2. `ExamStep` — `StepIndicatorCard` (back button, "2/2" chip + two bars), "Select **Exam**", state filter chips, `Card` per exam ("HTET Exam" / "Haryana (State)" + radio/check), `MainButton` Continue (+ rotating badge Videos / Notes / PDFs / Tests). Continue calls `enrolledToCourse` then `router.replace("/dashboard?user_type=new")`.
The old animation's chips ("Hindi medium", "20 min a day") and "Building your exam plan / daily test" steps do not exist in the real flow (the Level step is commented out, there is no study-time question).

**Exam enrollment** (`modals/course/buy-sigle-course/buy-sigle-course-modal.tsx`, bottom sheet on phones, modal from md): `StepIndicatorCard` + 2 steps.
1. "Select **Paper**" — "Select paper for HTET Exam" / "You can change or add anytime", paper `OptionSelectionCard`s (name + detail); skipped when there is a single paper. Button "Continue to Subjects".
2. "Select **Subjects**" — one group per level ("Select any one option"), one pick per group (NOT multi-select), button "Start Learning" (`ShimmerButton`).
Then `purchaseLevels` → optional practice-test sheet (Amplitude flag) → `/preparation/{group_code}?subject_selected=1`.
The old animation's "subjects fly in" (4-6 free picks) and "7-day study plan" do not exist; the real selection is a path (Paper → one option per group) and the next screen is Preparation.

## 3. Design
- **`OnboardingComplete` (library, redesigned):** continues from the Exam step. The user's two real choices appear as the app's own selected option cards (white, brand border, primary-subtle fill, check), not pills: language card (circle icon + name) and exam card ("HTET Exam" + "Haryana (State)"). Brand logo slot + highlighted headline word (same blue highlight as the app headings). Loading steps rewritten to what really happens (save exam → set up courses → open dashboard); the last waits for `ready`. Same timeline, easings, Nibbu drop/hop, confetti, curtain.
- **`EnrollSuccess` (library, redesigned):** user feedback 2026-11-07: make it the same animation as onboarding. It is now a thin wrapper over `OnboardingComplete` (same mascot, motion, timing, curtain) with enrolment copy, the user's selection path (Paper + one option per group) as selected option cards, steps "Adding your subjects / Building your syllabus / Opening your Preparation page" (last waits for `ready`), and `fit="parent"` so it plays inside the sheet / modal. A first card-flight + course-card version was built and dropped.
- **Preview:** two new gallery tabs content (slots, like Mini test). Each shows the app's own screens (real `OptionSelectionCard`, `Card`, `StepIndicatorCard`, `MainButton`, `ShimmerButton`, `highlightTextUtil`, real i18n keys) in an `<iframe>` so phone/desktop breakpoints and `fixed` positioning are true to the real app; controls: Phone / Desktop, English / हिंदी (route locale), data speed, Replay, 0.5x. Demo routes `/animation-preview/demo/{onboarding|enrollment}` follow the same dev/QA-only guard.

## 4. Scope
- **In:** `packages/motion/src/{onboarding,enrollment,preview}`, `apps/dashboard/src/components/features/motion-preview/*`, `apps/dashboard/src/app/[locale]/(public-pages)/animation-preview/**`, docs.
- **Out:** real onboarding / enrollment screens, stores, analytics, API, i18n message files, any other app. No push.

## 5. Implementation plan
- [x] 1. Library: `OnboardingComplete` redesign (props: `summary` items, `logo`, `progress`, `fit`, copy overrides).
- [x] 2. Library: `EnrollSuccess` redesign (wrapper over `OnboardingComplete`).
- [x] 3. Dashboard demo components + mock Dashboard / Preparation screens.
- [x] 4. Demo routes + gallery slots (iframe, device / language / speed / replay).
- [~] 5. Verify: tsc, eslint, check:colors done; Playwright phone + desktop done for both flows; reduced motion / slow network / real phones pending.
- [x] 6. Docs: package READMEs, phase README row.

## 6. Progress / completed changes
- 2026-11-07: phase doc created after reading the real onboarding and enrollment code.
- 2026-11-07: library: `packages/motion/src/onboarding/{OnboardingComplete.tsx,onboarding.module.css,index.ts}` (selected-option cards, logo, progress strip, `fit`, copy overrides); `packages/motion/src/enrollment/{EnrollSuccess.tsx,index.ts}` (wrapper; `enroll.module.css` removed); `packages/motion/src/preview/MotionPreview.tsx` (slots for the two tabs, old generic panels kept as fallback), `screens.tsx` (new prop name).
- 2026-11-07: dashboard (preview only): `components/features/motion-preview/{FlowFrame,DemoHost,OnboardingDemo,EnrollmentDemo,MockScreens}.tsx`, route `app/[locale]/(public-pages)/animation-preview/demo/[flow]/page.tsx`, `animation-preview/page.tsx` slots. Real onboarding / enrollment files untouched.

## 6b. Onboarding applied to the real flow (2026-11-07, user request: "onboarding wala real pr apply kro")
- `ExamStep.handleEnroll`: after `enrolledToCourse` succeeds, `useOnboardingCelebrationStore.start({ languageCode, examShortName, examState, examType })`, then the same `router.replace("/dashboard?user_type=new")` as before. Analytics and the API call are unchanged.
- `OnboardingCelebrationHost` is mounted once in `app/[locale]/layout.tsx` (so it survives the route change) and lazy-loads `OnboardingCelebration` only when the store is set. `OnboardingCelebration` = library `OnboardingComplete` with the real language + exam cards; `ready` = the my-courses query (`useMyActiveCourses`, invalidated first) has finished, with a 15 s safety so the learner is never trapped. The curtain then lifts over the real dashboard.
- Revert: `NEXT_PUBLIC_LEGACY_ONBOARDING=true` + rebuild (the exam step goes back to the plain redirect, no other change).
- Files: `store/onboarding/useOnboardingCelebrationStore.ts`, `components/features/onboarding/{OnboardingCelebration,OnboardingCelebrationHost}.tsx`, `steps/ExamStep.tsx`, `app/[locale]/layout.tsx`.
- Tested on localhost with mocked backend (exams, auth-user, enrollment create, my-courses delayed 2.5 s): real language step -> exam step -> Continue -> animation over the dashboard -> curtain -> dashboard (390x844). Not tested: real backend, desktop, Hindi on the real route, real phones, reduced motion.
- Update 2026-11-07 (user request): the animation now starts the moment Continue is tapped (optimistic); the enrolment request still goes to the backend in parallel (needed to enrol the learner). The animation cannot finish before the request succeeds (`enrolled` flag in the store); on a failed request or a 40 s timeout it is removed and the exam step shows an inline error (`modals.buySingleCourseModal.error.generic|network`, existing en/hi/mr copy) with Continue enabled for a retry; non-network failures go to Sentry via `logger`. Tested (mocked backend): slow success (animation visible at 0.7 s, then dashboard), HTTP 500 (overlay gone, error shown, stays on /onboarding), aborted network (network message).

- Enrollment animation is NOT applied to the real enrollment modal yet.

## 6c. Enrollment animation applied to the real enrolment modal (2026-11-07, user request)
- `buy-sigle-course-modal.tsx` `handlePurchase`: on "Start Learning" the animation starts at once (`useEnrollCelebrationStore.start`), `purchaseLevels` still runs (40 s cap), then `markEnrolled("/preparation")` right before the existing `close()` + `router.push(...)`, or `markEnrolled()` when the practice-test sheet is shown (it opens under the animation and is revealed when the curtain lifts). Failure (non-success status, error, timeout) -> `cancel()` + the modal's existing inline error. All other logic (analytics, invalidate, practice-test flag) unchanged.
- `EnrollCelebrationHost` (locale layout, lazy) -> `EnrollCelebration` -> library `EnrollSuccess` (ticket + stamp, then the selected paper/options as cards, steps, curtain). `ready` = enrolled + on `/preparation` + no query running for 700 ms (15 s safety).
- Revert: `NEXT_PUBLIC_LEGACY_ENROLL_ANIMATION=true` + rebuild.
- Files: `store/course/useEnrollCelebrationStore.ts`, `components/modals/course/buy-sigle-course/{EnrollCelebration,EnrollCelebrationHost,buy-sigle-course-modal}.tsx`, `app/[locale]/layout.tsx`.
- Tested on localhost (mocked levels + selectedexam, real exam list): animation at 0.8 s on tap; failure (HTTP 500) removes it and shows the modal error with the sheet intact; success navigates to /preparation/g1 and the overlay lifts (preparation page itself 500s locally because the course is mocked). Not tested: practice-test sheet path (Amplitude flag), real backend, desktop modal, Hindi, real phones.

## 7. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-07 | Mock data for papers / subjects | Sample HTET-style data in the preview only (real data needs a backend); labelled as sample (Claude) |

## 8. Blockers / risks
- Local backend session in Playwright has no real data, so the screens are mirrored with sample data; real screens were read from code, not screenshots.
- Library colours stay the approved artwork values; app tokens used where the real UI uses them (`--color-brand`, `--color-primary-subtle`).

## 9. Dependencies / packages added
None.

## 10. Tests and verification
- [x] `tsc` (dashboard, motion), eslint (touched dashboard files), `pnpm check:colors` (no new colours)
- [x] Playwright (localhost:3000): onboarding demo phone 390x844 EN and desktop 1280 HI; enrollment demo phone and desktop inside the gallery iframe; hand-over screens render.
- [ ] Slow network, reduced motion, Marathi, 360x640 short phone, real devices
