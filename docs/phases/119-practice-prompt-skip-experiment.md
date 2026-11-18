# Phase 119 — A/B test: Skip vs no Skip on the first-enrolment Practice Test prompt (GrowthBook + Amplitude)

**Tickets:** (new, from the client via the user, no Jira key yet)
**Repos:** CM (`apps/dashboard`, `packages/experiments`) · GrowthBook (flag, no code repo)
**Branch:** `feat/practice-skip-experiment` (from main 944aeed) — not committed, not pushed
**Created / start date:** 2026-11-18
**Status:** In Progress — current behaviour read and run locally (section 4), plan below; implementation follows on this branch. Nothing is live: the GrowthBook flag will be created with production OFF so deploying this changes nothing for any learner.

> Builds on phase 118 (GrowthBook + Amplitude experiments, server payload, webhook), phase 57 (first-enrolment Practice Test) and phase 72 (Amplitude flag `practice_test`).

---

## 1. Problem / objective
After a learner enrols in an exam and saves their subjects, a full-screen (phone) / centred (desktop) prompt asks "Take a Quick Practice Test?" with **Take Practice Test** and **Skip, go to Preparation**. The client wants to know whether **removing the Skip option** makes more learners take (and finish) the test and what it does to what comes after (reaching Preparation, retention, purchase). So: an A/B experiment, controlled from GrowthBook (no deploy), measured in Amplitude, and **flag OFF = exactly today's behaviour**.

## 2. Scope
- **In:** one GrowthBook String flag `dash_all_practice_skip_202611` (`skip` = control = today, `no_skip` = variant); the prompt hides Skip and uses a body text without "You can skip it…" for `no_skip`; the in-test skip controls (topbar "Skip Test & Go to Preparation", sidebar "Skip Practice Test" card) are hidden for `no_skip` too; exposure to Amplitude when the prompt actually opens; en/hi/mr copy; tests; docs.
- **Out (not doing):** the Amplitude flag `practice_test` (it still switches the whole test on/off, untouched); the backend (no change: `offered` / `skipped` / `completed` states stay); the Practice Test questions, scoring or result screens; the error screen's "Go to Preparation" (kept in both variants: it is the only way out when the test cannot load); the Topic/Mini test; per-exam targeting; a way back for learners who skipped (phase 57's open question).

## 3. Implementation plan
- [x] `practiceSkipValue.ts` (+ test): flag key constant, `allowSkipFromValue(value)` (`"no_skip"` → false, anything else → true: every error path keeps Skip). `usePracticeSkip()` hook returns `{ allowSkip, ready }`.
- [x] `PracticeTestPromptSheet`: split into the open/closed shell and a `PromptContent` rendered ONLY while the prompt is open; it owns the hook, so `$exposure` is sent when the prompt opens, not when `PreparationShell` / the enrolment modal merely mount it (closed) on every page. Body text and buttons keep their space (`invisible`) until the answer is known (no flicker); `no_skip` does not render Skip and uses `prompt.bodyNoSkip`.
- [x] `PracticeTestPage`: for `no_skip` the topbar skip and the sidebar skip card are not rendered (the empty sidebar column keeps its width, so the question card and the pinned footer do not move). The error screen's "Go to Preparation" is kept.
- [x] i18n: `PracticeTest.prompt.bodyNoSkip` in `messages/{en,hi,mr}/practiceTest.json` (the existing body without its last sentence, so no new translation).
- [x] `<ExperimentsPayload />` once in the locale layout (every dashboard route gets the GrowthBook payload from the server: first view already right, 0 browser requests); removed from `/growthbook-test`.
- [x] `@clearcut/experiments` `fetchFeaturesPayload`: **failure cooldown** (30 s per server instance). The payload is now asked for by the layout of every dashboard page, so without it a GrowthBook outage with nothing cached yet would add the 1.5 s timeout to every page.
- [x] GrowthBook: identifier `user_id` created (SDK Configuration > Attributes); flag `dash_all_practice_skip_202611` (String, default `skip`) created with **production OFF** (Revision 1, live, in no payload); Revision 2 = a **draft** with the Experiment rule "Practice test prompt: Skip vs no Skip" (split by `user_id`, 100 % of units, `skip` 50 % / `no_skip` 50 %, tracking key = the flag key), NOT published.
- [x] Verify (section 8), docs.
- Dropped: a `track: false` read for the in-test page. GrowthBook marks a silent evaluation as already tracked, so a later real exposure could be lost; the in-test page reads the flag normally (at most one `$exposure` per page load, same variant, and the analysis uses the first exposure).

