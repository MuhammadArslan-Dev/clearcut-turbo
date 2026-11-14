# Phase 105 — Target "Today's Goals" + Learn page real data (AUDIT, plan awaiting review)

Branch: `fix/target-learn-real-data` (no code changed yet). Date: 2026-11-12.

## 1. Ask
1. Target page: restore the middle "Today's Goals" section with real completion state for videos, notes and mini tests.
2. Learn page: every widget (Visits, Today's Goal, Next Milestone, Streak, …) must run on real backend data, update when an activity/test is completed, and stay in sync with the rest of the app. No invented metrics.

## 2. Audit findings (read from code + local DB `clearcut`, 2026-11-12)

| # | Where | Finding | Evidence |
|---|---|---|---|
| F1 | Target page | **There is no "Today's Goals" section and never was** on the Target page. `git log -S` finds no goals code in `features/target` (page = MeterCard → TodayPlan → MarksBreakdown). The only "Today's Goals" is the Learn-page widget `ui/widgets/todaygoals/TodayGoals.tsx`. The screenshot/spec for the Target version was not attached. | `TargetPage.tsx:395-430`, git history |
| F2 | Goals data | `GET /v2/interactions` counts **distinct topics today** per type (`video_watched`, `notes_taken`, `mini_quiz_taken`); target `2` each is hardcoded in the controller AND in the client (`videoCount: 2`). It is **per user, not per course**, while the Learn card is per focused course. | `UserLearningInteractionController::index`, `TodayGoals.tsx:25-44` |
| F3 | Goals UI | `Estimated 20–30 min` hardcoded; shows `undefined / undefined` when a goal is missing; error state is a bare English `Failed to load goals`; the CTA always opens Preparation (not the next pending activity). | `TodayGoals.tsx:86-131` |
| F4 | Goals writers | Only 3 writers: VideoWrapper (`video_watched`), Content (`notes_taken`), MiniTest (`mini_quiz_taken`). Daily/chapter/sectional/practice/full tests never count toward "mini tests". Local DB: last `video_watched` row is 2026-09-23 (may be local data only — **not verified in production**). | grep `createLearningInteraction`, SQL |
| F5 | Next Milestone | `const count = 2` is **fabricated** ("2 chapters away from {exam}") — no data behind it. No backend endpoint exists for it. | `NextMilestone.tsx:37` |
| F6 | Visits | **No "Visits" metric exists** anywhere in the dashboard code, messages or backend routes. Not inventing it. | grep `visit` |
| F7 | Streak (real bug) | Writes go to `now($user->timezone ?? 'UTC')`, but `users` has **no `timezone` column** → always UTC date. Reads use `Carbon::today()` = `Asia/Kolkata` (config/app.php). Learning between 00:00–05:30 IST is saved on yesterday's date → today's ring / streak wrong for every IST user in that window. | `StreakController::logMinutes` vs `::index`, `SHOW COLUMNS FROM users` |
| F8 | Streak | `required_minutes = 10` hardcoded in the controller; `longestStreak()` returns an exception **string** on failure; `Failed to load streak` hardcoded English; query `learning-streak` is never invalidated (5 min stale) so a finished test doesn't move it. | `StreakController`, `LearningStreak.tsx` |

## 2b. Decisions (user, 2026-11-12)
- Target "Today's Goals" = the **Today's plan** card shown in the supplied screenshot (rows + n/N + Start button). It already existed; it vanished whenever the plan was empty (`if (!plan.length) return null`) → now always rendered, with an empty message.
- Next Milestone = next 25/50/75/100 % of the course's chapters (`chapters_completed / chapters_total`).
- Visits = days of the current month (IST) with recorded learning time (`active_days_this_month`, shown under Longest streak).

## 2c. Implemented
- `lib/dashboard/milestone.ts` (pure rule), `NextMilestone.tsx` (real progress, loading/empty/complete states).
- `TodayGoals.tsx`: subtitle = "N of M goals done today" (the hardcoded 20-30 min is gone), done goals get a tick, a missing goal never renders `undefined / undefined`, i18n error.
- `TargetPage.tsx`: Today's plan card never disappears (`target.planEmpty`).
- `LearningStreak.tsx`: i18n error, active-days line; `StreakController`: IST date on write (F7), `active_days_this_month`, `longestStreak` fallback `0`.
- `invalidateCutoffMeterQueries` now also refetches `today-goals`, `learning-streak`, `courses-progress-summary` after every test submit.
- Not changed (needs a decision): goals are per user not per course (F2), only mini tests count toward the mini-test goal (F4), `required_minutes = 10` still a controller constant (F8), notes completion has no plan action type.

## 3. Original plan (superseded by 2b/2c)
- **Backend:** one `GoalsService` owning the daily targets (config, not literals) and IST day boundaries; `/v2/interactions` returns `target`, `completed`, `done` per goal (+ optional per-activity list); fix F7 by writing the IST date; fix F8 return types; streak response keeps its shape (additive only).
- **Frontend:** `TodayGoals` becomes presentational + reused on Target (same query key `["today-goals"]`, so both pages stay in sync); real states (done tick, pending actionable, loading, error, empty/new user); invalidate `today-goals`, `learning-streak`, `cutoff-meter` from every submit/complete path; i18n en/hi/mr; no new colours.
- **Verification (real env only):** real token, real DB; new user, active user, completed day, midnight-IST boundary, double tap/retry request counts, hi/mr 390px, numbers vs SQL; "Not verified:" list.

## 4. Decisions needed (blocking)
1. What is "Today's Goals" on Target — the same 3 count-based goals as Learn, or the activities in today's plan?
2. What does "Next Milestone" mean in business terms (needs a real rule, not "2 chapters")?
3. What is "Visits"?
