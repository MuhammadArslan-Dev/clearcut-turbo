# Phase 71 — Image download options + free-PDF lead (tools)

**Tickets:** (new, from user)
**Repos:** CM (`apps/tools`) · BE (`clearcutoff-main-backend`). Landing / blog / dashboard / RN: not touched.
**Branch:** `feature/download-options` in both worktrees (`clearcut-master-attr`, `clearcutoff-backend-attr`) — not committed, not pushed
**Created / start date:** 2026-10-30
**Status:** Implemented and verified locally (2026-10-30); NOT committed, pushed or deployed. Deploy order when approved: backend first (new table + endpoint; tools degrades safely without it), then tools.

---

## 1. Problem / objective
Phase 68 made every resizer download require OTP login. The approved design (`docs/screens/login-sheet/Clear Cutoff Download Options (2).png`) changes that: after an image is processed, **Download** opens a two-option sheet —
1. **Download Image** — saves immediately, no login, no OTP.
2. **Download Image & Get Free PDF** — opens the existing reusable login modal, verifies the phone with the existing 4-digit OTP, then downloads the processed image automatically; the verified number and the tool context are stored so a practice-questions PDF can later be sent on WhatsApp through n8n (delivery itself is out of scope).

## 2. Scope
- **In:** reusable options modal (any image tool), `useDownloadOptions` hook, assets (WebP, lazy), en/hi/mr copy, login-gate preset for the PDF path, backend table + endpoint that records the request after verification, analytics properties, tests on mobile + desktop.
- **Out:** sending the PDF (n8n / WhatsApp), the PDF itself, any change to Syllabus Tracker login, landing/blog login, the OTP flow, `@clearcut/auth` internals, dashboard.

## 3. What exists (inspected)
- One component, `apps/tools/src/components/ResizeImageTool.tsx`, serves every image tool (resizer per exam, image/signature compressor, Add Name & Date). It has two Download triggers (tapping the result image, the "Download Image" button) → `handleDownload` → `requireLogin(getLoginGateConfig("download"), saveFile)`.
- `lib/useLoginGate.tsx` + `components/ToolsAuthGate.tsx` + `lib/toolsAuthFeature.ts`: the lazy shared `@clearcut/auth` modal (no redirect, `onAuthenticated` callback, `setAuthContext` puts the gate id on the auth events). Already logged in (token) → the action runs at once. The processed image lives in React state, the modal is an overlay, so nothing is lost during login.
- Session token = shared `CSRF_TOKEN` localStorage key; `lib/api/syllabusTrackerApi.ts` has a private `authedRequest` (plain fetch + Bearer, 401 → end session).
- Backend: `routes/Apis/Tools/*.php` (e.g. `syllabus-tracker.php`, `auth:sanctum`), controllers in `app/Http/Controllers/API/Tools/`, `ApiResponse` helper. Phase 70 already stores attribution facts (`metadata.attribution`) and sets `users.source`; a generic `user_states` table exists but only holds **integer** data, so it cannot carry tool/exam strings.
- Approved design: centred card, logo, hero illustration (photo card + blue download badge), "Your image is ready!", "Choose how you want to download.", option 1 (light-blue tint, image-download round icon, arrow), option 2 (white, purple PDF + WhatsApp round icon, arrow), divider, footer chips "100% Free" (shield) and "Secure & Private" (lock), close X.