## 4. Progress / completed changes
- 2026-11-18 — **Current behaviour read and run locally** (real local backend, user `9988776644` with no exam, dashboard dev server, 390 px):
  - Flow: Exams → HTET "Start 3-day FREE Trial" → Select Paper (Level 1 PRT) → Start Learning → "Setting up your Preparation page" animation → the prompt. Requests after enrolment: Amplitude flag `GET api.lab.amplitude.com/sdk/v2/vardata?flag_keys=practice_test`, `GET /v2/user-state?keys[]=…&course=<code>`, `POST /v2/user-state/practice_test/transition` (offered), `GET /v2/first-practice-test/<code>?count=5` (prefetch). **0 requests to GrowthBook** (nothing mounted an experiment yet).
  - The prompt has Take (filled) + Skip (outlined) and the body says *"…You can skip it and begin preparing right away."* (so the copy changes for `no_skip`). It cannot be dismissed (backdrop / Esc / back do nothing).
  - Two places show it: `BuySigleCourseModal` (right after enrolment) and `PreparationShell` (re-ask while the state is `offered`). Same component, so one change covers both.
  - The Practice Test page has its own skip controls (topbar + sidebar card), an error screen with Retry + "Go to Preparation", and the 3-2-1-Go intro animation has its own "Skip" (skips the countdown only; untouched).
  - Analytics today: no event for the prompt itself; the test sends the test-series events with `test_type: "practice_test"` (phase 72, `lib/analytics/testFunnel.ts`).
- 2026-11-18 — Implemented section 3 on this branch (files: `practice-test/{practiceSkipValue.ts, practiceSkipValue.test.ts, usePracticeSkip.ts, PracticeTestPromptSheet.tsx, PracticeTestPage.tsx}`, `messages/{en,hi,mr}/practiceTest.json`, `app/[locale]/layout.tsx`, `growthbook-test/page.tsx`, `packages/experiments/src/{payload.ts, payload.test.ts}`).

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-18 | What is tested | "skip vs non-skip button" on the practice-test modal shown after enrolment; flag OFF = as today; also tracked in Amplitude (user) |
| 2026-11-18 | Which tool | GrowthBook (CC-192 stack), exposure to Amplitude (user) |
| 2026-11-18 | Naming | `<surface>_<exam|all>_<what>_<yyyymm>` → `dash_all_practice_skip_202611`; values `skip` (control) / `no_skip` (default by me) |
| 2026-11-18 | Assignment | by `user_id` (the users.uuid the app already sends), 50/50, so a learner gets the same prompt on every device and in the re-ask (default by me) |
| 2026-11-18 | 🛑 In-test skip controls | **Default: hidden for `no_skip` too.** Reason: the client said "remove skip in the onboarding test"; with only the prompt's button gone a learner would just skip one screen later and the test would count as started. Metric to read: test **completed** (`Test Submitted`, `test_type = practice_test`), not only started. To restrict the experiment to the prompt, switch one constant. Needs the client's confirmation |
| 2026-11-18 | 🛑 Body text for `no_skip` | **Default: new text without "You can skip it…"** (en/hi/mr). Hindi/Marathi are new translations: have them reviewed |
| 2026-11-18 | Production state at creation | flag created with production OFF, the experiment rule saved as a DRAFT; to start: publish the draft, then switch production ON (default by me) |
| 2026-11-18 | How the result is read | Amplitude: break any funnel down by the user property `exp_dash_all_practice_skip_202611` (`0` = skip/control, `1` = no_skip). Denominator = `$exposure` (flag_key = the flag, sent when the prompt opens); numerators = the existing `Test Started` / `Test Submitted` with `test_type = practice_test`. No new event (analytics rule: reuse) |

