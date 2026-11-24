# Phase 127 — HTET: phone + OTP verification before every image download

**Tickets:** (new, from user)
**Repos:** CM (apps/tools)
**Branch:** `phase-127-htet-download-otp` — committed locally, not pushed, not merged, not deployed
**Created / start date:** 2026-11-24
**Status:** In Review — built, unit-tested, static build green, Playwright run; waiting for the user's review and a manual tools deploy

---

## 1. Problem / objective
On the HTET Image Resizer (`clearcutoff.in/tools/resizer/htet`, plus `/hi` and `/mr`), every download must need a verified phone number. HTET only: every other exam keeps its current download behaviour, chosen by the Amplitude flags (phase 71 §12, phase 121). It must be centrally configurable, so another exam can be added with a one-line change.

## 2. Scope
- **In:**
  - A config file that lists the OTP-required exams (HTET on), plugged in where the download mode is resolved.
  - Reuse of the existing `hard_gate` OTP flow and its copy.
  - A backend token check before the file is released.
  - Error and "Try again" UI for a failed check; en/hi/mr copy; tests.
- **Out:**
  - No new OTP flow or new login copy.
  - No backend change.
  - No change for other exams.
  - The saved-photo one-click and cross-exam downloads (phase 121) are unchanged. They only exist for a session the backend already accepted (authenticated list and signed URLs).

## 3. Implementation plan
- [x] `apps/tools/src/config/downloadVerification.ts`: `OTP_REQUIRED_BEFORE_DOWNLOAD = ["htet"]` and `isOtpRequiredBeforeDownload()`.
- [x] `lib/downloadMode.ts` → `resolveDownloadModeFor(exam, flags, devForced)`, the one place the mode is decided:
  - an exam in the config is always `hard_gate` (source `config`);
  - otherwise the localhost dev override (source `dev_override`);
  - otherwise the Amplitude flags, exactly as before (source `amplitude`).
- [x] `lib/api/verifySession.ts`: GET `/v1/auth-user`, the existing `auth:sanctum` endpoint, through the existing `authedRequest`.
  - Result is `valid`, `expired` (no token, or 401; the token is cleared) or `error` (offline, 5xx, 403, timeout after 10 s).
- [x] `lib/useDownloadOptions.tsx`:
  - A config exam does not fetch or wait for the flags.
  - In `hard_gate` with source `config` and a local token, it calls `verifySession` first:
    - `valid` → download (`already_verified`);
    - `expired` → the existing OTP modal (`useLoginGate`, lazy `ToolsAuthGate`, no redirect), then the download;
    - `error` → no download, the token is kept, and `verifyFailed` plus `retryDownload` are returned.
  - The existing `resolving` guard covers the check, so a double tap sends one request.
- [x] `components/ResizeImageTool.tsx`:
  - The Download button shows "Checking…" and is disabled during the check.
  - A failed check shows the existing red error style plus a "Try again" button (the existing `savedImages.retry` copy).
- [x] `lib/dictionary.ts`: `downloadOptions.verifying` / `verifyFailed` in en, hi and mr.
- [x] Analytics, no new events: `download_mode_source` is added to the existing download meta. That meta goes on `Resizer Image Downloaded` and on the login events' `eventProps`.

## 4. Progress / completed changes
- 2026-11-24: implemented on branch `phase-127-htet-download-otp`. Files:
  - `apps/tools/src/config/downloadVerification.ts` (new)
  - `apps/tools/src/lib/api/verifySession.ts` (new) + `verifySession.test.ts` (new)
  - `apps/tools/src/lib/downloadMode.ts` + `downloadMode.test.ts`
  - `apps/tools/src/lib/useDownloadOptions.tsx`
  - `apps/tools/src/components/ResizeImageTool.tsx`
  - `apps/tools/src/lib/dictionary.ts`
  - `docs/DEVELOPMENT_RULES.md` (catalog row)

### How the config works (and how to add an exam)
`apps/tools/src/config/downloadVerification.ts`:
```ts
export const OTP_REQUIRED_BEFORE_DOWNLOAD: readonly string[] = [
  "htet",
];
```
- **How it applies:**
  - An exam slug in this list (lower case, the `<slug>` of `/tools/resizer/<slug>`) is always `hard_gate`. The Amplitude flags and the localhost dev override are ignored for it.
  - Every other exam is unchanged.
- **Adding an exam:** add its slug on a new line, then build and deploy tools (TOOLS_DEPLOY.md). Removing the slug turns the rule off again.
- **Session behaviour:**
  - A visitor whose token the backend accepts downloads at once.
  - No token, an expired token or an invalid token (401) means phone + OTP again.
  - A network error, 5xx or 403 shows "Couldn't confirm your login… try again" with a Try again button. Nothing downloads, and the visitor is never locked out.

