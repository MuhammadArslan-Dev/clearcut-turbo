# Phase 99 — Preparation "Target" tab (Cutoff Meter screen)

**Status:** In Progress. Plan approved, D1–D4 answered (2026-11-11); D5 = recommendation.
**Repos:** clearcut-master (dashboard) + clearcutoff-main-backend.
**Reference:** `docs/design-assets/target-tab.png`; spec = Confluence "Cutoff Meter V1" (PM 29360129); motion = `packages/motion/src/meters` (phase 96).

## 1. Problem / objective

The Preparation page has two tabs, **Course** and **Test Series**. Add a third one, **Target**. It opens the reference screen with the student's real data:

1. **Cutoff Meter card:** a gauge "82 of 150 predicted", a zone pill, "8 marks to Clear Zone", and "Range ±6 · Cutoff 90 (General)".
2. **Today's plan:** 3 personalised actions with a checklist, an "0/3" counter, a progress line, "+N marks" chips, and a big "Start: {first action} ›" CTA.
3. **Where your marks come from:** predicted marks per subject (section), shown as bars.

## 2. Audit — what already exists (reuse, don't duplicate)

| Need | Already there | Where |
|---|---|---|
| Gauge + animations (needle spring, band, lock, cool, delta, wobble, confetti) | `Meter` (variant `gauge`) with an imperative handle (`set`, `lock`, `cool`, `delta`, `wobble`); `Nib`; `useFx` | `packages/motion/src/meters/Meter.tsx`, `effects.tsx` |
| Zone colours / gap text / segments | `ZONES`, `zoneOf`, `segments`, `gapText` | `meters/zones.ts` |
| Studio "screen" (meter + actions + subject bars) | `MeterScreen` — but it is driven by **demo** `MeterState` data with hard-coded subjects (`SUBJ`/`SMAX`) and has an app-bar. It is **not reusable as-is**; reuse its pieces (`Meter`, bar styling) instead | `meters/MeterScreen.tsx` |
| Meter value, pass mark, max, confidence, change, **per-section marks** (`section_marks`, `total_marks`, `accuracy`, `marks_lost`) | `GET /v2/cutoff-meter/{course}` → `CutoffMeterService::compute()` → `sections[]` | BE (phase 97) |
| Today's actions (NBA rules 1–4: unlock / full-length due / weak topic learn / section losing marks / check improved / keep sharp) with `title`, `reason_key` + `params`, `est_time_min`, `topic_id` / `test_id`, `section_id`, `clicked` / `completed` | Same endpoint, `actions[]` (from `nba_log`, generated once per IST day) + `POST /v2/cutoff-meter/actions/{id}/click` and `/complete` | BE `NextBestActionService` |
| Display state (zone incl. Safe, early estimate, cooling) | `CutoffMeterService::presentation()`, added to `show` | BE (phase 98) |
| Feature flag | `config('cutoff_meter.enabled')` → `capabilities.cutoff_meter` → `useProgressCapabilities()` | BE + `progressV2.ts` |
| Tabs | `PageSwitchTab` (`TabSwitch type="link"`). Each tab is its own route: `/preparation/[courseId]` and `/test-series/[courseId]` (own layout + shell) | `features/preparation/components/PageSwitchTab.tsx`, `app/[locale]/(protected)/(preparation)/test-series/` |
| Data sources | `user_question_answers` (first attempts, written by `AnswerLogService` from topic / mini / sectional / full tests), `meter_history`, `nba_log`, exam pattern (`ExamPatternService`: sections + marks + pass mark from exam metadata) | BE |

**Conclusion:** the backend already gives everything on the screen except two items, listed in §3.1. The frontend is a new route plus a page that composes the existing `Meter` with two small lists. No new tables, and no new writes to content tables. BigQuery sync is untouched: content tables are only read.

## 3. Implementation plan

### 3.1 Backend (small)

1. **"+N marks" per action.**
   - Each action gets `expected_gain`: the marks it could recover. Proposed formula: the target section's `marks_lost`, shared out over that section's actions today and capped by `cutoff_meter.gain_cap` (default 5), rounded, minimum 1.
   - Unlock and full-length actions have no number. The design shows "Unlocks meter" for those, as the studio does.
   - Stored in the `nba_log` payload, so no migration is needed. → **D2**
2. **Auto-complete today's action** when the student submits the test it points to.
   - `CutoffMeterRefresh::refresh()` already runs after a submit.
   - Before it regenerates, mark open actions with the same `topic_id` / `test_id` as `completed_at = now()`.
   - Without this the checklist would only tick when a "complete" call is made by hand. → **D3**