## 4. Implementation plan
Backend
- [x] Migration `tool_pdf_requests`: `id`, `user_id` (FK users, cascade), `phone` (copy of the verified number — n8n needs no join), `kind` (default `free_practice_pdf`), `status` (`pending|sent|failed`, default `pending`), `tool`, `exam` (nullable), `preset` (nullable), `locale`, `request_count`, `first_requested_at`, `last_requested_at`, `delivered_at` (nullable), timestamps; **unique(user_id, kind)** (one free PDF per user — repeat downloads only bump `request_count`/last tool, never re-queue a sent one); index `(kind, status)` for the n8n poll.
- [x] Model `ToolPdfRequest`, controller `API/Tools/ToolPdfRequestController@store`, route file `routes/Apis/Tools/pdf-requests.php` → `POST /api/tools/pdf-requests` (`auth:sanctum`, `throttle`), validated slugs only (`tool`, `exam`, `preset`: `^[a-z0-9_-]{1,64}$`; `locale` en|hi|mr). The number comes from the authenticated user, never from the body. Idempotent (upsert).
- [x] Feature tests (MySQL scratch DB): first request creates a pending row with the user's phone; repeat → same row, count + 1, status untouched; invalid slugs / locale → 422; unauthenticated → 401; another user's id in the body is ignored.
Frontend (tools)
- [x] Assets: crop hero + two round icons from the approved PNG → `public/images/download/*.webp` (2x, lazy `<img>`, fixed width/height).
- [x] `components/DownloadOptionsModal.tsx` — presentational, generic (copy + two callbacks), `role="dialog"`, Escape/close X/overlay close, focus moved in; lazy-loaded (`next/dynamic`) by the hook so the tool's first load does not carry it. Reuses `Overlay`, tokens, `Text`; flag/lock icons from existing parts.
- [x] `lib/useDownloadOptions.tsx` — `const { requestDownload, modal } = useDownloadOptions(); requestDownload({ save, tool: {...} })`. Option 1 → `save()`. Option 2 → `requireLogin(getLoginGateConfig("download-pdf", locale), async () => { save(); await recordPdfRequest(tool) })`. Already-logged-in users skip the OTP and are still recorded.
- [x] `lib/api/authedRequest.ts` (move of the private helper, `syllabusTrackerApi` keeps working) + `lib/api/pdfRequestApi.ts` (`recordPdfRequest`, one retry, then a small localStorage queue that is flushed on the next tool load — a lead is never silently dropped).
- [x] `loginGate.ts`: replace the phase-68 `download` preset with `download-pdf` (en/hi/mr: title "Verify your number to get your free PDF", button "Verify & Download").
- [x] `ResizeImageTool.tsx`: both triggers call `requestDownload`; analytics (see §6).
- [x] Dictionary strings en/hi/mr (`downloadOptions.*`).
Docs / rules
- [x] This file, phases README, DEVELOPMENT_RULES (reusable pattern + "Download no longer requires login"), phase 68 note.

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-10-30 | Where is the number + tool info stored? | New table `tool_pdf_requests` (my choice, easy to veto): `users.metadata` JSON is awkward for n8n to poll, and `user_states` holds only integers. One row per user, additive migration, no change to existing tables. |
| 2026-10-30 | Does "Download Image" need login? | No (user, in the request). This reverses phase 68's gate **for downloads only**; Syllabus Tracker keeps its login. Side effect: fewer OTP verifications from tools; only the PDF path produces a verified user + `source=organic`. |
| 2026-10-30 | Already-logged-in visitor picks the PDF option | Downloads immediately and is recorded without a second OTP (the number is already verified). |
| 2026-10-30 | Analytics: reuse or new events? | Reuse: `Resizer Image Downloaded` (the one real "file saved" event, both paths) and the shared auth events (`context` + `tool_name`/`tool_page`/`download_option`, no new auth events). New (nothing existing records these decisions): `Resizer Download Options Viewed`, `Resizer Download Option Selected`, `Resizer Download Options Dismissed`, `Resizer Free PDF Requested`. Names follow the tools convention (`Resizer …`, Title Case, snake_case properties, common `exam_name`/`document_type`/`locale` from `trackResizer`). Option values are `image_only` / `image_with_free_pdf`. |
| 2026-10-30 | Which modal shell? | Not a new one (user: "feature modal already exists — modal on desktop, bottom sheet on mobile, use that"). The blog's `CustomModal` / `CustomBottomSheet` (`useIsMobile() ? Sheet : Modal`) moved to `@clearcut/ui/modals-bottom-sheet`; blog keeps its import path through a one-line re-export (blog tsc unchanged at 34 pre-existing errors). Additive `ariaLabel` prop for panels without a header. Tools now depends on `@clearcut/hooks` (3-line lockfile change). |
| 2026-10-30 | Deleted accounts | Users are soft-deleted, so the FK cascade alone would keep a deleted account's request deliverable: the delivery workflow must read `ToolPdfRequest::deliverable()` (pending AND account exists). |

## 6. Blockers / risks
- ⚠️ Backend migration + endpoint → needs your go-ahead to deploy; the tools app degrades safely if the endpoint is absent (download still works, the request is queued locally and retried).
- ⚠️ Fewer verified users from Tools (by design). Amplitude: see §10 — the existing `Resizer Image Downloaded` event is reused with extra properties, the login events carry the download context, and only the three decision-point events + the PDF-request result are new.
- The copy promises a "free practice questions PDF on WhatsApp"; nothing is sent yet — make sure n8n is ready before the option goes live in production.
- Phone stored twice (users + request row) — deliberate (n8n convenience); covered by the same account-deletion cascade.

## 7. Dependencies / packages added
None (no npm/composer packages). One migration. No env vars.

## 8. Tests and verification
- [x] Backend feature tests on scratch MySQL, Pint
- [x] `tsc` (tools, ui, blog), `check:colors` (tools has no eslint config)
- [ ] `next build` (static export) + deploy checks from `TOOLS_DEPLOY.md` — at deploy time
- [x] Playwright (headed, auth API mocked, no real SMS): mobile 390×844 + 360×640 and desktop 1536×703: modal look vs reference; option 1 downloads at once, no login; option 2 → login modal → OTP → download once + request recorded; already-logged-in path; close X / Escape / overlay; processed image still present after closing the login modal; en/hi/mr
- [x] Real local backend + scratch DB for the endpoint round trip

