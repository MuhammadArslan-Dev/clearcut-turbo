# Phase 122 — A/B: "Finish setup" dashboard for learners with an exam but no level (GrowthBook + Amplitude)

**Tickets:** (new, from user) — design: `Exam-Add-Prototype.html` (tab 2 "Prototype", mode "Proposed")
**Repos:** CM (apps/dashboard) · GrowthBook (flag + draft rule) · no backend change
**Branch:** `feature/122-setup-first-dashboard-experiment` — merged to main 2026-11-21 (user go-ahead)
**Created / start date:** 2026-11-21
**Status:** In Review — built + verified locally, merged/pushed to main 2026-11-21; next: GrowthBook flag (50/50, user_id), then 1-week results report from Amplitude

---

## 1. Problem / objective
After onboarding, the learner is enrolled with **no paper/level** (`stage_id = null`, `ExamStep.tsx:213` enrols with no selections, then `/dashboard?user_type=new`). The dashboard does not guide them to the Select Paper sheet. Per the prototype's investigation (Amplitude, 4–18 Nov): 624 Onboarding Completed vs 564 New Exam Added, so about 10% never pick a paper. Goal: show the prototype's "finish setup" dashboard to these learners as a 50/50 GrowthBook experiment (control = today), and measure in Amplitude whether more of them reach a configured exam and start learning. Fully configured learners must not change at all. Both variants stay live 1–2 weeks; nothing is removed or rolled out without the user's explicit approval after review.

## 2. Scope
- **In (treatment only, behind the flag):**
  1. The Select Paper sheet opens by itself once per enrolment on the dashboard while the active course has no paper ("Do it later" closes it).
  2. The My Courses card in the incomplete state shows the "Setup incomplete" badge, a 3-line checklist (Exam ✓ · Paper · Subject / "not needed for this paper") and one CTA "Select Paper" / "Select Subject · about 1 min" (desktop card + mobile slide).
  3. The Today's Daily Test card says "unlocks after you pick your paper" instead of "- Questions / - Duration", with the button "Finish setup to start" (opens the sheet).
  4. A slim warning banner after the sheet was closed: "Finish setup to start learning" + "Finish setup" (it names the saved paper if one is chosen).
  5. Desktop ResumeBar: "Resume" becomes "Finish setup" (opens the sheet).
  6. Sheet, when opened from this dashboard state in treatment only:
     - an honest step counter (PRT = 1 step);
     - the button reads "Continue" until a pick, then "Continue to Subjects" or "Start Learning";
     - all subject groups show at once with "1 of 2 · …" headings, an "x of n chosen" counter, auto-scroll to the next group, and a hint that names the missing group;
     - a "Do it later" link;
     - choices are kept when the sheet closes, and reopening goes to the subject step if a paper is picked;
     - a save error keeps the choices and offers Retry.
- **In (both variants):** analytics for the setup step (section 3, step 6) so control is measurable too. The tracking is the same in both variants.
- **Out:**
  - Trial starts after setup (backend, D3).
  - Renaming "Optional subject" or making it optional (data, D4).
  - The n8n win-back push.
  - TodayGoals / QuickRevision / NextMilestone widgets (unchanged in both variants).
  - The Practice Test prompt after saving (unchanged; it has its own experiment).
  - Onboarding screens themselves (unchanged).
  - The desktop Modal scroll fix: already on main (`c29d129`, `Modal.tsx:62,83`), so it applies to both variants and is not part of the test.
  - Landing / blog / RN app code.

## 3. Implementation plan
1. [x] Read the prototype (both tabs), DEVELOPMENT_RULES §0, §8, §8.1, §10A, and map the code (below).
2. [!] **Baseline on the OLD code** (Sonnet Playwright, local backend, user 16404 + one new local test user via `POST /api/v1/auth/testLogin`):
   - onboarding → incomplete dashboard at 1280 px and 390 px, en + hi;
   - tap every CTA and note the result;
   - sheet cases HTET L1 PRT / L3 PGT / REET Paper 2;
   - one save, with the request counts (`/v1/exam/selectedexam` on single and double tap);
   - the events captured, with ingestion blocked.
   Blocked: the dashboard dev server is not running.
