# Phase 93 — Client-style testing methodology (the "break-it pass")

**Tickets:** — (request from the user, 2026-11-09)
**Repos:** CM docs only (`CLAUDE.md`, `docs/DEVELOPMENT_RULES.md`, `docs/phases/_TEMPLATE.md`). No application code was changed.
**Branch:** `docs/testing-methodology` (cut from `fix/ui-small-fixes-batch` so the template and the phase 85–92 rows are present) — not pushed
**Created / start date:** 2026-11-09
**Status:** Completed (documentation); the open items in §6 are for the user

---

## 1. Problem / objective
Learn how the client finds, tests, reports and resolves defects, and turn it into one practical, reusable method that is applied to every feature, fix and change — instead of fixing only the reported error and testing the happy path.

## 2. What the audit looked at
`docs/DEVELOPMENT_RULES.md` (all), `docs/phases/*` (decision logs, risks, test sections of 11, 26, 27, 29, 32, 44, 45, 47, 52, 57, 65, 72, 75, 80, 84, 85), `TEST-ISSUE-REPORT.md`, `platform-speed.md`, the 13 auto-memory feedback notes, both `CLAUDE.md` files, and the `git log` of the frontend and backend repos. (Commit subjects are mostly `CC-NN: …`; the richest evidence is in the phase files.)

## 3. Patterns found — how the client tests and what they expect
- **Evidence-driven tickets:** every ticket cites Clarity dead/rage taps, Sentry, Amplitude or SQL, and ends in a measurable *Done when* (e.g. "CLS < 0.1", "dead taps drop 80%+", "Sentry re-check after 3 days").
- **Symptoms, not just the visible bug:** a button that does nothing, a retry that sends nothing, a layout that jumps under the finger, a total that does not match the database, an event that is lost on page unload.
- **Real conditions:** 390px phone, cheap Android, Facebook/Instagram in-app browsers, slow 4G, Hindi + English (+ Marathi), a real UPI payment — and the honest "needs the user's phone" items.
- **Before/after numbers**, failed experiments reverted and logged.
- **Count requests, not clicks** (a retry once looked fine and sent nothing).
- **Do not break what already works:** conversion tracking, SEO links in the HTML, other callers of a shared component, existing design (no unasked changes), existing analytics events (add properties, never new names).
- **Never assume:** decisions go to the user with options; ticket numbers the user quotes are verified (CC-175 vs CC-173); "done" is checked against code or data.
- **Process:** phase file first, one branch per task, Playwright via a Sonnet subagent with third-party hosts blocked, keep the fixture session, no push to `main` without a go-ahead, Razorpay read-only.

## 4. Recurring defect classes (evidence in the audit; one-line probes in §8.1)
Dead taps · retry/refresh that sends nothing · double submit / duplicate order · payment state bugs (wrong plan, paid order not activated, access too long) · wrong numbers on screen · layout shift · stale cache/state/closure · render loops from selectors · tests wiping real data · in-app-browser quirks (blocked popups, blank PDF iframe, `alert()`) · silent network failures and Sentry noise · lost/duplicated analytics events · i18n gaps · soft-deleted/duplicate backend data · SEO/redirect regressions · placeholders shipped as real values · missing authorisation on another user's data.
Bugs that slipped past verification and the check that would have caught them: retry no-op (request-count assert), lost `Test Abandoned` on real unload (fresh-context pagehide capture), tap ignored right after Next (tap immediately after a transition), +60 days of access and wrong plan granted (sequence + duplicate-webhook tests), Tools site shipping weeks-old data (build-time freshness diff), placeholder support phone and `assetlinks.json` (check values, not presence), exam answers readable by other users (second-user-token test), backend tests emptying the dev DB (`--list-tests`, throwaway DB). Plus, from this batch: a probe returning nothing because of a 429/503, a checker that reported "0 unique" until a positive control exposed it, and a `toast` that cannot render because no container is mounted.

## 5. What was changed (where it is documented — no new rulebook)
| Where | Change |
|---|---|
| `docs/DEVELOPMENT_RULES.md` §8.1 (new) | The break-it pass: baseline-first rule; a 12-row symptom → probe → pass-criteria table; "test the test" rules; honest-reporting rule (`Not verified:`); how to keep the list alive |
| `docs/DEVELOPMENT_RULES.md` §0 step 6 | Points to the break-it pass before saying done |
| `docs/DEVELOPMENT_RULES.md` §6 and §9 | Fixture rows/tokens: removed the older "delete `pw-` tokens afterwards" wording that conflicted with the user's "keep the Playwright session" rule; added "never write test rows to a remote/shared DB" |
| `docs/DEVELOPMENT_RULES.md` §11 | Changelog line |
| `CLAUDE.md` | One sentence in *Before Any Task* and one paragraph in *Testing* pointing to §8.1 (so it is read at the start of every task) |
| `docs/phases/_TEMPLATE.md` §8 | Three standing checklist lines: baseline on old code, break-it pass, `Not verified:` list |
| Memory | `feedback_client_style_testing.md` (+ index) so future sessions start from the same method |
Existing rules that already covered a point were left alone and referenced (§2.2 retry request count, §2.4 i18n, §3.1 disabled-button taps, §5 additive shared changes, §6 404 on another user's data, §8 numbers vs DB, §9 one Playwright agent at a time, §10 gotchas).

## 6. Open items for the user (not decided by me)
1. **Co-Authored-By trailer:** the memory note and `DEVELOPMENT_RULES.md` §0 say "no trailer"; this session's harness reminder says to add one. The user's rule was followed (no trailer on any commit so far). Confirm it stays that way.
2. **Backend `CLAUDE.md`** (separate repo) has no note about the `RefreshDatabase` tests that empty the local DB, nor the worktree-`vendor` pitfall (both live only here). A one-line pointer there would need a branch in that repo — say if you want it.
3. **i18n parity** has no automated check for the dashboard (only `check:tour` for tours). A small script that asserts every key exists in en/hi/mr is possible; not built (it would be new tooling).
4. **Misfiled bullets:** the last two bullets of `DEVELOPMENT_RULES.md` (analytics reuse, Meta Pixel) sit after §11; moving them is a separate tidy-up.

## 7. How this is applied from now on
Every change: baseline → implement → the §8.1 rows that apply → record numbers and `Not verified:` in the phase file → ask the user for what only they can check. The next change to use it is CC-90 (phase 85): baseline of the Continue button's disabled look and tap behaviour on the old code, then the same probes after.

## 8. Tests and verification
Documentation only; no application code touched. Checked that every edited anchor matched exactly once, that §8.1 renders between §8 and §9, and that the headings and changelog are intact.
- [ ] **Not verified:** whether the table is the right length for daily use — to be tuned from the next few tickets.
