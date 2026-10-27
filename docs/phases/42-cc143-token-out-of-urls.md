# Phase 42 — Login token out of URLs (security)

**Tickets:** CC-143 (Highest)
**Repos:** CM packages/auth + dashboard, ASTRO packages/auth, BE (handoff endpoints)
**Status:** Parked (steps 1–3 built + tested, not committed; steps 4–8 parked to end of wave)
**Created:** 2026-10-27 (wave 2, Arslan's list)

## Goal
No Sanctum token in any URL. The landing/ASTRO/blog/tools -> app handoff uses a single-use, short-lived code that the dashboard exchanges server-side. Sentry, analytics and logs no longer see tokens.

## Already in place (do not redo)
- BE: `POST /v1/auth/handoff/create` (auth) + `POST /v1/auth/handoff/exchange` (public, `throttle:auth-handoff`), single-use via cache lock, built for web -> RN app (DEVELOPMENT_RULES section 10). TTL 90s.
- `@clearcut/error-reporting/redact.ts` scrubs `token`/`otp`/`code` in `beforeSend` for blog/landing/tools; dashboard `sentry-shared.ts` has its own copy.
- Dashboard `AuthProvider` already strips `?token=` with `router.replace` (but after pixels/analytics may have read the URL).

## Steps
1. [x] Inventory every place a token enters a URL: `packages/auth/src/redirect.ts:54-55`, `packages/auth/src/context.tsx:97`, ASTRO `packages/auth/src/lib/auth.ts:98,154-155`, dashboard `single-level-selection.tsx:133`, `full-exam-selection-ctet.tsx:257`, `RelatedContent/Content.tsx:112` (BE `open-note?token=`), RN WebView entry (check).
2. [x] Check Sentry scrubbing on spans — confirmed: no `beforeSendSpan`/`beforeSendTransaction` anywhere; `beforeSend` only sees errors, so transactions/spans carried `?token=`.
3. [x] Add span/transaction scrubbing — built 2026-10-27: `scrubSpan` + `scrubTransaction` in `packages/error-reporting/src/redact.ts` (3 new unit tests, 34/34 pass) and the dashboard copy in `sentry-shared.ts`; wired as `beforeSendSpan`/`beforeSendTransaction` in dashboard client/server/edge, blog + landing browser/server, tools browser. tsc: dashboard 95 = baseline, landing/tools/error-reporting 0, blog 33 = baseline. eslint: landing + blog clean; dashboard only the 2 pre-existing `any` in `scrubSensitiveData`; tools eslint crashes on its own (pre-existing). Playwright end-to-end (Sonnet agent, 2026-10-27, dashboard dev copy on :3021, `NEXT_PUBLIC_SENTRY_LOCAL=1`, Sentry ingest intercepted, temp token minted + deleted): PASS at 390px and 1440px — 7 envelopes / 4 transactions each, no token or secret in any envelope, `token=%5Bredacted%5D` in `request.url`, `url.full` and span descriptions, `?token=` gone from the address bar, user logged in. Not covered: a second client-side route change (nav click did not navigate in the test); the `router.replace` navigation transaction was clean. Not committed.
4. [ ] Strip `?token`/`?code` before analytics + pixel init. Findings: GTM + Clarity load on first interaction, Amplitude `pageViews:false`; only the Meta Pixel PageView (afterInteractive + effect) races AuthProvider's `router.replace`. Do together with step 6.
5. [ ] BE: allow the web dashboard to use handoff exchange. Findings: TTL 90s (ticket wants <60s); exchange issues a NEW token (`createToken`) so each web login leaves 2 tokens; limiter `auth-handoff` = 20/min per IP (mobile carrier NAT shares IPs); exchange response returns the raw `user` model (should be whitelisted); create is a separate call = one more round trip on the login path.
6. [ ] Senders (packages/auth, ASTRO): mint a code with the fresh token, redirect with `?code=`; dashboard exchanges it, stores token, removes param.
7. [ ] Transition: dashboard keeps accepting `?token=` for N days (old tabs, RN builds), then removed.
8. [ ] Check GA4/GTM, Amplitude, Meta pixel/CAPI and server access logs for the param; note results on the ticket.

## Decisions needed (🛑 stop here until the user answers)
- **D1 ⚠️ revoke tokens:** revoking the tokens seen in Sentry logs those students out. Options: (a) revoke every token created before the deploy that came through the URL handoff, (b) revoke only tokens older than X days, (c) don't revoke, rely on scrubbing + expiry.
- **D2 📞 Sentry purge:** deleting stored spans / adding a server-side data-scrubbing rule is a Sentry settings action for the user.
- **D3 ⚠️ transition window:** how long the dashboard keeps accepting the old `?token=` (RN app builds in the field may depend on it).
- **D4 ⚠️ deploy order:** BE -> dashboard -> landing/blog/tools -> ASTRO; user deploys ASTRO + tools manually.

## Decision log
| Date | Decision | By |
|---|---|---|
| 2026-10-27 | Plan order 42→53 approved; scope = only the listed tickets (CC-142/147/148 not added — stop where a dependency on them shows up) | User |
| 2026-10-27 | D1 revoke: parked — discuss at the very end of the wave, no action until then | User |
| 2026-10-27 | Steps 4–8 (handoff code flow, minting place, 1 vs 2 tokens): parked by user — revisit at the end of the wave | User |
| 2026-10-27 | For later: code TTL 60s; `auth-handoff` limiter 60/min per IP | User |
| 2026-10-27 | D3 transition: dashboard keeps accepting `?token=` for 14 days after the code flow is live, then removed | User |

## Verification
- Unit tests for redact on span shapes; local end-to-end login from landing -> dashboard with `?code=` (dummy phone flow); code reuse returns error; old token flow still works during transition.
- After deploy: Sentry query `span.description:*token=*` has no new matches for 48h.
