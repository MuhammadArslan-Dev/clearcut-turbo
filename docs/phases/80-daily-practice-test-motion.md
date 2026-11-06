# Phase 80 — Daily Test + Practice Test: motion (intro, Nibbu, submit animation, animated result)

**Tickets:** (new, from user)
**Repos:** CM (`packages/motion`, `apps/dashboard`)
**Branch:** local only on `feature/practice-test-flag` working tree — **not committed, not pushed, not deployed** (user instruction)
**Created / start date:** 2026-11-06
**Status:** In Progress

> Reference: phase 79 (`@clearcut/motion`, Topic Test intro/feedback/result). Same look and motion, applied to the Daily Test attempt (`daily-test-attempt/.../page.tsx`) and the first-enrolment Practice Test (`components/features/practice-test/*`).

---

## 1. Objective
Give Daily Test and Practice Test the same polished experience as the Topic Test: 3-2-1-Go start countdown, Nibbu at the bottom of the question, submit ("checking your answers") animation, and the animated result screen — without changing business logic (question flow, scoring, data, API calls).

## 2. Decisions (user, 2026-11-06)
| Question | Answer |
|---|---|
| Real-time correct/incorrect feedback | **Practice Test: yes**, using the EXISTING `POST /v2/first-practice-test/{id}/explanation` endpoint (no new backend). **Daily Test: no** (graded + timed; the correct option only exists after submit; revealing it needs a new backend endpoint and weakens scoring integrity). Daily gets a neutral Nibbu "answer noted" reaction instead. |
| "Countdown timer experience" | Interpreted as the start countdown (library `TestIntro`, 3-2-1-Go, Skip). The existing timers stay and **start only after Go**: Daily `LiveTimeLeft` (60 s/question, mounts when the attempt screen mounts), Practice silent stopwatch. Timer expiry (Daily `time_up`) is unchanged. |
| After Daily submit | Submit animation -> animated result view in place (previously `flow.goUp` to the history page straight away). The result view's own "Back to history" does the old `flow.goUp`. |

## 3. Plan
- [x] Library (`packages/motion`): `label` override on intro/submit/result badge (Practice test), `actions={false}` on `TestResult`, `NibNote` (neutral Nibbu message), export.
- [x] Dashboard shared (`components/features/test-motion/`): intro gate (timers start after Go), language helper.
- [x] Practice Test: intro gate; instant feedback on pick (explanation endpoint, locked after reveal, option states, Nibbu `AnswerFeedback`, streak toast); `TestSubmit` instead of the result skeleton; result hero = library `TestResult` (review table + Continue kept).
- [x] Daily Test: intro gate before the attempt screen (timer after Go); Nibbu note on pick; `TestSubmit` on submit; result view hero = library `TestResult` (paid/free banner, paywall card, review rows, back button kept).
- [x] i18n en/hi/mr for new strings (`practiceTest.json`, `dailyTests.json`).
- [x] Tests (Playwright, mocked API): right / wrong / skipped, manual submit, Daily timer expiry (Date.now skew; Playwright's fake clock stops the app loading), result numbers, 360 / 390 / 768 / 1280 / 1920, Hindi, reduced motion, slow submit API, failed submit.
- [x] Docs: DEVELOPMENT_RULES, README tracker.

## 4. Progress
- 2026-11-06: code read, phase doc written.
- 2026-11-06: library additions (`label`, `actions={false}`, `note`, `NibNote`), `TestStartIntro`, Practice + Daily integrated, i18n en/hi/mr, tests run (section 7).
- 2026-11-06: bug found by the E2E run and fixed: in Practice, a tap right after Next/Previous was ignored because the question block sits in `AnimatePresence mode="wait"` and its fresh child kept the previous render's closure. `selectOption`/`toggleMark`/explanation toggle now read the current question from `sessionRef` (see DEVELOPMENT_RULES section 10).

## 5. Risks
- Practice Test is behind the Amplitude flag `practice_test` (tests intercept the flag request).
- Local DB has no daily/practice data: tests mock `/v2/daily-tests/*` and `/v2/first-practice-test/*`.
- Picking in Practice now reveals correctness (and locks the pick) — product change the user chose; scoring still server-side at submit.

## 6. Dependencies
None.

## 7. Tests and verification
Playwright (mocked API, local dev server), all passing after the fix:
- Practice: all-correct 5/5 (streak toasts at 3 and 5, confetti), wrong pick shows "Not quite" + correct option, skipped, explanation-API failure then retry by tapping the same option, submit API failure then retry (back on the test with the error, no stuck overlay), refresh mid-test resumes without the countdown with answers/feedback restored, Hindi (intro/feedback/submit/result labels in Hindi, 3/5 computed right).
- Daily: intro then timer starts after Go, neutral Nibbu note (no right/wrong leak), correct/wrong/skipped result numbers, free (score only) vs paid, manual submit animation then result, timer expiry (`time_up`) auto-submits the saved answers `{2000:2}` then shows the submit animation and result, Hindi.
- Responsive 360x740, 390x844, 768x1024, 1280x800, 1920x1080 (long option text): no horizontal overflow on intro / question / result; feedback and note rows clear of the footer buttons.
- `pnpm --filter @clearcut/motion typecheck` clean; dashboard `tsc` has no errors in the changed files (pre-existing unrelated errors remain); `pnpm check:colors` no new colours; eslint on the changed folders 0 errors (4 pre-existing warnings in the Daily page).
- Desktop result (2026-11-06): the stacked 440px result left huge empty space in the full-page Daily/Practice cards. `TestResult` got an opt-in `wide` prop (>=1024px: ring left, title/sub/stats/time right, per-type cards + CTAs full width); both pages pass `wide` and widen their wrapper on `lg`. Modal hosts (Mini Test) and mobile unchanged. Checked at 1280 and 1920 (no overflow) and 390.
- Test-harness gotcha: a leftover Playwright `page.clock.install()` fakes `Date.now`/`performance.now` for the whole browser context and freezes framer-motion fades (content stays opacity 0). Close the browser (`browser_close`) after any fake-clock attempt.

- Submit transition (2026-11-06): the submit animation is now an overlay (`test-motion/SubmitOverlay.tsx`) over the still-mounted test screen instead of replacing the page, and it fades out (0.3 s) as the result renders behind it (before: white screen, then a hard cut). Same URL (no new result route: refresh/back/session restore keep working). Sampled at 150 ms: overlay 0 -> 1 over the test, result mounts behind it, overlay 1 -> 0; one submit request per run; a failed Daily submit drops the overlay and shows the existing error screen. Daily's `LiveTimeLeft.onComplete` is ignored while the overlay is up so time-up cannot double-submit.

Not covered: reduced-motion toggle, real backend (no Daily/Practice data in the local DB), real-device slow network.
