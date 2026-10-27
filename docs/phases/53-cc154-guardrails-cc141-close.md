# Phase 53 — Guardrails + close the speed epic

**Tickets:** CC-154 (Low), CC-141 (Epic)
**Repos:** CM CI (.github), Sentry
**Status:** Not Started
**Created:** 2026-10-27 (wave 2, Arslan's list)

## Goal
CI warns/fails on performance regressions; Sentry alerts + a speed dashboard; epic definition of done checked.

## Already in place (do not redo)
- CI: lint -> check:colors -> typecheck -> test -> build.

## Steps
1. [ ] Lighthouse CI on 5 URLs (needs preview URLs or a local prod server in CI).
2. [ ] Sentry alerts + saved "Speed (production)" dashboard.
3. [ ] Weekly check routine (could be a scheduled agent).
4. [ ] CC-141: check the epic DoD, post numbers.

## Decisions needed (🛑 stop here until the user answers)
- **D1 budgets:** JS KB budget per page, warn vs fail.
- **D2 📞:** Sentry alerts/dashboard creation and the team channel to notify.
- **D3:** weekly check by a person or a scheduled agent.

## Decision log
| Date | Decision | By |
|---|---|---|

## Verification
Test PR adding a heavy library triggers the budget; test alert fires.