3. [ ] Pure files + unit tests (Vitest, `apps/dashboard/vitest.config.ts`):
   - `components/features/setup-first/setupFirstValue.ts`: `SETUP_FIRST_FLAG = "dash_all_setup_first_202611"`, `SETUP_FIRST_CONTROL = "control"`, `SETUP_FIRST_VARIANT = "setup_first"`, `isSetupFirst(value)` (only the explicit variant turns it on).
   - `lib/onboarding/courseSetup.ts`:
     - `needsLevelSelection(course)` (active trial enrolment with `stage_id == null`), the ONE helper for the eligibility;
     - `setupSteps(levels, paperId)` (1 or 2 steps; PRT = 1);
     - `missingGroup(groups, picks)`;
     - the auto-open-once storage key per enrolment uuid.
   - Tests cover null, undefined, 0-level, 1-leaf and multi-group exams, configured, expired, active (paid) with null stage, and unknown variant values.
4. [ ] Hook `useSetupFirst()` → `useExperimentValue(SETUP_FIRST_FLAG, SETUP_FIRST_CONTROL, enabled)`, where `enabled = needsLevelSelection(activeCourse)`.
   - It is mounted only inside the incomplete-state elements, keyed by `user.uuid`. So a configured learner never evaluates the flag and never gets `$exposure` (10A.9).
   - Keep the layout `invisible` while `ready` is false; no flicker; every failure is control.
5. [ ] UI, reusing `MyCourseCard`/`CourseSlideCard`, `DailyTestWidget`, `ResumeBar`, `BuySigleCourseModal`, `@clearcut/ui` `Button`/`Chip` and existing tokens (no new colours). The treatment UI lives in small new components (`SetupChecklist`, `SetupBanner`) plus a `variant`/`source` passed through `useCourseStore.open(mode, exam, source)`. The sheet's other callers (payment layout, `CoursesList`, change paper) keep today's behaviour.
6. [ ] Analytics. Rule §10A.6: reuse events, add properties. Existing:
   - assignment + exposure: `$exposure {flag_key, variant}` + user property `exp_dash_all_setup_first_202611`, from the package;
   - onboarding progression: `Onboarding Started / Step Completed / Completed`, unchanged;
   - completion: `New Exam Added` + new properties `setup_source` (`auto_open | course_card | daily_test | banner | resume_bar | other`), `setup_variant`, `time_since_enrolment_s`;
   - downstream: `Content Started`, `Test Started` (practice/daily), `Payment Initiated`.

   Gaps (no event today for the sheet or CTA taps), proposed in D1:
   - reuse the **defined-but-never-fired** `Exam Details Selection Started` (sheet opened) and `Exam Details Selection Completed` (paper or subject step completed, with `step`, `paper_name`);
   - add one new event, `Setup Sheet Closed` {`last_step`, `had_paper`, `source`};
   - add property `setup_cta` on the existing open path.

   All of this is sent in BOTH variants with `experiment_variant` attached when the learner is exposed.
7. [ ] i18n en/hi/mr for every new string (`messages/{en,hi,mr}.json` `myCourses.setup.*`, `modals.json` `buySingleCourseModal.*`, `dailyTests.json` `widget.locked*`), typed in `en.d.json.ts`.
8. [ ] GrowthBook (with the user logged in, browser):
   - flag `dash_all_setup_first_202611`, String, default `control`, **production OFF**;
   - experiment rule 50/50, hash attribute `user_id`, as an **unpublished draft**.
   The user starts it (10A.8).
9. [ ] Verify (section 8), report, then the user decides on merge/push. After 1–2 weeks: a results report from Amplitude; no removal of either flow until approved.

**Code map (from the investigation):**
- Eligibility signal: inline `!stage_id` in about 10 places, e.g.:
  - `MyCoursesWrapTwo.tsx:125,170,183,249,308-320,332,392-402`
  - `ResumeBar.tsx:132`
  - `DailyTestWidget.tsx:61`
  - `TodayGoals.tsx:76`
  - `quick-revision.tsx:36`
  - `NextMilestone.tsx:51`
  - payment `success/page.tsx:152` and `initiated/page.tsx:190`
- Sheet: `buy-sigle-course-modal.tsx`:
  - steps `:109-125`, single-paper auto-pick `:147-153`;
  - save `:189-314` (`purchaseLevels` → `POST /v1/exam/selectedexam`, "New Exam Added" `:232`);
  - practice prompt `:253`, `:595`.
- Desktop/mobile:
  - `MyCourseCard` (desktop) and `CourseSlideCard` Swiper (mobile);
  - ResumeBar is desktop-only (`hidden md:flex`, `ResumeBar.tsx:162`).
- GrowthBook pattern: `practiceSkipValue.ts` + `usePracticeSkip.ts` + read-while-open (`PracticeTestPromptSheet`).