3. **Range text.**
   - The design shows "Range ±6". Return a `band` (± marks) from the confidence and counted answers, the same mapping the card uses today (low 15 / medium 6 / high 4).
   - Moves to the backend so the card and the tab agree.
4. **Pass-mark label.**
   - The design shows "Cutoff 90 (General)". `pass_mark_source` already exists. Category is open in the spec: we have no student category.
   - Show "Cutoff 90" with no category until the client answers. → **D4**
5. Tests in `CutoffMeterTest`: gain, auto-complete, band, another user's action → 404, and flag off → 404. Run on `clearcut_pt`.

### 3.2 Dashboard

1. **Tab.** `PageSwitchTab` gets a third item, `target` → `/target/[courseId]`, label `common.target` (en/hi/mr).
   - It shows **only when `capabilities.cutoff_meter`** is on. While the flag is off (production today), the tab bar is byte-identical.
   - Both copies of the switcher, top and bottom reveal, get it.
   - Analytics: the existing `Learning Path Switched {from_path, to_path: "target"}` (reuse the event, no new one).
2. **Route.** `app/[locale]/(protected)/(preparation)/target/[courseId]/page.tsx` + `layout.tsx`, reusing the Test Series shell pattern (ProtectedPage + the same shell, so the sidebar and top bar match).
   - When the meter is off, or the course is not the user's, it redirects to `/preparation/[courseId]`.
3. **Data.**
   - `lib/dashboard/cutoffMeter.ts` gets `getCutoffMeter(course)` and `markActionClicked(id)`.
   - `hooks/course/useCutoffMeter(course)` is a React Query hook, key `["cutoff-meter", course]`, staleTime 5 min, invalidated together with `courses-cutoff-meter`.
   - One request per page view.
4. **Page `features/target/TargetPage.tsx`**, three cards from the reference:
   - **MeterCard:**
     - `Meter variant="gauge"` from `@clearcut/motion/meters`, imported through a narrow subpath export (`./meters/meter`) so the studio isn't bundled.
     - Driven through its handle: `set(meter, {band})`, `lock()` when locked, `cool()` when cooling, `delta()` + `wobble()` when the score dropped.
     - Right column: zone pill, gap text (`meterGap` / `meterAbove` / `meterUnlock` from phase 98) and the range/cutoff line.
     - Locked state: the gauge's own lock, plus the unlock text.
   - **TodayPlan:**
     - Title, subtitle "Picked by your Cutoff Meter", a `done/total` chip, and a progress line using the existing `ProgressBar`.
     - Rows: a circle check (filled when `completed`), the title, "{type label} · {est_time_min} min", and a "+N marks" chip.
     - Titles: topic and section names come from the DB. The `reason` is built on the frontend from `reason_key` + `params` (en/hi/mr), never from the backend's English sentence.
     - The CTA "Start: {first open action}" calls `click` and then navigates.
     - Navigation targets:
       - `TOPIC_TEST` / `LEARN` → that topic in `/preparation/[courseId]`, using the existing deep-link pattern (to be confirmed in the build).
       - `SECTIONAL_TEST` / `FULL_LENGTH_TEST` → `/test-series/[courseId]`.
       - `ONBOARDING_TEST` → the topic's mini test.
   - **MarksBreakdown:**
     - One row per section: name, a bar of `section_marks / total_marks` coloured by the studio rule (< 50 % red, < 60 % orange, otherwise green), and "16/30".
     - The bars grow in after the gauge, as the studio does.
     - Hidden behind a short note while locked.
   - Skeletons while loading. On error, a retry card in the existing style, and the other tabs keep working.
5. **i18n:** new keys under one namespace `target` (en/hi/mr), appended only.
6. **Responsive:** single column at 390 px as in the reference. On desktop it is centred at max-w ~560, with the same cards. Tokens plus the meters' approved artwork colours only.

## 4. Progress / completed changes

- **BE** `feature/target-tab` (from `feature/cutoff-meter-batch`), commits `c8127ba`, `fc56361`, `e75e4f4`, `43c8b5c`:
  - `expected_gain` per action (D2), stored in the `nba_log` payload; filled in at read time for rows written before the field existed.
  - `band` in `presentation()` (`cutoff_meter.band_marks`).
  - `plan` = today's first IST batch, so done rows stay ticked; each row carries `chapter_id`.
  - `unlock_answers` in the detail.
  - Auto-complete on submit already existed (phase 97, `CutoffMeterRefresh::complete`).
