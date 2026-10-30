# Phase 72 — Feature flag for the first-enrollment Practice Test

**Tickets:** (new, from user)
**Repos:** CM dashboard (no backend change)
**Branch:** `feature/practice-test-flag` (from `main`) — not committed, not pushed
**Created / start date:** 2026-10-30
**Status:** Built, unit-tested; browser verification (Playwright, Sonnet subagent) in section 9. Amplitude flag `practice_test` (id 1582360) is created, **enabled, 100 %** (everyone sees the test). Committed on `feature/practice-test-flag` and merged to main 2026-10-30.

---

## 1. Problem / objective
The first-enrollment Practice Test (phase 57) is now live for everyone. We want to switch it on/off (and roll it out to a share of users) from Amplitude without a deploy. Flag **ON** for a user = today's behaviour. Flag **OFF / not confirmed** = the learner goes straight to the Preparation page and never sees any practice-test UI.

## 2. Scope
- **In:** one Amplitude flag `practice_test` (client deployment `testing_price_99`, same public client key as tools) evaluated for the logged-in learner; every place that offers or opens the test respects it; fail-safe behaviour for every error case; tests; docs.
- **Out:** backend (stateless endpoints stay as they are), per-exam targeting (Amplitude remote evaluation does not match custom user properties — only `user_id`/`device_id`; see phase 71 §12), changing the test itself, the Topic/Mini Test.

## 3. Where the test is reached today (all four must respect the flag)
| # | Entry point | File | Flag OFF behaviour |
|---|---|---|---|
| 1 | Prompt sheet right after subjects are saved | `modals/course/buy-sigle-course/buy-sigle-course-modal.tsx` (~l.205–225) | No sheet, **do not** call `offerPracticeTest` (no `offered` state is created), `router.push('/preparation/{group}?subject_selected=1')` exactly like the "already completed" branch |
| 2 | Re-ask of an unanswered prompt (`practice_test_status === "offered"`) on Preparation | `layout/preparation/PreparationShell.tsx` (~l.135–165) | Gate resolves to `done`: no sheet, guide continues. State is **not** changed (if the flag comes back, a still-`offered` learner is asked again) |
| 3 | Direct URL `/practice-test/{course}` (bookmark, old tab, shared link) | `(protected)/(exam)/practice-test/[courseId]/page.tsx` | `router.replace('/preparation/{course}')`, nothing fetched from `/v2/first-practice-test` |
| 4 | Result → "Continue" | `PracticeTestResult.tsx` | Unchanged (already goes to Preparation) |

## 4. Implementation plan
- [x] `src/lib/experiments/practiceTestFlag.ts` — plain `fetch` to `https://api.lab.amplitude.com/sdk/v2/vardata?flag_keys=practice_test` (no SDK, no new dependency; same request as `apps/tools/src/lib/experiment.ts`), `X-Amp-Exp-User = base64({user_id, device_id})`, 1.5 s timeout, result cached in memory + `sessionStorage` per user for 10 min. Returns `true` only for variant `on`; **everything else is `false`** (no key, `NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_KEY=off`, network error, timeout, non-200, bad JSON, flag missing/disabled, no logged-in user id). Never throws.
- [x] `usePracticeTestEnabled()` hook (`'loading' | true | false`) + a plain `isPracticeTestEnabled(userId)` for the modal's async path. User id = the same backend uuid already set as the Amplitude user id (`setAnalyticsUser`), so Amplitude rollout %, "User ID is one of" and cohorts all work.
- [x] Wire the four entry points above. Entry 1 awaits the flag after subjects are saved (≤1.5 s, cached after the first call; the modal already shows its saving state), entry 2 waits inside the existing `checking` status, entry 3 shows the existing loader while `loading`.
- [ ] Analytics: **not done** (no exposure event, no extra property) - decide later if the flag needs analysis; reuse an existing event when it does.
- [x] Amplitude: flag `practice_test` (id 1582360) created in project 673721 / deployment `testing_price_99`, **enabled, All Other Users 100 %** (user chose to show it to everyone; they add conditions themselves). Real endpoint answers `on` (checked 2026-10-30).
- [x] Docs: `DEVELOPMENT_RULES.md` (flag + rule: any new entry to the practice test must go through the hook), `docs/phases/57` cross-link, README tracker row 72, short setup note next to the tools one in `docs/feature_guide/README.md`.