## 6. Blockers / risks
- ⚠️ **A learner who cannot skip must still have a way out when something breaks.** Kept: the error screen's "Go to Preparation". A learner who closes the tab mid-test stays `offered` and gets the prompt again on the next Preparation visit (phase 57); in `no_skip` that is a prompt without Skip each time. The client should know this before turning it on.
- ⚠️ **Guardrails to watch in Amplitude** (a forced test can lower early engagement): enrolment → Preparation page reached, `Test Submitted` (practice_test) per exposed learner, Day-1 / Day-7 return, purchase. Decide a stop rule with the client before starting.
- ⚠️ Amplitude flag `practice_test` OFF or unreachable → no prompt, no exposure, nothing changes (correct). Ad-blockers on `api.lab.amplitude.com` already hide the prompt for those users (phase 72).
- ⚠️ Kill switch: GrowthBook flag off reaches visitors in ~3-30 s through the phase 118 webhook (up to 5 min if the webhook is down). A learner who already has the prompt open keeps the variant they saw until they reload.
- ⚠️ A learner on a stale cached user (another login on the same browser) can briefly get the previous user's variant (phase 118 finding); the prompt is keyed by `user.uuid` there.
- ⚠️ **The GrowthBook payload is now asked for by the locale layout (every dashboard route).** It is cached 5 minutes on the server, the first view after a webhook or expiry waits for one request, and a 30 s failure cooldown protects every page from a GrowthBook outage. The payload (a few hundred bytes today, one entry per flag) is part of every page's server HTML.
- ⚠️ Learners already in `offered` state when the experiment starts are assigned at their next prompt (Preparation re-ask), so the first days include learners who enrolled before the start; filter the analysis on exposure.

## 7. Dependencies / packages added
None new. Uses `@clearcut/experiments` (phase 118). GrowthBook flag `dash_all_practice_skip_202611`. No env var, no backend change.

## 8. Tests and verification
- [x] Baseline on the OLD code: section 4 (request list, copy, layout at 390 px).
- [x] Unit tests: `@clearcut/experiments` 46 (3 new for the cooldown), dashboard 57 (4 new for `allowSkipFromValue`). Package and dashboard typecheck: no new errors (dashboard 91 = baseline outside `.next`), eslint clean (one pre-existing warning), `check:colors` clean, `next build --webpack` of the dashboard green (all routes dynamic).
- [x] Real browser, real local backend + dashboard dev server, a mock GrowthBook endpoint (so the real GrowthBook is never touched; the dashboard's cache is dropped with a signed webhook between scenarios), user B at 390 px:
  - **S1 flag absent = control:** prompt with Take + Skip and the old body; 0 `$exposure`.
  - **S2 experiment rule, everybody `no_skip` (UPTET enrolment):** only "Take Practice Test", body without "You can skip it…", exactly **1 `$exposure`** (`flag_key`, `variant: "1"`), user property `exp_…` set, **0 browser requests to GrowthBook** (server payload).
  - **S3 test page, `no_skip`:** mobile and desktop 1440: no topbar skip, empty sidebar column, question card and footer unmoved. The only "Skip" left is the 3-2-1-Go intro's own button (not the test).
  - **S5 Preparation re-ask (state `offered`):** same variant, 1 exposure. **A course already answered (skipped): the closed sheet is mounted, no prompt, 0 exposures.**
  - **S6 flag switched OFF in GrowthBook (webhook):** the next load shows the old prompt (Take + Skip + old body), 0 exposures.
  - **S7 GrowthBook answers 500:** control (Skip) on every visit, no hang, 0 exposures; the server asked once (cooldown), the browser's own fallback request fails and the learner keeps today's prompt.
  - **hi + mr, `no_skip`:** one button, body without the skip sentence, no horizontal overflow.
  - **Double tap on Take:** one navigation. Control "Skip" click: one `transition` POST, as today.
  - **Split:** real SDK on 4000 random uuids with the real rule shape: 50.5 % `no_skip`, the same user in a fresh client (other device / re-ask) always the same value, no `user_id` → control and no tracking.
- [ ] **Not verified:** the real GrowthBook flag on production (it is OFF and the rule is a draft: nothing was started); real Amplitude analysis; FB/IG in-app browser and a real Android phone; **Hindi/Marathi wording** (only the existing sentence was reused, but have the screen reviewed); the experiment on production with real traffic; whether the client wants the in-test skip hidden (decision above).

## 9. Next steps
1. Client decisions (section 5, the two 🛑 rows), a start date and a stop rule.
2. Merge this branch (production deploys on push; nothing changes for learners: the flag is OFF). Then in GrowthBook: publish the draft (Revision 2), switch `production` ON on the flag, watch `$exposure` and the funnel in Amplitude for a day.
3. Keep the kill switch in mind: switching the flag off reaches learners in seconds through the webhook (phase 118).