**Limit, stated plainly:** this is a browser-side gate. The image is processed in the visitor's browser and the server check only says whether the token is valid. A determined developer can still bypass it, for example by editing the JS or reading the processed image from the page. It stops normal visitors, not a scripted one.

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-24 | New OTP flow or reuse? | Reuse `hard_gate`, one config file, single resolution point (user) |
| 2026-11-24 | Already logged in? | Direct download if the backend accepts the token; otherwise OTP (user) |
| 2026-11-24 | (a) Token check fails with network / 5xx / 403 | Error + Try again; no download, no OTP, token kept; only a 401 clears the session (user, via coordinator) |
| 2026-11-24 | (b) Server check for Amplitude-`hard_gate` exams too? | No, config-listed exams only, so other exams stay exactly as today (user, via coordinator) |

## 6. Blockers / risks
- **Behaviour change for HTET:** HTET used to be on the soft gate (phase 71 testing), and the flags are now ignored for it. A visitor with a session pays one extra `/v1/auth-user` round trip per download.
- **Lint:** `apps/tools` has no ESLint config on `main` (`pnpm --filter tools lint` fails with "couldn't find an eslint.config"). This predates this phase and is not fixed here.

## 7. Dependencies / packages added
None. Reuses `GET /v1/auth-user` (main backend, `auth:sanctum`). No env vars or migrations.

## 8. Tests and verification
- [x] `pnpm --filter tools exec vitest run`: 8 files, 64 tests passed. New cases:
  - HTET is hard_gate with flags null, off, soft, second-download, both on, and with the dev override;
  - other exams are identical to `resolveDownloadMode` for every flag combination;
  - `verifySession` valid / 401 clears the token / no token sends no request / network error / 500 + 403 / timeout.
- [x] `pnpm --filter tools typecheck`: clean.
- [x] `pnpm check:colors`: no new hardcoded colours.
- [x] `pnpm --filter tools build` (static export): green.
- [ ] `pnpm --filter tools lint`: cannot run (no ESLint config in apps/tools; pre-existing).
- [x] Playwright (sonnet subagent, local dev server + local main backend, test number 9988776655 / 4321): results in §8.1.
- [x] Break-it pass: double tap, network failure + retry request count, 401, en/hi/mr at 390px, other exams' request trace.

### 8.1 Playwright results (2026-11-24)
Run by a sonnet subagent against the local tools dev server (:3055) and the local main backend, with test number 9988776655 only and telemetry blocked. The test image was a 400x460 noise JPG.

| # | Scenario | Result |
|---|---|---|
| 1 | HTET logged out | PASS: OTP modal, 0 downloads before verify; after verify 1 download, no navigation; no `/v1/auth-user` and no Amplitude vardata request |
| 2 | HTET logged in | PASS: 1 `GET /v1/auth-user` (200, Bearer), 1 download, no modal |
| 3 | HTET invalid token (set after page load) | PASS: 1 auth-user request → 401, token cleared, OTP modal, 0 downloads; after verify 1 download |
| 4 | HTET check fails (abort, then 500) | PASS: red error + Try again, 0 downloads, token kept, no OTP. Try again = exactly +1 request → 1 download. "Checking…" and disabled during a slow check |
| 5 | Double tap (valid token) | PASS: 1 auth-user request, 1 download |
| 6 | TNPSC and DSSSB, logged in and out | PASS: unchanged direct download (current flags), 0 auth-user requests from the download, vardata still requested |
| 7 | hi and mr at 390px, failed check | PASS: translated error and button, no overflow (`/tools/hi/resizer/htet`, `/tools/mr/resizer/htet`) |
| 8 | Console | PASS: only the intentional 401 / abort / 500 errors |

- **Invalid token at page load:** the existing saved-images list call (phase 121) gets the 401 first and clears the token, so Download opens OTP directly. Same outcome.
- **Wrong OTP:** not exercised. The local backend accepts any OTP for the dummy number 9988776655 (backend test-number behaviour, not part of this change).

### Not verified
- `pnpm --filter tools lint`: there is no ESLint config in `apps/tools` (pre-existing).
- Wrong-OTP rejection: the dummy number accepts any OTP locally.
- Production: the live `apptest` backend, a real Android phone, the FB/IG in-app browsers, and Amplitude event ingestion (blocked in tests; `download_mode_source` checked only in code and unit tests).
- The Hindi screenshot was captured but not viewed by eye; the DOM text and overflow checks passed.

## 9. Next steps
User reviews → merge to `main` → manual tools deploy (TOOLS_DEPLOY.md):
```sh
cd apps/tools
NODE_ENV=production NEXT_PUBLIC_LARAVEL_MAIN_BACKEND=https://apptest.clearcutoff.in/api TOOLS_API_URL=https://tools-api.clearcutoff.in/api/v1 NEXT_PUBLIC_SENTRY_DSN=<tools DSN> NEXT_PUBLIC_SENTRY_ENVIRONMENT=production pnpm build
grep -rl "apptest.clearcutoff.in" out/_next/static/chunks/*.js          # must find it
grep -rl "clearcutoff-main-backend.test" out/_next/static/chunks/*.js   # must find NOTHING
npx wrangler pages deploy out --project-name=clearcut-tools --branch=main --commit-message="Phase 127: OTP before HTET downloads"
```
The Worker does not need redeploying.
