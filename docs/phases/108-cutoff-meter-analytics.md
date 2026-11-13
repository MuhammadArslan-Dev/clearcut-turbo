# Phase 108 — Cutoff Meter Amplitude analytics

Date: 2026-11-13. Branch `feat/cutoff-meter-analytics` (frontend only). STATUS: PLAN — waiting for review, nothing implemented yet.

## 1. Objective
The Cutoff Meter has no analytics. Instrument its lifecycle with the existing Amplitude stack (`lib/analytics/browser.ts` `trackEvent`, typed in `events/*` + `types.ts`), Title Case past-tense names (DEVELOPMENT_RULES §2.5 / "reuse before you add"), no new tracking architecture.

## 2. Audit — where the meter appears
| Surface | Component | Data |
|---|---|---|
| Learn → My Course card | `MyCourseCard.CutoffMeterPanel` (`surface=learn_card`) | `useCoursesCutoffMeter` (summary) |
| Target tab | `TargetPage.MeterCard` (`surface=target_page`) + Today's plan rows | `useCutoffMeter` (detail) |
| Info sheet | `CutoffMeterInfoModal` (opened from both) | store |
| Test result screens (Daily / Practice / Mock / Topic test) | **do not render the meter**; they only invalidate its queries (`invalidateCutoffMeterQueries`) | the new score is seen by the next refetch → covered by `Cutoff Meter Score Updated` with the test as trigger |

## 3. Events (no existing event covers any of these moments; `Test Submitted` etc. stay untouched)
Common properties (all events): `surface` (`learn_card`|`target_page`|`info_sheet`), `course_id` (group_code), `exam_name`, `level` (course level name), `paper` (leaf/paper name when known), `meter_status` (`locked`|`unlocked`), `zone`, `colour`, `score` (display_meter), `max_marks`, `cutoff_value` (pass_mark), `gap`, `percent` (score/max), `confidence`, `is_early_estimate`, `is_cooling`, `tests_count`, `counted_answers`, `model_version`. All from the backend response; `user_id` is the Amplitude user id set by `setAnalyticsUser`, not repeated per event.

| Event | Trigger | Extra properties |
|---|---|---|
| `Cutoff Meter Viewed` | the meter is ≥50 % visible for ~1 s (IntersectionObserver), once per course+surface per page visit | `unlock_questions_needed` (when locked) |
| `Cutoff Meter Clicked` | tap / Enter on the meter (opens the info sheet) | `click_target: info_sheet` |
| `Cutoff Meter Info Viewed` | info sheet opens | `opened_from` |
| `Cutoff Meter Unlocked` | locked → unlocked seen vs the last saved snapshot | `previous_status`, `current_status`, `trigger_*` |
| `Cutoff Meter Score Updated` | a new `computed_at` with a different score | `previous_score`, `current_score`, `score_change`, `previous_zone`, `current_zone`, `trigger_test_type`, `trigger_test_id` (when a submit in this tab caused it) else `trigger: refresh` |
| `Cutoff Meter Zone Changed` | zone differs from the last snapshot | `previous_zone`, `current_zone`, `direction` (`up`/`down`), `previous_colour`, `current_colour` |
| `Cutoff Meter Action Clicked` | Target "Today's plan" row / Start CTA | `action_id`, `action_type`, `rank`, `plan_position`, `section_id`, `topic_id`, `test_id`, `expected_gain`, `est_time_min`, `is_locked_plan` |

## 4. Design
- New `lib/analytics/events/cutoff_meter.ts` (types) wired into `types.ts` + `ANALYTICS_EVENT_CATALOG.ts` (docs only).
- New `lib/analytics/cutoffMeter.ts`: `meterProps(summary, ctx)`, `trackMeterViewed/Clicked/InfoViewed/ActionClicked`, `observeMeterState(summary, ctx)` (change detection vs a per-user+course localStorage snapshot `cc-meter-snap:{user}:{course}` = `{computed_at, locked, zone, score}`; dedup by `computed_at`; first ever sight only stores the snapshot — never fires a fake "change"), `noteMeterTrigger({test_type,test_id,course_id})` (module variable set by the 4 submit paths next to `invalidateCutoffMeterQueries`, consumed once by the next score change).
- A small `useMeterViewed(ref, …)` hook; one call in each of the two panels. Nothing fires for the skeleton / error state.
- Reads only what the API returns; no numbers invented.

## 5. Decisions needed
1. Surface for the info sheet and card click — OK as above?
2. `Cutoff Meter Score Updated` when the change is only the cooling decay (display_meter changes, no new test)? Proposed: NOT sent (only a new `computed_at`).
3. Snapshot in localStorage (per browser) means a score change made on another device is reported on the next visit here, with `trigger: refresh`. Accept?

## 6. Verification plan
Playwright (Sonnet subagent) on the real local env with Amplitude ingestion captured (DEVELOPMENT_RULES §10, block only the ingestion host and decode batches): locked → submit 5-q test → Unlocked + Score Updated; zone change case; viewed once per visit; click; plan click; reload dedup; hi/mr 390 px; request counts unchanged; then confirm arrival in the real Amplitude project through the Amplitude MCP. Client-ready tracking document at `docs/analytics/cutoff-meter-tracking.md`.

## 7. Files (planned)
`lib/analytics/events/cutoff_meter.ts` (new), `lib/analytics/cutoffMeter.ts` (new), `lib/analytics/types.ts`, `ANALYTICS_EVENT_CATALOG.ts`, `MyCourseCard.tsx`, `TargetPage.tsx`, `CutoffMeterInfoModal.tsx`, `useProgressCapabilities.ts` (+ 4 submit call sites), docs.