- **CM** `feature/target-tab` (from `feature/course-card-meter`):
  - Tab:
    - The Target tab sits in `PageSwitchTab` and shows only when `capabilities.cutoff_meter` is on.
    - Analytics reuse `Learning Path Switched` with `to_path: "target"`.
  - Route and layout:
    - `/target/[courseId]` route.
    - `TargetShell` reuses the Test Series topbar `plain`, plus the bottom mirror.
  - Data: `useCutoffMeter`, one request.
  - `TargetPage`:
    - Gauge = `Meter` from `@clearcut/motion/meters/meter`. It gained the optional props `hidePill` / `caption` / `cutoffLabel`; studio defaults are unchanged.
    - Today's plan: checklist, done/total, +N chips, Start CTA. Rows go to `/preparation?chapter=&topic=` or `/test-series`, and `click` is logged once even on a double tap.
    - Marks per subject.
    - Locked, cooling, early and dropped states.
    - Skeleton and retry.
    - Redirects to the Course tab when the meter is off or the course is not the user's.
  - i18n: `target.*` and `common.target`, en/hi/mr.
- **User follow-ups (2026-11-11):**
  - On mobile, the Course / Test Series / Target switch sits on its own line under the course name (both topbars).
  - The bottom Index button is icon-only (list icon, with the aria-label kept) on Course and Test Series.

## 5. Decision log (answered 2026-11-11: D1–D4 = the recommendations below)

| # | Question | Recommendation |
|---|---|---|
| D1 | Where does the tab show? | Only while `capabilities.cutoff_meter` is on, for every course that has a level. Off means the tab bar is unchanged. |
| D2 | What does "+N marks" mean? The spec has no per-action number. | Expected recovery = the section's `marks_lost` split over its actions today, cap 5, minimum 1. Flag it to the client as an estimate. |
| D3 | When does a plan row get ticked? | Automatically when the student submits the matching test (topic / sectional / full). A manual "mark done" is not offered. |
| D4 | "Cutoff 90 (General)": student category | No category: show "Cutoff 90" until the spec's category question is answered. |
| D5 | Plan size | Keep the 3 actions NBA already produces (spec). Show 0/3 even if fewer exist (e.g. 2/2). |

## 6. Blockers / risks

- **Live safety.**
  - The tab and route exist only when the flag is on, and the flag is off in production.
  - The backend changes are additive: payload fields, and an auto-complete update limited to the user's own `nba_log` rows.
  - No content-table writes, no BigQuery impact, no migration.
- **Content data issues** from phases 97/98 also show here:
  - CTET max 180
  - UP PGT/TGT pass mark fallback
  - Exam dates in the past
- **Deep-link** into a single topic in the Course tab needs checking during the build. Fallback: open the course tab scrolled to that topic's section.

## 7. Dependencies / packages added
None. New subpath exports in `@clearcut/motion` (`./meters/meter`) only.

## 8. Tests and verification
- **BE:** `CutoffMeterTest` additions on `clearcut_pt`. Flags-off suite on `clearcut_premig`.
- **CM:** typecheck/lint with no new errors, `check:colors`, and a dashboard build.
- **Playwright (Sonnet):**
  - 390 + 1440, en/hi/mr
  - every meter state (locked / early / need / almost / clear / safe / dropped / cooling / final week)
  - tab switching (Course ↔ Test Series ↔ Target) with the flag on and off
  - 1 meter request per view
  - CTA click → navigation + `click` call
  - tick after a submitted topic test
  - numbers against the DB (meter, section marks)
  - no overflow, failing network
- **Verified** (Playwright, 390 en/hi/mr + 1440):
  - All 7 courses render.
  - Numbers match the API: HTET 82 → shown 78 (cooled −4), ±4, pass 90; UPTET 84, ±15, sections.
  - Requests: 1 meter request and 1 capabilities request per view.
  - A double tap on a row sends 1 click and 1 navigation.
  - Locked state shows "Answer 5 questions" in en/hi/mr.
  - Tabs switch both ways; on desktop the tabs stay beside the title.
  - The Index icon opens the sheet.
  - No overflow.
  - BE: `CutoffMeterTest` 11/11, flags-off 6/6.
- **Not verified:**
  - A completed (✓) row.
  - Chips with N < 5 (fixture data always gives 5).
  - Sectional / full-length row navigation.
  - The /test-series bottom mirror: it never appeared while scrolling in the test, and was not compared with the build before this change.
  - The Target tab shows up late on the first paint, while capabilities load.
  - Real devices.
  - Flag-off rendering (done by code review: no tab, redirect).

## 9. Next steps
Plan review → answer D1–D5 → build BE → build CM → verify → report. No merge or push to `main` without a go-ahead.
