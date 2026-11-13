# Cutoff Meter — Amplitude tracking specification

Version 1 · 2026-11-13 · Product: ClearCutOff web app (app.clearcutoff.in) · Amplitude project: the existing ClearCutOff web project (same as every other dashboard event).

## 1. What this covers
Six events that describe the life of the Cutoff Meter: tapped, explained, unlocked, moved, changed zone, and acted on. (The impression event "Cutoff Meter Viewed" was removed on 2026-11-13: it is no longer sent.) They follow the existing conventions: Title Case, past tense, snake_case properties, English values only (never translated), sent through the same `trackEvent` pipeline as every other dashboard event. No separate tracking system was added.

**Where the Cutoff Meter appears**

| Surface (`surface` value) | Screen |
|---|---|
| `learn_card` | Learn tab → My Course card (bar meter) |
| `target_page` | Target tab → gauge card |
| `info_sheet` | "How your Cutoff Meter works" sheet (opened from either surface) |

The test result screens (Daily, Practice, Mock, Topic test) do not show the meter. A test's effect on the meter is captured by `Cutoff Meter Score Updated` / `Zone Changed` / `Unlocked`, which name the test that caused it.

**Identity.** Amplitude's `user_id` is the ClearCutOff user uuid (set once at login for every event). It is not repeated as an event property.

**Data source.** Every value comes from the backend Cutoff Meter API response (`GET /v2/cutoff-meter`), never from hard-coded numbers. Nothing is sent while the meter is still loading, or if it failed to load.

## 2. Properties sent with every Cutoff Meter event

| Property | Type | Description | Example |
|---|---|---|---|
| `surface` | string | Where the meter was shown: `learn_card`, `target_page`, `info_sheet` | `learn_card` |
| `course_id` | string | The course (enrolment group code) | `6ae2df67cd86b` |
| `exam_name` | string | Exam short name | `HTET` |
| `level` | string | Level the student picked | `Level 1 (PRT)` |
| `paper` | string | Paper, when the course has one (blank otherwise) | `Paper 2` |
| `meter_status` | string | `locked` (not enough answers yet) or `unlocked` | `unlocked` |
| `zone` | string | `needs_work`, `almost_there`, `clear_zone`, `safe_zone` (blank while locked) | `needs_work` |
| `colour` | string | Meter colour: `red`, `yellow`, `green` (blank while locked) | `red` |
| `score` | number | Predicted marks shown to the student | `50` |
| `max_marks` | number | Exam maximum | `150` |
| `cutoff_value` | number | Pass mark / cutoff | `90` |
| `gap` | number | Marks still needed to reach the cutoff; negative = above it | `40` |
| `percent` | number | `score / max_marks × 100`, one decimal | `33.3` |
| `confidence` | string | `low`, `medium`, `high` — how much data backs the score | `medium` |
| `is_early_estimate` | boolean | Few answers so far ("Early estimate" pill) | `false` |
| `is_cooling` | boolean | Score is cooling down after inactivity | `false` |
| `tests_count` | number | Distinct tests behind the score | `14` |
| `counted_answers` | number | Answers counted in the score | `125` |
| `model_version` | string | Scoring model version | `v1` |

`level` / `paper` come from the enrolment the Learn card shows (the paper the student was last active in). On a direct page load of the Target tab, before the course list is cached, they can be blank; every other property is always present.

## 3. Events

### 3.1 Cutoff Meter Clicked
- **Trigger:** the student taps the meter (or presses Enter / Space on it).
- **Extra properties:** `click_target` = `info_sheet`.
- **Insights:** tap volume by surface and by zone (do students in "Needs work" tap more?).

### 3.2 Cutoff Meter Info Viewed
- **Trigger:** the "How your Cutoff Meter works" sheet opens (once per opening).
- **Extra properties:** `opened_from` = `learn_card` or `target_page`.
- **Insights:** how many taps turn into understanding; which surface drives it; tap → explanation funnel (Clicked → Info Viewed).