## 4. Progress / completed changes
- 2026-11-21: investigation and code map done, phase doc written, branch created. No product code changed.
- 2026-11-21: user decided the eligibility rule (§5). Added `components/features/setup-first/setupFirstValue.ts` (flag, `isSetupFirst`, `needsFirstSetup`) + `setupFirstValue.test.ts` (7 tests, passing).
- 2026-11-21: user: 50/50 A/B, all recommended defaults (D1, D3 keep today's trial pill, D4 "Second subject" in treatment, D6 no new test dependency, D7 14 days).
- 2026-11-21: implemented the variant + both-variant tracking:
  - New files: `setup-first/useSetupFirstStore.ts`, `SetupFirstGate.tsx`, `SetupChecklist.tsx`, `SetupBanner.tsx`.
  - Wired into `LearnPage.tsx`, `MyCoursesWrapTwo.tsx`, `MyCourseCard.tsx` (optional props, default unchanged), `DailyTestWidget.tsx`, `ResumeBar.tsx`, `buy-sigle-course-modal.tsx`.
  - Events: `events/onboarding.ts` (+ `Setup Sheet Closed`), `events/exam.ts`, catalog.
  - en/hi/mr strings.
  - Local QA: localStorage `cc-setup-first-variant=setup_first` (dev builds only).
- 2026-11-21: process mistake: coding started before the prototype was opened visually (only its source was read). Afterwards I compared the prototype and the implementation side by side (desktop + 390 px) and fixed:
  - banner/badge colour (prototype orange = `--color-warning`, not `-strong`);
  - single subject group heading "Pick your subject";
  - "about 1 min" as a smaller suffix.

  Remaining differences, all deliberate or open:
  - the trial pill stays today's (D3);
  - the prototype has a bottom bar on mobile, but the live ResumeBar is desktop-only, so none was added;
  - the prototype shows no widgets below the two cards (Today's Goals, Next Milestone, …): open question D8;
  - REET-style dependent subject groups cannot all show at once (each group is a child of the previous pick), so the variant reveals the next group with auto-scroll + "x of n chosen" instead.
- 2026-11-21: D8 answered (user): in the variant, hide Today's Goals / Next Milestone / countdown / Quick Revision / Streak / App download until setup is done. Done in `LearnPage.tsx` (`hideForSetup`; also hidden while the variant is pending and in the one render before the gate sets eligibility; NOT hidden while courses load, so configured learners see today's page). Checked at 1280 px: only banner, My Courses and Daily Test remain; the auto-open still works (slow dev server: the sheet appeared 3–9 s after load).
- 2026-11-21: user feedback "why is the banner hidden": it only showed on the page view where the sheet was closed, so it disappeared after a reload. Now it shows on every visit once the sheet has been shown for that enrolment (the auto-open mark), until the setup is saved; it is hidden only while the sheet is open. `SetupBanner.tsx` (+ `enrolmentUuid` prop), `wasAutoOpened` exported from `SetupFirstGate.tsx`. Checked: reload with the mark set gives banner shown and no auto-open.
- 2026-11-21: tracking verification (Sonnet Playwright, local, Amplitude ingestion blocked and batches decoded, test account from the user):
  - **Control:** no variant UI; Started(course_card) → Setup Sheet Closed(close), both with `experiment_variant: control`.
  - **Variant:**
    - auto-open → Started(auto_open) → Completed(paper_selection) → Setup Sheet Closed(do_it_later, had_paper);
    - the banner names the kept paper; widgets are hidden;
    - reload keeps the banner and does not auto-open;
    - double-tap on Start Learning sends **exactly 1** POST `/v1/exam/selectedexam`;
    - Completed(subject_selection) + New Exam Added carry `setup_source`, `first_setup`, `time_since_enrolment_s` (1400) and the experiment props;
    - after the save the dashboard is today's normal one (no setup UI, widgets back);
    - no `$exposure` locally (GrowthBook is off on localhost, as expected).
  - hi/mr at 390 on the configured dashboard: no raw keys.

  Fixed after the run:
  1. The kept paper was lost on reload (it was in memory only). It is now kept in localStorage `cc-setup-first-draft:<examId>`, restored by the gate, and cleared on save.
  2. `Exam Details Selection Started` said step 1 when the sheet reopened on the subject step. It now says step 2 / subject_selection.
  3. The single-group hint said "Pick your Optional subject". It now says "Pick your subject to continue" (`pickSubjectHint`, en/hi/mr).

  Kept as is: `New Exam Added.source` stays `my_courses_dropdown` (old property, existing charts); `setup_source` is the new one.
- 2026-11-21: baseline Playwright run attempted. It stopped because the dashboard dev server is not running on localhost (the backend answers, and the testLogin route exists). Nothing was created in the DB.

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-21 | Who sees the new flow? | A learner sees the new design only while NO enrolment of theirs has a level/paper. Once they pick any paper/level of their first exam (preparation page has data), they get today's flow for good, also when they later add another exam without a paper. That covers both new learners and older ones still stuck without a level. (user) → `needsFirstSetup()` in `setupFirstValue.ts`. This also answers D2 (auto-open for every eligible learner, once per enrolment) and D5 (any status). |
| 2026-11-21 | 🛑 D1 Tracking: §10A.6 says "add no new event for an experiment". Approve reusing `Exam Details Selection Started/Completed` + ONE new event `Setup Sheet Closed` + new properties on `New Exam Added`? | open |
| 2026-11-21 | 🛑 D2 Auto-open: once per enrolment for every learner whose active course has no paper (also the ~10% stuck from before), or only right after onboarding (`?user_type=new`)? Recommended: once per enrolment. | open |
| 2026-11-21 | 🛑 D3 Prototype copy "Free trial starts after you pick your paper" is false today (the trial already runs). Keep today's trial pill in both variants (recommended), or a backend change first? | open |
| 2026-11-21 | 🛑 D4 "Optional subject" that is actually required (REET Paper 2): rename the heading in treatment to "Second subject" (frontend, treatment only), or leave the data name? | open |
| 2026-11-21 | 🛑 D5 Eligibility: only `status = trial` with no paper (recommended), or also paid/expired enrolments with no paper? | open |
| 2026-11-21 | 🛑 D6 Automated tests: Vitest unit tests for the pure logic + scripted Playwright (MCP, Sonnet) runs (recommended, no new dependency), or add `@playwright/test` e2e specs to the repo (new dev dependency + CI change)? | open |
| 2026-11-21 | 🛑 D7 Duration/stop rule: 14 days (recommended) and the primary metric = exposed learners with `New Exam Added` within 24 h. See the sample-size note in §6. | open |

## 6. Blockers / risks
- Baseline blocked: start the dashboard dev server (`pnpm --filter dashboard dev`) and share the port.
- **Sample size:**
  - About 45 Onboarding Completed a day, with a 90% baseline.
  - Detecting 90% → 95% needs about 430 learners per arm, roughly 19 days.
  - 14 days can only reliably detect about a 6–7 point lift.
  - The secondary metrics (time to set up, first test within 3 days) help.
- **Two experiments in a row:**
  - After saving, the Practice Test prompt (`dash_all_practice_skip_202611`) can show. The assignments are independent (different flags, same `user_id` hash), so it is balanced in expectation, but the interaction is untested (10A.5).
  - The `onboarding_level_step` Amplitude flag (OFF) would bypass this state entirely. Keep it OFF during the test.
- **Shared sheet:** `BuySigleCourseModal` is also mounted in the payment layout and `CoursesList`. The treatment behaviour must switch on only from the incomplete-dashboard entry points. All other callers are regression-checked.
- **Mobile:** ResumeBar is desktop-only. The mobile equivalents are the course slide + Daily Test card + banner.
- Exams with **zero levels** keep the learner stuck today (empty list, disabled button). They are excluded from treatment (control) and noted as a separate bug.
- Practical stickiness: GrowthBook hashing on `user_id` gives the same variant on every device and session. A rule edit or a re-randomise in GrowthBook would reshuffle learners: do not edit the running rule.

## 7. Dependencies / packages added
None planned (GrowthBook + `@clearcut/experiments` already in place; D6 would add `@playwright/test` only if chosen). New GrowthBook flag `dash_all_setup_first_202611`. No env vars, no migration.

## 8. Tests and verification
- [ ] Baseline measured on the OLD code (blocked, see §3 step 2)
- [ ] Unit tests: value file, eligibility, step count, missing group, auto-open-once
- [ ] Browser (Sonnet Playwright), real local backend. Cases:
  - flag absent = control;
  - forced treatment;
  - configured learner gets no exposure and no change;
  - incomplete learner in both variants;
  - PRT / PGT / REET P2;
  - close and reopen keeps the choices;
  - save error + Retry gives +1 request;
  - double tap gives 1 POST;
  - auto-open only once;
  - a second account on the same browser;
  - hi + mr at 390 px and desktop;
  - one `$exposure` per page view;
  - events with the properties, ingestion blocked.
- [ ] tsc vs baseline, eslint, `pnpm check:colors`, dashboard build
- [ ] Break-it pass (DEVELOPMENT_RULES §8.1)
- [ ] **Not verified:** (filled after implementation)

## 9. Next steps
User: start the dashboard dev server, review this plan, answer D1–D7. Then: run the baseline, implement steps 3–7, verify, and stop before merge/push and before starting the experiment in GrowthBook.
