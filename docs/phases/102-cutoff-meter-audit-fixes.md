# Phase 102 — Cutoff Meter: audit vs spec + fixes

**Tickets:** (user, 2026-11-12: "client naraz, live pe sahi nahi tha") — spec: Confluence PM 29360129 "Cutoff Meter - Logic & Path to Elo"
**Repos:** BE `fix/cutoff-meter-audit` (commit `51a90ce`), CM `fix/cutoff-meter-refetch` (dashboard)
**Created / start date:** 2026-11-12
**Status:** In Review — not merged, not live

---

## 1. Problem / objective
Check phases 97–99 against the spec rule by rule, explain why live testing looked wrong, fix the real code bugs without changing behaviour that the client still has to decide.

## 2. Audit result (read-only audit + own DB checks, local `clearcut`)
- **Formula correct.** §1.6 worked example → 88 / 150, pass 90, yellow, low (test `reproduces the spec worked example`). The spec's own rows add up to 15 answers, not 16.
- **Code bugs found → fixed here:**
  1. Target tab "+x from this test" was **always 0** (`show` re-computed and compared with its own saved row). Card could also show 0 after an API/daily copy row.
  2. Daily 00:00 IST job never saved a `DAILY` meter_history row (spec §4.2).
  3. Dashboard kept the **pre-test meter for up to 5 min** after a chapter/sectional/full-length/onboarding submit (no query invalidation; only mini-test/video/notes invalidated).
- **Audit claims checked and NOT code bugs:**
  - "Sections not limited to the student's path": sections are mapped on the leaf navigation and `stage_id` = leaf of `selections` (e.g. `[52,56,59]` → 59). The wrong totals are **section data**: CTET/UTET Maths & Science `Science=60` (180 total), HPTET JBT `Hindi=120` (240), HTET Level 2 Chemistry has Chemistry twice (95 + 18 → 210), HTET Level 2 Maths only 120 (a section missing). 3 enrollments sit on a level with no sections.
  - "Pass mark by exam, not stage": every `e_instances.pass_marks` row in the DB is the same copy-pasted value (`general 90`, Haryana keys — also on CTET); instances map to `e_stages`, not navigations. A per-level lookup would change no number. HPTET has no pass mark → 60 % of max.
  - "No exam filter on counted answers": no section is mapped in two exams (count 0), so answers cannot mix.
- **Not fed by design / config:** topic tests count only with `MINI_TEST_SERVER_SCORING=true` (the legacy mini-test sends no answers at all, only a "taken" ping). Nothing is logged while `CUTOFF_METER_ENABLED=false` → after switching on, run the backfill. Daily and practice tests are not counted.

## 3. Implementation
- BE `CutoffMeterService::previousMeter()`: meter before the TEST_SUBMIT/BACKFILL that produced the current state (API/daily/backfill copies of the same state skipped; fallback newest row with another state). Used by `compute()` (every non-test-submit read) and the card `summary()`. A test-submit save keeps "last saved meter".
- BE `CutoffMeterRefresh::dailyActions()` saves the row with trigger `DAILY`.
- CM `invalidateCutoffMeterQueries()` (`useProgressCapabilities.ts`), called after a successful end-exam (manual + time-up) and after the onboarding practice-test submit.

## 4. Progress / completed changes
- 2026-11-12: audit, DB checks, fixes, 3 new tests (16/16 CutoffMeterTest pass on `clearcut_pt`; the new change test fails on the old code: "0 is identical to 1").

## 5. Decision log / open for the client
| Question | Today |
|---|---|
| Guess limit 3 s (Part 3) or 5 s (§1.2 text) | 3 s |
| Cooling (display drops up to 5 after 3 idle days) — spec says the meter only moves with answers | on |
| "+N marks" on actions — spec: none in v1 | shown |
| 4 zones / "Early estimate" / "Range ±N" vs spec 3 colours + Low/Medium/High | 4 zones |
| NBA_INCLUDE_LOCKED | true |
| Count daily tests? | no |
| Section marks / pass marks / exam dates (list in §2) | content team |

## 6. Prod checklist (user runs it — nothing self-run)
1. Confirm phase 97 migrations ran: `php artisan migrate:status | grep cutoff_meter`.
2. Content fixes from §2 first (else CTET/HPTET/HTET L2 meters are wrong regardless of code).
3. Env: `CUTOFF_METER_ENABLED=true`; decide `MINI_TEST_SERVER_SCORING=true` (topic tests feed the meter); redeploy.
4. `php artisan cutoff-meter:backfill-answers` then `php artisan cutoff-meter:recompute`.
5. Scheduler running (`cutoff-meter:daily` at 00:00 IST).

## 8. Tests and verification
- [x] `DB_CONNECTION=mysql DB_DATABASE=clearcut_pt php artisan test --filter=CutoffMeterTest` 16/16
- [x] tsc: no errors in touched files; eslint: no new errors (4 pre-existing in touched files)
- [ ] Playwright (sonnet, stubbed backend): refetch after End Test / time-up / onboarding — see §4 when done
- [ ] **Not verified:** production env/migrations/backfill/scheduler state, real students' data on prod, a real phone