### 3.3 Cutoff Meter Unlocked
- **Trigger:** the meter changes from locked to unlocked (compared with the last meter this browser showed for the course).
- **Extra properties:** `previous_status` = `locked`, `current_status` = `unlocked`, `trigger` (`test_submit` when this tab just saved a test, else `refresh`), `trigger_test_type` and `trigger_test_id` (only with `test_submit`).
- **Insights:** activation: which test type unlocks the meter, time from enrolment to unlock, share of students who never unlock.

### 3.4 Cutoff Meter Score Updated
- **Trigger:** a new calculation of the meter changes the score (comparison uses the stored score, so the display-only "cooling" decay never fires it).
- **Extra properties:** `previous_score`, `current_score`, `score_change` (number, negative = dropped), `previous_zone`, `current_zone`, `trigger` (`test_submit` / `refresh`), `trigger_test_type`, `trigger_test_id`.
- **Insights:** which test types move the score and by how much; improvement over time; students whose score is falling; test types that lift the meter most per attempt.

### 3.5 Cutoff Meter Zone Changed
- **Trigger:** the zone differs from the last meter this browser showed for the course (same dedup as 3.5).
- **Extra properties:** `previous_zone`, `current_zone`, `previous_colour`, `current_colour`, `direction` (`up` / `down`), `trigger`, `trigger_test_type`, `trigger_test_id`.
- **Insights:** progress milestones (e.g. Needs work → Almost there); funnel to "Safe zone"; regression moments worth a nudge; conversion / retention by zone.

### 3.6 Cutoff Meter Action Clicked
- **Trigger:** the student taps a row of "Today's plan" (or the Start button) on the Target tab.
- **Extra properties:** `action_id` (string), `action_type` (`ONBOARDING_TEST`, `TOPIC_TEST`, `LEARN`, `SECTIONAL_TEST`, `FULL_LENGTH_TEST`), `rank` (number), `plan_position` (1-based position in today's plan), `section_id`, `topic_id`, `test_id` (numbers, blank when not applicable), `expected_gain` (marks the plan estimates), `est_time_min`, `is_locked_plan` (boolean — the plan is the "unlock the meter" plan).
- **Insights:** does the recommendation get followed; which action types are tapped; does `expected_gain` predict what students pick; link tapped actions to the score changes that follow.

## 4. How change events are decided (so the numbers can be trusted)
- The browser remembers the last meter it showed for each course (per user, local storage). The first time ever, it only remembers — **no change event is sent**.
- A change is reported at most **once per backend calculation**, even if the Learn card and the Target tab both show it.
- `trigger = test_submit` when a test was just submitted in the same browser tab (Daily, Practice, Mock/test-series, or Topic test) and the meter then changed. `test_id` is the test's own id (Topic test: the topic id; Practice test: the course id). Changes with no such submit (another device, a reload, a recalculation) are `trigger = refresh`.
- A change made on another device is reported on the next visit on this one, as `refresh`.
- If local storage is blocked, change events are skipped (never invented); Clicked / Info Viewed still work.
- Analytics only runs on production hosts (`app.clearcutoff.in` etc.); local or staging visits are not sent.

## 5. Suggested Amplitude charts
1. Funnel: Clicked → Info Viewed (by `surface`, by `zone`).
2. Event segmentation: Unlocked, by `trigger_test_type`.
3. Event segmentation: Score Updated, average `score_change`, group by `trigger_test_type`.
4. Zone Changed, count by `previous_zone` → `current_zone`, `direction`.
5. Action Clicked by `action_type`, split by `meter_status`.
6. User property view: latest `zone` per user (cohort "Almost there" = nudge target).

## 6. Verification evidence (2026-11-13, real local app → real Amplitude project)
See section "Verification" in `docs/phases/108-cutoff-meter-analytics.md`.
