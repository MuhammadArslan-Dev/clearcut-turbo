# Phase 68 — Reusable, configurable login (OTP) gate for Tools (download, view result, save, …)

**Repos:** CM (`apps/tools`, `packages/auth`); backend/OTP provider untouched.
**Status:** **Plan only — waiting for the answers in §6.** No code written. Created 2026-10-29 in worktree `clearcut-master-exp`; the main worktree's uncommitted work is untouched.

## 1. Request
- Reuse the `/start` + login-modal authentication (same OTP provider, endpoints, validation, session) for Tools; no second copy of auth logic.
- One **globally reusable, configurable** modal any tool/action can open: per-use heading, description, CTA text and "what happens after success" (e.g. "Verify your mobile number with OTP to download your image for free. No payment required").
- Keep processed images/tool state, resume the requested action after verification, responsive + accessible + design-system consistent.
- Test: `/start`, several tool contexts, wrong/expired OTP, resend cooldown, rate limit, session persistence, post-verify action.

## 2. What already exists (inspected)
| Piece | Where | State |
|---|---|---|
| Shared login UI + logic (phone → OTP, Truecaller, validation, `Verification Sent/Resent`, `Authentication Outcome`, resend timer) | `packages/auth` (`LoginScreen`, `OTPScreen`, `createAuthFeature`) | Reusable. Used by blog/landing/tools |
| "Login without leaving the page" | `createAuthFeature({ onAuthenticated })` | Done (Syllabus Tracker "Save for Future") |
| Copy override | `LoginCopy` (`title`, `subtitle`, `submitLabel`, `showTrialBanner`, `showTrustText`) on `AuthModal` | Done, but **title/subtitle/CTA only** |
| Tools wiring | `apps/tools/src/lib/toolsAuthFeature.ts` (module-level `authenticatedHandler`), `toolsSession.ts` (`useHasSession`), `ToolsAuthGate.tsx` (lazy, `reason: "save" \| "load"` hard-coded to the Syllabus Tracker strings) | **Tracker-specific**, not generic |
| `/start` page login | `apps/landing/src/components/pages/StartAuthForm.tsx` (960 lines, own UI, same `authApi`, same event helpers) | Separate UI, shared API/events. **Left unchanged** (see §4) |
| Resizer download | `ResizeImageTool.tsx` `handleDownload()` (blob → `<a download>`), no login check | Not gated today |

Net: the auth logic is already centralised in `packages/auth`. What is missing is a **generic gate API** in Tools (the existing gate is tracker-only) and wiring it to the resizer download.

## 3. Proposed architecture
1. **`useLoginGate()` hook** (`apps/tools/src/lib/loginGate.tsx`, tiny, no auth bundle):
   `requireLogin(config, onSuccess)` → if `useHasSession()` is true it runs `onSuccess()` immediately; otherwise it stores `{config, onSuccess}` in a ref/state and mounts the lazy gate. Returns nothing else; callers never touch OTP code.
2. **`LoginGateConfig`** (typed, one place): `{ id, title, description, submitLabel, showTrialBanner?, analyticsContext }`. Presets (`download`, `view-result`, `save-tracker`, `load-tracker`) live in one file with en/hi/mr strings; a tool may pass its own object.
3. **`ToolsAuthGate` generalised**: takes the config instead of `reason`; the pending `onSuccess` runs once from `onAuthenticated`, then is cleared (no double run, cleared on close/cancel). Syllabus Tracker is migrated to the same API (same strings, no behaviour change).
4. **`@clearcut/auth` change (small, backward compatible):** add optional `description` to `LoginCopy` (rendered where the subtitle is) — only if the existing `subtitle` cannot carry the "No payment required" line. Other apps keep their defaults.
5. **State preservation:** the gate is an overlay on the same page (no navigation/reload), so the image blob, preset and crop stay in React state. The pending action is a closure over the current state; verification only calls it.
6. **Resizer:** `handleDownload` becomes `requireLogin(DOWNLOAD_CONFIG, doDownload)`; the visible download buttons and the tap-image shortcut both go through it.
7. **Analytics:** reuse existing events; add `context` (config id) as a property on the shared `Authentication Outcome` / `Verification Sent` (no new events). Existing `Resizer Image Downloaded` stays; add `login_required: true|false`.
8. **Security:** OTP send/verify/rate-limit/expiry stay entirely in the backend and `@clearcut/auth`; the gate only decides *when* to show it. Note: a client-side gate is a UX gate, not access control — the processed image is created in the browser, so a user can still save it from DevTools. If real enforcement matters it needs a server-side step (not proposed here).

