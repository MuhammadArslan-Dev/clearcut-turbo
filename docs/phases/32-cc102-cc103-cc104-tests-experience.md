# Phase 32 — CC-102 + CC-103 + CC-104: test screens respond at once, and test completion is tracked

**Status:** Not Started
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
