# Phase 108 — Cutoff Meter Amplitude analytics

Date: 2026-11-13. Branch `feat/cutoff-meter-analytics` (frontend only). STATUS: implemented and verified on the branch; not merged / not pushed (waiting for the go-live).

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

## 8. Verification (2026-11-13, real local app + backend, events delivered to the real Amplitude project)
Method: Playwright (Sonnet subagent), analytics opted in with `cc-analytics-local=1`; Amplitude batches read in the page and passed through; test account 16404, course `6ae2df67cd86b` (HTET, Level 1 (PRT)).
| Check | Result |
|---|---|
| Learn card Viewed: once per mount, props equal GET /v2/cutoff-meter (score 50, max 150, cutoff 90, gap 40, medium, 125 answers, 14 tests, v1) | PASS |
| First load without a snapshot sends no change event | PASS |
| Clicked / Info Viewed once per tap / opening (Learn card and Target gauge, 3 cycles each) | PASS after fix (first run: Info Viewed twice — StrictMode dev double effect; ref guard added) |
| Target Viewed + Action Clicked (action_id, type LEARN, rank 2, plan_position 2, topic 131, +5 marks, 15 min) matches the row on screen | PASS |
| Target level/paper equal the Learn card's | PASS after fix (first run: Target read an arbitrary row of the course group from the current-course store; now reads the cached my-courses entry the card shows, no extra request) |
| Score Updated / Zone Changed / Unlocked vs a stored previous snapshot, dedup on reload | PASS (previous state simulated through the snapshot, current values are the live API's) |
| trigger=test_submit with test id: real Daily Test (trigger_test_type daily_test, test uuid) and real Topic Test (topic_test, "131", score 50→51) | PASS after fix (first run: daily path passed the route course uuid, not group_code, so the trigger was discarded) |
| Real tests that did not move the score (2/10, 4/10 daily) send no Score Updated | PASS |
| Console errors on Learn/Target | 0 (first run: "No queryFn" from an enabled:false observer; now `queryFn: skipToken`). Unrelated: GTM load failure |
| Requests: 1 GET /v2/cutoff-meter per Learn load, 0 extra /my-active-courses, sheet open/close adds none | PASS |
| en / hi / mr at 390 px: same events, English values | PASS |
| Ingestion | all batches HTTP 200; Amplitude query (project 673721, last 2 days): all 7 event names present (Viewed 36, Clicked 18, Info Viewed 28, Unlocked 1, Score Updated 4, Zone Changed 4, Action Clicked 1 — totals include the first run's duplicate Info Viewed events and repeated test runs) |

Not verified: Practice Test, Mock/full-length and legacy-topic submit triggers (call sites changed but not exercised; they pass the same trigger shape); locked-state Viewed with `unlock_questions_needed` (no locked meter available — code path only); production build behaviour; real touch device; hi/mr trigger props; `trigger_test_id` for Practice = course group_code by design.
Local test data: the test account now has extra Daily/Topic attempts (fixture user kept as per the standing rule).

## 9. Files modified
New: `lib/analytics/events/cutoff_meter.ts`, `lib/analytics/cutoffMeter.ts`, `hooks/course/useMeterTracking.ts`, `docs/analytics/cutoff-meter-tracking.md`.
Changed: `lib/analytics/types.ts`, `ANALYTICS_EVENT_CATALOG.ts` (docs only), `lib/dashboard/courseCardMeta.ts` (`paperName`), `MyCourseCard.tsx`, `MyCoursesWrapTwo.tsx`, `TargetPage.tsx`, `CutoffMeterInfoModal.tsx`, `useCutoffMeterInfoStore.ts`, `useProgressCapabilities.ts` (optional trigger argument), submit call sites: `exam/pages/mainContent.tsx`, `ExamEndConfirmationSheet.tsx`, `PracticeTestPage.tsx`, `MiniTest.tsx`, `daily-test-attempt/.../page.tsx`.