## 4. Out of scope / deliberately not done
- **`/start` is not refactored.** `StartAuthForm.tsx` already shares `authApi`, the verification events and the token module; its UI differs (full-page, Truecaller button, UTM handling). Rebuilding it on the modal is high-risk for the main funnel for no user-visible gain. Instead its behaviour is only **regression-tested**.
- No new dependency, no new colours (existing `LoginScreen` styles), no backend change.

## 5. Test plan (headed Playwright via a Sonnet subagent, Razorpay not involved)
- Anonymous download → modal opens with the download copy → OTP success → file downloads automatically, image/preset unchanged.
- Logged-in user → no modal, direct download.
- Wrong OTP, expired OTP, resend cooldown timer, resend count, backend rate limit (429) → correct message, modal stays, work preserved.
- Close/cancel → nothing downloads; reopening works; pending action not run twice.
- Session persistence (reload, second tab via `storage` event).
- Another context (Syllabus Tracker save/load) still works; `/start` login flow unchanged (phone → OTP → redirect).
- hi/mr copy, 360 px mobile layout, keyboard/Esc/focus return, `tsc`, `eslint`, `check:colors`, tools build.
- OTP SMS is a real provider: use the fixture/test numbers or mock `/v1/auth/*`; no real SMS spam.

## 6. Open questions (blocking)
1. **Which tools/actions gate in this phase?** Only the resizer download (every exam page, ~70 % of the site's Google clicks), or also the Age calculator / Add-name-date / view-result?
2. **Product risk, confirm you want it:** a login wall on the highest-traffic page can cut downloads and engagement (and may affect rankings via user behaviour — unverified). Options: gate always, gate from the 2nd download, or show after download as "save for later" instead.
3. **Copy:** approve the English wording ("Verify your mobile number with OTP to download your image for free. No payment required.") and who writes hi/mr, or should I translate?
4. **Cancel behaviour:** if the user closes the modal, nothing downloads (proposed) — OK?
5. **"Previously planned"** — I found no earlier plan file for this in the repo. If one exists elsewhere, point me to it and I will merge it.

## 8. Decisions (2026-10-29)
Only the resizer download is gated. Gate always, copy approved (hi/mr written by us), closing the modal runs nothing. `login_required` on `Resizer Image Downloaded` was NOT added (the `context` property on the auth events was).

## 7. Verification log
Branch `feature/tools-login-gate` (not committed). `tsc` clean, `check:colors` clean, tools has no eslint config.
Live, headed Chrome via Playwright MCP on `next dev` :3055, OTP **mocked** (`/v1/auth/login`, `/varify-otp`, `/me` — no real SMS), TNPSC page:
- PASS download opens modal with the download copy; processed image/state kept behind it
- PASS OTP success -> modal closes, ONE `photo.jpg`, no redirect, token stored
- PASS reload keeps the session -> download runs directly, no modal
- PASS wrong OTP (422) -> error, no download; correct OTP afterwards -> one download
- PASS expired OTP -> "OTP has expired", Resend available, countdown `(30s)` after resend, correct OTP -> one download
- PASS 429 on send-OTP and on verify -> "Too many attempts", modal usable, no crash, retry succeeds
- PASS Escape closes the modal with no download; Download reopens it; login -> exactly one download
- PASS hi and mr modal title/subtitle; 360 px width: no horizontal scroll, modal fits
- NOT RUN: tapping the finished-image button (same handler, not clicked separately), Syllabus Tracker save/load regression, landing `/start` regression, analytics `context` (Amplitude is off on localhost), Safari/in-app-browser download after the async OTP step
Findings: the shared login modal has no `role="dialog"` and no visible close button (Esc works) — pre-existing in `@clearcut/auth`, not changed here.