## 5. Questions for the user (defaults I will use if you say "go")
1. **Flag unreachable / slow (>1.5 s)** → I treat it as **OFF** (go to Preparation). Reason: your wording "agar on nahi to direct preparation", and a failed lookup must not block enrolment. Alternative: fail open (show the test). *Default: OFF.*
2. **Initial Amplitude state when I create the flag:** (a) **disabled** → the test disappears for everyone as soon as this ships; (b) enabled, rollout **100 %** → nothing changes until you lower it. *Default: (b), so deploying this changes nothing by itself.*
3. **Learner already inside a test when the flag turns OFF** (session in `sessionStorage`): finish the test they started, or send them to Preparation at once? *Default: send to Preparation; their unfinished answers are dropped.*
4. **Per-exam control** is not possible with this flag (see Out of scope). If you need "test only for HTET/MAHATET", it needs a small extra step: scope-id evaluation like tools (`dashboard:exam:<slug>`) — say so and I will plan it.

## 6. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-10-30 | Which cases | "flag ON → test, OFF → direct preparation, handle all cases" (user) |
| 2026-10-30 | Q1-Q4 | "go" = defaults: unreachable = OFF; mid-test OFF -> Preparation; no per-exam control (user) |
| 2026-10-30 | Initial Amplitude state | "abhi feature flag amplitude ma on kro or sb ko nzr ane do, condition main khud lagata rahunga" -> enabled, 100 % (user) |

## 7. Blockers / risks
- ⚠️ Prod: shipping this reads Amplitude on the enrolment path; the 1.5 s timeout + OFF fallback bounds the delay. Ad-blockers that block `api.lab.amplitude.com` → flag unavailable → test hidden for those users (acceptable, noted in Q1).
- ⚠️ The `offered` state: with the flag OFF we never write it, so no learner is stuck in a state that later asks again unexpectedly.
- Dashboard dev servers on this machine were stopped for cleanup; restart before browser tests.

## 8. Dependencies / packages added
`vitest` as a devDependency of apps/dashboard (+ `vitest.config.ts`, `pnpm test`; lockfile: 3 lines, no other resolution changed). No runtime dependency (plain `fetch`). Optional env `NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_KEY` (override / `off` = test hidden for everyone).

## 9. Tests and verification
- [x] Vitest `practiceTestFlag.test.ts`: 9 tests pass (on; off/missing/null; no user; 500 / bad JSON / thrown fetch / timeout; failure not cached; 10-min per-user cache; in-flight dedupe; request headers; key `off`).
- [x] `tsc`: no error in the touched files (dashboard has an older unrelated backlog), `eslint`: 0 errors (older warnings only), `pnpm check:colors`: no new colours.
- [x] Headed Playwright (Sonnet subagent, local dashboard, vardata mocked via route, fixture user, desktop 1440 + phone 312 viewport): **A** flag ON -> sheet -> Take loads 5 questions, Skip -> Preparation; **B** flag `{}` / `off` -> no sheet, no `practice_test` write, lands on Preparation in ~1 s, no console errors, no horizontal scroll; **C** `offered` + OFF -> no sheet, DB row stays `offered`, back ON -> sheet again; **D** direct `/practice-test/X` + OFF -> redirect, 0 `first-practice-test` requests, Back does not re-enter; **E** direct URL with `{}`, 500, abort, bad JSON, 3 s delay -> all redirect to Preparation; **F** mid-test OFF + reload -> redirect, session key cleared, ON -> fresh test; **G** cache: 1 vardata request, 0 on 5 further loads; **H** real Amplitude answered `on`, test loads; **J** full test -> result 2/5 -> Continue -> Preparation.
- [ ] **Not browser-tested:** enrolment-side failure modes (500 / abort / bad JSON / delay), the enrolment sheet with real Amplitude, hi/mr enrolment flow (hi/mr only checked on the direct-URL OFF redirect, locale prefix kept). Same `isPracticeTestEnabled` function as the direct URL, covered by the unit tests.
- Observations: failures are not cached so a failing direct load makes 2 vardata requests (dev double effect), harmless; one run showed a stale in-flight answer written to the cache right after a manual cache clear (test-harness artefact, clean re-run redirected correctly).
- [x] `tsc`, `eslint`, `pnpm check:colors` (see above).