## 9. Verification results (2026-10-30)
- Backend (scratch MySQL `clearcut_pdf_test`, since dropped when the work is closed): `ToolPdfRequestTest` 14 tests pass (401 without a token; first request pending with the user's own number; idempotent count; sent/failed never re-queued; body phone/user_id/status ignored; 6 invalid-slug/locale cases → 422; soft-deleted/force-deleted users; `deliverable()` scope); Pint clean; migration up → down → up OK.
- Frontend: `tsc` tools 0 / ui 0 / blog 34 (unchanged); `check:colors` green. Headed Chromium, auth API = real local backend on the scratch DB (OTP read from the DB, SMS jobs never run), every non-local request aborted:
  - mobile (bottom sheet) and desktop (centred modal) match the approved image; en + hi checked; no horizontal overflow.
  - Download Image → file at once, no login, no backend call; close X / Escape / overlay → nothing downloads; PDF option → login modal over the page, processed image still there; closing the login downloads nothing and records nothing.
  - PDF option → real OTP → file downloads once → `POST /api/tools/pdf-requests` → row `pending` with the verified number, tool/exam/preset; attribution (`users.metadata`, `source=organic`) still written by the existing login.
  - already logged in → no OTP, download + request (count 2); `image-compressor` page → `tool = image-compressor`.
  - backend unreachable → file still downloads, request queued in localStorage, sent and cleared on the next page load.
- Test-setup note: Playwright `isMobile` emulation in a headed Windows Chrome (125 % display scaling) maps mouse coordinates by 0.8 — clicks land beside the target; test phone widths with a plain narrow viewport instead.
- Analytics payloads (§10): captured from the real SDK in headed Chromium with the browser's opt-in (`cc-analytics-local`) and every Amplitude request answered locally — nothing reached the live project; path 1, path 2 (wrong then right OTP), path 2b (already verified) and Dismissed all matched the tables; no duplicate events in any run.
- NOT run: real iOS / Android devices, Instagram in-app browser, `next build` + `TOOLS_DEPLOY.md` checks (done at deploy time), landing/blog (untouched; blog only re-exports the moved modal file).

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
| 6 | `Resizer Free PDF Requested` | new | the backend call that stores the free-PDF request finishes (PDF option only, after the download) | `tool_name`, `tool_page`, `download_option`, `otp_verification_status`, `request_saved` (true = stored on the server, false = queued in the browser and retried on the next Tools page load) |

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
{"event":"Resizer Free PDF Requested","props":{"exam_name":"TNPSC","document_type":"photo","locale":"en","tool_name":"resizer","tool_page":"/tools/resizer/tnpsc","download_option":"image_with_free_pdf","otp_verification_status":"verified","request_saved":true}}
```
(`Verification Sent.user_phone` is the existing shared-login property — the number as typed; masked here.) **Path 2b — already verified:** `Viewed` has `logged_in:true`; `Selected.authentication_required:false`; no auth events; `Image Downloaded` carries `authentication_required:false` and `otp_verification_status:"already_verified"`; `Free PDF Requested` the same status. **Dismissed:** `{"event":"Resizer Download Options Dismissed","props":{"exam_name":"TNPSC","document_type":"photo","locale":"en","tool_name":"resizer","tool_page":"/tools/resizer/tnpsc"}}`.

### Where to find them in Amplitude (project 673721)
- **Data → Events** (or any chart's event picker): search `Resizer Download` for events 1–3, plus `Resizer Image Downloaded` and `Resizer Free PDF Requested`. New events and properties appear in the picker some minutes after the first live event, and may need to be marked visible in Data → Events if governance hides unplanned ones.
- Login events: the usual `Verification Sent` / `Authentication Outcome`, filtered by event property `context = download-pdf` (or `download_option = image_with_free_pdf`).
- Suggested funnel (Funnel chart, group by `download_option`): `Resizer Image Processed` → `Resizer Download Options Viewed` → `Resizer Download Option Selected` → `Resizer Image Downloaded`. PDF path only: `Option Selected` (`authentication_required = true`) → `Authentication Outcome` (`outcome = successful`, `context = download-pdf`) → `Resizer Free PDF Requested` (`request_saved = true`).
- Server truth for the PDF queue is the backend table `tool_pdf_requests` (Grafana: rows from `ToolPdfRequest::deliverable()` = pending PDFs), not Amplitude.

## 11. Next steps
Commit and deploy on your go-ahead: backend (migration + endpoint) first, then tools. Before the PDF option goes live make sure the n8n/WhatsApp workflow exists and reads `ToolPdfRequest::deliverable()`.
