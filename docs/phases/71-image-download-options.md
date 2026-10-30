# Phase 71 — Image download options + free-PDF lead (tools)

**Tickets:** (new, from user)
**Repos:** CM (`apps/tools`, shared `packages/ui`, `packages/auth`). No backend change (a DB table + endpoint was built first and removed again on 2026-10-30 — see the decision log). Landing / dashboard / RN: not touched.
**Branch:** `feature/download-options` in both worktrees (`clearcut-master-attr`, `clearcutoff-backend-attr`) — not committed, not pushed
**Created / start date:** 2026-10-30
**Status:** Implemented and verified locally; frontend of the first version is live (commit 65699ed + tools deploy 82ad0a9c). The DB-less follow-up (this file's current state) is committed locally, NOT pushed or deployed until you say so.

---

## 1. Problem / objective
Phase 68 made every resizer download require OTP login. The approved design (`docs/screens/login-sheet/Clear Cutoff Download Options (2).png`) changes that: after an image is processed, **Download** opens a two-option sheet —
1. **Download Image** — saves immediately, no login, no OTP.
2. **Download Image & Get Free PDF** — opens the existing reusable login modal, verifies the phone with the existing 4-digit OTP, then downloads the processed image automatically. The lead is the verified number (already stored on the user by the login) plus the Amplitude events (§10); **nothing else is stored** (decision 2026-10-30) — the WhatsApp PDF delivery through n8n is out of scope.

## 2. Scope
- **In:** reusable options modal (any image tool), `useDownloadOptions` hook, assets (WebP, lazy), en/hi/mr copy, login-gate preset for the PDF path, Amplitude events, tests on mobile + desktop.
- **Out:** sending the PDF (n8n / WhatsApp), the PDF itself, any server-side record of the request (no table, no endpoint), any change to Syllabus Tracker login, landing/blog login, the OTP flow, dashboard.

## 3. What exists (inspected)
- One component, `apps/tools/src/components/ResizeImageTool.tsx`, serves every image tool (resizer per exam, image/signature compressor, Add Name & Date). It has two Download triggers (tapping the result image, the "Download Image" button) → `handleDownload` → `requireLogin(getLoginGateConfig("download"), saveFile)`.
- `lib/useLoginGate.tsx` + `components/ToolsAuthGate.tsx` + `lib/toolsAuthFeature.ts`: the lazy shared `@clearcut/auth` modal (no redirect, `onAuthenticated` callback, `setAuthContext` puts the gate id on the auth events). Already logged in (token) → the action runs at once. The processed image lives in React state, the modal is an overlay, so nothing is lost during login.
- Session token = shared `CSRF_TOKEN` localStorage key; `lib/api/syllabusTrackerApi.ts` has a private `authedRequest` (plain fetch + Bearer, 401 → end session).
- Backend: `routes/Apis/Tools/*.php` (e.g. `syllabus-tracker.php`, `auth:sanctum`), controllers in `app/Http/Controllers/API/Tools/`, `ApiResponse` helper. Phase 70 already stores attribution facts (`metadata.attribution`) and sets `users.source`; a generic `user_states` table exists but only holds **integer** data, so it cannot carry tool/exam strings.
- Approved design: centred card, logo, hero illustration (photo card + blue download badge), "Your image is ready!", "Choose how you want to download.", option 1 (light-blue tint, image-download round icon, arrow), option 2 (white, purple PDF + WhatsApp round icon, arrow), divider, footer chips "100% Free" (shield) and "Secure & Private" (lock), close X.

## 4. Implementation plan
- [x] Assets: crop hero + two round icons from the approved PNG → `public/images/download/*.webp` (2x, lazy `<img>`, fixed width/height).
- [x] `components/DownloadOptionsModal.tsx` — presentational, generic (copy + two callbacks), built on the shared modal / bottom sheet (`@clearcut/ui/modals-bottom-sheet`: modal on desktop, bottom sheet on phones); lazy-loaded (`next/dynamic`) by the hook so no tool carries it in its first load.
- [x] `lib/useDownloadOptions.tsx` — `const { requestDownload, modals } = useDownloadOptions({ locale, track }); requestDownload((meta) => save(meta), { tool })`. Option 1 → `save(meta)`. Option 2 → `requireLogin(getLoginGateConfig("download-pdf", locale), …)` → `save(meta)` once verified (an already-logged-in visitor skips the OTP).
- [x] `loginGate.ts`: preset `download` replaced by `download-pdf` (en/hi/mr); `eventProps`; `useLoginGate.requireLogin` tells the action whether this call verified the number.
- [x] `ResizeImageTool.tsx`: both Download triggers call `requestDownload`; `Resizer Image Downloaded` carries the meta.
- [x] Dictionary strings en/hi/mr (`downloadOptions.*`); `lib/toolId.ts`; `lib/api/authedRequest.ts` (shared helper split out of the tracker API).
- [x] Docs / rules: this file, phases README, DEVELOPMENT_RULES, phase 68 note.

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-10-30 | Where is the number + tool info stored? | **Not stored in the DB (user: "DB mein track nahi karna, Amplitude kaafi hai").** A `tool_pdf_requests` table + `POST /api/tools/pdf-requests` was built, pushed (backend `d1fd2d0`) and then removed again (revert `1cd962c`); its migration was never run in production, so the database was never changed. The number is on the user row from the login; the tool context is in Amplitude (`Resizer Free PDF Requested`, `Resizer Image Downloaded` with `pdf_requested = true`). |
| 2026-10-30 | Does "Download Image" need login? | No (user, in the request). This reverses phase 68's gate **for downloads only**; Syllabus Tracker keeps its login. Side effect: fewer OTP verifications from tools; only the PDF path produces a verified user + `source=organic`. |
| 2026-10-30 | Already-logged-in visitor picks the PDF option | Downloads immediately without a second OTP (the number is already verified); the same Amplitude events fire with `otp_verification_status = already_verified`. |
| 2026-10-30 | Analytics: reuse or new events? | Reuse: `Resizer Image Downloaded` (the one real "file saved" event, both paths) and the shared auth events (`context` + `tool_name`/`tool_page`/`download_option`, no new auth events). New (nothing existing records these decisions): `Resizer Download Options Viewed`, `Resizer Download Option Selected`, `Resizer Download Options Dismissed`, `Resizer Free PDF Requested`. Names follow the tools convention (`Resizer …`, Title Case, snake_case properties, common `exam_name`/`document_type`/`locale` from `trackResizer`). Option values are `image_only` / `image_with_free_pdf`. |
| 2026-10-30 | Which modal shell? | Not a new one (user: "feature modal already exists — modal on desktop, bottom sheet on mobile, use that"). The blog's `CustomModal` / `CustomBottomSheet` (`useIsMobile() ? Sheet : Modal`) moved to `@clearcut/ui/modals-bottom-sheet`; blog keeps its import path through a one-line re-export (blog tsc unchanged at 34 pre-existing errors). Additive `ariaLabel` prop for panels without a header. Tools now depends on `@clearcut/hooks` (3-line lockfile change). |

## 6. Blockers / risks
- Fewer verified users from Tools (by design). Amplitude: see §10 — the existing `Resizer Image Downloaded` event is reused with extra properties, the login events carry the download context, and only the three decision-point events + `Resizer Free PDF Requested` are new.
- The copy promises a "free practice questions PDF on WhatsApp"; nothing is sent yet and there is no server-side list of who asked — a later n8n job must read the leads from Amplitude (cohort: `Resizer Free PDF Requested`) or from a new, separately approved store. Make sure that exists before the option is promoted.
- The first version (with the DB request) is already live in tools; until the DB-less follow-up is deployed, the live build still calls `POST /api/tools/pdf-requests` (the backend route exists but its table does not, so it returns an error and the browser keeps the request queued — downloads are unaffected).

## 7. Dependencies / packages added
`@clearcut/hooks` added to `apps/tools` (workspace link, 3-line lockfile change). No env vars, no migration, no backend change.

## 8. Tests and verification
- [x] `tsc` (tools, ui, blog), `check:colors` (tools has no eslint config)
- [ ] `next build` (static export) + deploy checks from `TOOLS_DEPLOY.md` — at deploy time
- [x] Playwright (headed, no real SMS): mobile + desktop modal look vs the reference; option 1 downloads at once, no login; option 2 → login modal → OTP → download once; already-logged-in path; close X / Escape / overlay; processed image still present after closing the login modal; en/hi
- [x] Amplitude payloads captured from the real SDK (§10)

## 9. Verification results (2026-10-30)
- Two rounds. **Round 1** (the DB version, now removed): backend feature tests 14/14 on a scratch MySQL, endpoint round trip, offline queue — kept only as history. **Round 2** (final, no DB): `tsc` tools 0 / ui 0 / blog 34 (unchanged); `check:colors` green; the Amplitude events below re-captured after the removal.
- Headed Chromium (local backend on a scratch DB for the real OTP, every non-local request aborted): mobile (bottom sheet) and desktop (centred modal) match the approved image; en + hi checked; no horizontal overflow. Download Image → file at once, no login, no backend call; close X / Escape / overlay → nothing downloads; PDF option → login modal over the page, processed image still there; closing the login downloads nothing; PDF option → real OTP → file downloads once; already logged in → no OTP.
- Test-setup note: Playwright `isMobile` emulation in a headed Windows Chrome (125 % display scaling) maps mouse coordinates by 0.8 — clicks land beside the target; test phone widths with a plain narrow viewport instead.
- Analytics payloads (§10): captured from the real SDK in headed Chromium with the browser's opt-in (`cc-analytics-local`) and every Amplitude request answered locally — nothing reached the live project; no duplicate events in any run.
- NOT run: real iOS / Android devices, Instagram in-app browser, landing/blog (untouched; blog only re-exports the moved modal file).

## 10. Amplitude tracking specification (verified 2026-10-30)
Project: Amplitude **673721** (the same one `Page Viewed`, `Resizer Image Processed` and the login events already use). Tools only sends events from the production host (`clearcutoff.in`), so nothing appears until this is deployed. Every Tools event also gets Amplitude's built-in `[Amplitude] Page *` properties; they are left out below.

**Common properties** (added by the tool's `trackResizer` to every `Resizer …` event): `exam_name` (e.g. `TNPSC`, null off exam pages), `document_type` (preset: `photo`, `signature`, …), `locale` (`en|hi|mr`). **Context properties** (added by `useDownloadOptions`): `tool_name` (`resizer`, `image-compressor`, `signature-compressor`, `add-name-date` — from the route), `tool_page` (real page path without locale, e.g. `/tools/resizer/tnpsc`, same normalisation as `attribution_page`).

### Events, when they fire, and what they carry
| # | Event | New? | Fires (exactly once per…) | Properties (besides common) |
|---|---|---|---|---|
| 1 | `Resizer Download Options Viewed` | new | each time the "Your image is ready!" sheet opens (Download button or tapping the result image) | `tool_name`, `tool_page`, `logged_in` (a session existed at that moment) |
| 2 | `Resizer Download Option Selected` | new | each time an option is tapped (a second tap on the closing sheet is ignored) | `tool_name`, `tool_page`, `download_option` (`image_only` or `image_with_free_pdf`), `authentication_required` (true only for the PDF option when there was no session) |
| 3 | `Resizer Download Options Dismissed` | new | the sheet is closed without choosing (X, Escape, tap outside) | `tool_name`, `tool_page` |
| 4 | `Authentication Options Viewed`, `Authentication Method Selected`, `Verification Sent`, `Verification Resent`, `Verification Failed`, `Authentication Outcome` | existing (shared login) | as before — only while the login was opened from the PDF option | the existing ones **plus** `context = "download-pdf"`, `tool_name`, `tool_page`, `download_option`. OTP result per attempt = `Authentication Outcome.outcome` (`successful` or `failed`) + `failure_reason` (`incorrect_otp`, …). Not fired at all when a session already existed. |
| 5 | `Resizer Image Downloaded` | **existing**, reused | the processed file is actually saved (both paths; the old trigger, so existing funnels keep working) | existing `in_app_browser` **plus** `tool_name`, `tool_page`, `download_option`, `authentication_required` (this very download needed OTP verification), `otp_verification_status` (`not_required`, `already_verified` or `verified`), `pdf_requested` |
| 6 | `Resizer Free PDF Requested` | new | right after the file is saved by the PDF option (the lead signal: this verified number asked for the free PDF); never for the plain download | `tool_name`, `tool_page`, `download_option`, `otp_verification_status` |

Not tracked on purpose: closing the **login** modal without verifying has no event of its own — read it as a funnel drop (`Option Selected` with `download_option = image_with_free_pdf` and `authentication_required = true`, but no `Resizer Image Downloaded`). An upload/processing failure never reaches this sheet. No duplicates: the sheet's handlers clear their pending state before tracking, `Image Downloaded` is fired only by the one save function, and the auth events keep their existing once-per-attempt rules.

### Example payloads (captured from the real run, §9)
**Path 1 — Download Image (no login):** Viewed → Selected → Downloaded
```json
{"event":"Resizer Download Options Viewed","props":{"exam_name":"TNPSC","document_type":"photo","locale":"en","tool_name":"resizer","tool_page":"/tools/resizer/tnpsc","logged_in":false}}
{"event":"Resizer Download Option Selected","props":{"exam_name":"TNPSC","document_type":"photo","locale":"en","tool_name":"resizer","tool_page":"/tools/resizer/tnpsc","download_option":"image_only","authentication_required":false}}
{"event":"Resizer Image Downloaded","props":{"exam_name":"TNPSC","document_type":"photo","locale":"en","in_app_browser":false,"tool_name":"resizer","tool_page":"/tools/resizer/tnpsc","download_option":"image_only","authentication_required":false,"otp_verification_status":"not_required","pdf_requested":false}}
```
**Path 2 — Download Image & Get Free PDF (phone + 4-digit OTP; one wrong OTP, then the right one):**
```json
{"event":"Resizer Download Options Viewed","props":{"exam_name":"TNPSC","document_type":"photo","locale":"en","tool_name":"resizer","tool_page":"/tools/resizer/tnpsc","logged_in":false}}
{"event":"Resizer Download Option Selected","props":{"exam_name":"TNPSC","document_type":"photo","locale":"en","tool_name":"resizer","tool_page":"/tools/resizer/tnpsc","download_option":"image_with_free_pdf","authentication_required":true}}
{"event":"Authentication Options Viewed","props":{"initial_intent":"login","options_available":"phone","tool_name":"resizer","tool_page":"/tools/resizer/tnpsc","download_option":"image_with_free_pdf","context":"download-pdf"}}
{"event":"Authentication Method Selected","props":{"auth_method":"phone_otp","tool_name":"resizer","tool_page":"/tools/resizer/tnpsc","download_option":"image_with_free_pdf","context":"download-pdf"}}
{"event":"Verification Sent","props":{"user_phone":"98350*****","verification_method":"Number","verification_mode":"SMS","verification_purpose":"Login","attribution_page":"/tools/resizer/tnpsc","attribution_app":"tools","tool_name":"resizer","tool_page":"/tools/resizer/tnpsc","download_option":"image_with_free_pdf","context":"download-pdf"}}
{"event":"Authentication Outcome","props":{"outcome":"failed","auth_method":"phone_otp","failure_reason":"incorrect_otp","attribution_page":"/tools/resizer/tnpsc","attribution_app":"tools","tool_name":"resizer","tool_page":"/tools/resizer/tnpsc","download_option":"image_with_free_pdf","context":"download-pdf"}}
{"event":"Authentication Outcome","props":{"outcome":"successful","auth_method":"phone_otp","attribution_page":"/tools/resizer/tnpsc","attribution_app":"tools","tool_name":"resizer","tool_page":"/tools/resizer/tnpsc","download_option":"image_with_free_pdf","context":"download-pdf"}}
{"event":"Resizer Image Downloaded","props":{"exam_name":"TNPSC","document_type":"photo","locale":"en","in_app_browser":false,"tool_name":"resizer","tool_page":"/tools/resizer/tnpsc","download_option":"image_with_free_pdf","authentication_required":true,"otp_verification_status":"verified","pdf_requested":true}}
{"event":"Resizer Free PDF Requested","props":{"exam_name":"TNPSC","document_type":"photo","locale":"en","tool_name":"resizer","tool_page":"/tools/resizer/tnpsc","download_option":"image_with_free_pdf","otp_verification_status":"verified"}}
```
(`Verification Sent.user_phone` is the existing shared-login property — the number as typed; masked here.) **Path 2b — already verified:** `Viewed` has `logged_in:true`; `Selected.authentication_required:false`; no auth events; `Image Downloaded` carries `authentication_required:false` and `otp_verification_status:"already_verified"`; `Free PDF Requested` the same status. **Dismissed:** `{"event":"Resizer Download Options Dismissed","props":{"exam_name":"TNPSC","document_type":"photo","locale":"en","tool_name":"resizer","tool_page":"/tools/resizer/tnpsc"}}`.

### Where to find them in Amplitude (project 673721)
- **Data → Events** (or any chart's event picker): search `Resizer Download` for events 1–3, plus `Resizer Image Downloaded` and `Resizer Free PDF Requested`. New events and properties appear in the picker some minutes after the first live event, and may need to be marked visible in Data → Events if governance hides unplanned ones.
- Login events: the usual `Verification Sent` / `Authentication Outcome`, filtered by event property `context = download-pdf` (or `download_option = image_with_free_pdf`).
- Suggested funnel (Funnel chart, group by `download_option`): `Resizer Image Processed` → `Resizer Download Options Viewed` → `Resizer Download Option Selected` → `Resizer Image Downloaded`. PDF path only: `Option Selected` (`authentication_required = true`) → `Authentication Outcome` (`outcome = successful`, `context = download-pdf`) → `Resizer Free PDF Requested`.
- The PDF lead list = a cohort of users who did `Resizer Free PDF Requested` (the verified number is on the user row from the login); nothing is stored in the database for this feature.

## 11. Next steps
On your go-ahead: push the backend revert (`1cd962c`, removes the unused endpoint — its migration was never run, so no DB change), push the frontend follow-up, rebuild and redeploy tools. Before the PDF option is promoted, decide how n8n gets the lead list (Amplitude cohort or a new store).
