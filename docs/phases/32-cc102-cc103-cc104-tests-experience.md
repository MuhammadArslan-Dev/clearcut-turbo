# Phase 32 — CC-102 + CC-103 + CC-104: test screens respond at once, and test completion is tracked

**Status:** Built + verified locally (2026-10-23), CM `phase-32-tests-experience`. Not merged. The locked-card copy is left for a decision.
**Jira:** [CC-102](https://clear-cutoff.atlassian.net/browse/CC-102), [CC-103](https://clear-cutoff.atlassian.net/browse/CC-103), [CC-104](https://clear-cutoff.atlassian.net/browse/CC-104)
**Repos:** CM `apps/dashboard` (exam/test-series/report), BE only if submit happens server-side (CC-103 "saved on the server")
**Size:** medium–large

## What the tickets say
**CC-102 — result screens don't respond (Clarity, 90 days):**

| Control | Dead clicks |
|---|---|
| "Show Correct Answer and Explanation" | 2,322 |
| "Incorrect" filter | 1,451 |
| "Correct" filter | 1,267 |
| "Analysis" | 763 |
| "View Report" | 697 |
| Blank area (likely an overlay/loader blocking taps) | **12,005** (910 rage, 362 sessions) |

- **Ask:** find what blocks taps; every button responds within 100 ms; filters work as tabs.

**CC-103:**
- "Test Submission Attempted" never fires (0 events); "Test Submitted" has had no data since February.
- **Add:**
  - `test_submitted` when saved on the server, with exam, type, test_id, subject, chapter, totals, correct, wrong, score_percent, time, is_first_test, language.
  - `test_abandoned` (close / 30 minutes idle).
  - `report_viewed` {tab}.
- **Chart:** Test Started → test_submitted → report_viewed.

**CC-104:**

| Control | Dead clicks |
|---|---|
| "Start Chapter Test" | 529 |
| "Continue Test Series" | 449 |
| "18/20 Tests" label | 755 |
| Subject tabs | 689 |
| "Unlock CTET course" on the test list | 346 (171 rage) |

- **Ask:**
  - Instant loading state on the start buttons ("टेस्ट खुल रहा है…"), disabled while loading.
  - The "N Tests" label opens the list (or is plain text).
  - Subject tabs filter locally.
  - Locked cards say "₹99 प्लान में शामिल".

## What the code shows (2026-10-23, first pass)
- **Report sheet:** `components/features/exam-report/ExamReportSheet.tsx` has "Show Correct Answer" toggles, OptionCard and filters.
- **Daily test attempt:** the report in `daily-test-attempt/.../page.tsx` (same strings).
- **Phase 18 done already:** option rows in `PreviousModal`/`ExamInstanceModal` open the answer. Check whether the 12k "blank area" taps are an overlay (MUI/Joy backdrop, framer `AnimatePresence` exit layer, `fixed inset-0` loader).
- **Events:** the typed catalog has `Test Started` and the test-series events; find where "Test Submission Attempted" is supposed to fire.

## What was found (2026-10-23; dev server, 390 px, 4x CPU)
- **Report screen (CC-102):** no element covers the controls (`elementFromPoint` at five points hits the real content).
  - Response times: Analysis tab 653 ms; Correct/Incorrect filters ~200–240 ms; Summary 123 ms; "Continue Test Series" 113 ms; "Show Correct Answer" ~200 ms, and the explanation opens in view.
  - Production is faster than dev.
  - The "blank area" taps: the question's options did nothing when tapped, while CC-105 already made option taps open the answer in PreviousModal/ExamInstanceModal.
- **Subject tabs (CC-104):** the first tap on an uncached subject changed nothing on screen for **~7 s** (dev, 4x CPU), not even the tab. Rendering the new list blocks the main thread before the tab can move. About 1 s of work at 1x in dev, mostly React dev overhead.
- **"N Tests" pill and section headers (CC-104):** styled as tappable (`cursor-pointer`, blue pill) with `onClick={() => {}}`, so every tap was dead.
- **Start buttons (CC-104):** the pre-test "Start Chapter Test" closes the modal and opens the countdown at once (no network wait), so nothing to fix there.
- **Events (CC-103):**
  - `Test Submitted` is typed but never sent.
  - `Test Started` is sent with a hard-coded `test_session_id: "ts_xyz_12345"` (left as is; existing charts may use it).
  - `/v2/exam/end-exam` returns `result` (correct, wrong, unanswered, percentage).

## What was built
- **CC-103 (`lib/analytics/testFunnel.ts`):**
  - `test_submitted` after end-exam succeeded (manual "End Test" and the timer), once per attempt. Properties: test_id, test_type, exam, course_id, section_name, totals, correct, wrong, unattempted, score_percent, time_taken_seconds, submission_reason, language.
  - `test_abandoned` once per attempt on `pagehide` or 30 min without input while in progress.
  - `report_viewed {tab}` when the report opens and on every tab change.
- **CC-102:** tapping an option in the report opens the answer + explanation (same panel as the button), like CC-105.
- **CC-104:**
  - The tapped subject tab moves at once (230 ms vs ~7 s); the list swaps right after that frame.
  - Section headers and their "N Tests" pill bring that section's tests into view (Chapter and Sectional tests).
- Also: `handleAutoExpire` now has `language` in its dependencies, so the timer path doesn't send a stale language.

## Verification (local)
- [x] Report: option tap → "Hide Correct Answer…" and "Answer & Explanation" visible.
- [x] Subject tab: tab moved 230 ms after tap (was 6986 ms).
- [x] Section header tap: the scroller went 265 → 120 and the section's tests came into view.
- [x] tsc: no new errors (one pre-existing in ExamReportSheet); eslint equal to main (49 = 49); check:colors passes.
- [ ] Event payloads: Amplitude is off locally (`.env`). Check `test_submitted` / `report_viewed` in Amplitude after deploy, then chart Test Started → test_submitted → report_viewed.

## Left for a decision
- **Locked cards "₹99 प्लान में शामिल" (CC-104):** new visible copy on every locked card. Needs RD's OK on copy/design (price from pricing per exam).

## Plan
- [ ] **Reproduce** on report/summary-view URLs at 390px with 4× CPU (Playwright): use `elementFromPoint` at the dead-click spots to find the element on top, and time from tap to visible change for each control.
- [ ] **CC-102 fixes:**
  - Remove/disable whatever covers the page (`pointer-events-none` on the finished loader).
  - Buttons show a pressed/spinner state at once.
  - Correct/Incorrect/Unattempted as real tabs.
  - The answer toggle animates from the tap.
- [ ] **CC-103:**
  - `test_submitted` after the submit API succeeds, with the full properties.
  - `test_abandoned` via `pagehide`/visibility + 30-minute idle.
  - `report_viewed {tab}`.
  - Find and remove the dead "Test Submission Attempted" call.
- [ ] **CC-104:**
  - Loading state + disabled on the start buttons (reuse `MainButton` loading).
  - The "N Tests" label is either a button or plain text.
  - Subject tabs filter cached lists.
  - Locked card copy (en/hi/mr).
- [!] 🛑 **D1:** "₹99 प्लान में शामिल" uses a price; take it from pricing, not hardcoded (prices differ per exam).
- [ ] **Verify:**
  - Playwright tap-to-response under 100 ms on each control.
  - No element above the buttons after load.
  - Events captured via blocked Amplitude requests (as in Phase 20).
  - Screenshots en/hi/mr.

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| | | | |
