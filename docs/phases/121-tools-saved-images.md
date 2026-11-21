# Phase 121 — CC-174: Tools save photo & signature, OTP on 2nd download, one-click for other exams

**Tickets:** CC-174 (includes merged CC-155 gate rules). The user said on 2026-11-20: build exactly what CC-174 says. This replaces the earlier pasted request (guest browser storage etc.).
**Repos:** CM (`apps/tools`, `apps/dashboard` account page) · BE (`clearcutoff-main-backend`)
**Branch:** `feature/cc174-tools-saved-images` in both repos. Not created yet.
**Created / start date:** 2026-11-20
**Status:** Blocked – Decision. The plan is written; it waits for the user's answers in §5 before any code.

---

## 1. Problem / objective
Students fill forms for several exams and resize the same photo and signature every time. Save the images once, after OTP **and** consent; after that, every other exam is a one-click download. Each extra exam download also tells us which exams the student is applying for. Today nothing is stored anywhere: image bytes live only in React state, the backend has no user-file upload and no table for it, and no S3/R2 disk is configured.

## 2. Scope (= CC-174 + CC-155)
- **In:**
  1. The first download stays free. No popup or login on page load.
  2. **2nd download** → the inline OTP sheet (shared `AuthModal`, `LoginCopy`) with the copy "Verify to save your photo & signature for all future exam forms" and a consent checkbox: "Save my photo & signature to my account. I can delete them anytime." After OTP the download continues on the page, with no redirect. Users already verified or logged in are never asked again on any tool page.
  3. After verification, **with consent only**, store the **original high-res upload** (photo and/or signature) against the user. One of each per user; the newest replaces the old one.
  4. After a download, show "Also applying for CTET / HPTET / REET? Download in one click." This builds that exam's file from the stored original with that exam's spec (size, KB, format, background, name/date). It reuses the existing spec config and `resizeAndCompress`.
  5. A returning logged-in user on any tool page sees "Your saved photo / signature" with one-click download, or can upload a new one.
  6. "Delete my saved photos" on the tool page **and** on the account page (dashboard Profile). It is a hard delete of the file and the row.
  7. Each verified user is stored as a **tool lead**: phone (already on the user row), tool, exam, UTM/referrer, time.
  8. Amplitude events per the ticket (see D3), plus the `is_operator` user property.
- **Out:** thumb, declaration and "Add Name & Date" presets (the ticket says photo and signature); landing's separate copy of the tool; guest browser storage (not in CC-174, which allows storing nothing without OTP + consent); the 2-week Search Console/LCP watch after release (a user/ops task, noted in §9).

## 3. Implementation plan

### Backend (`clearcutoff-main-backend`)
- [ ] Migration `user_tool_images`: `id`, `uuid`, `user_id` FK cascade, `kind` (`photo|signature`), `disk`, `path`, `mime`, `size_bytes`, `width`, `height`, `sha256`, `consented_at`, `source_exam` nullable, timestamps. Unique `(user_id, kind)`.
- [ ] Migration `tool_leads` (unless D4 says otherwise): `user_id`, `tool`, `exam`, `utm_*`, `referrer`, `created_at`. One row per user + tool + exam (duplicates update the time).
- [ ] `UserToolImage` model (HasUuid), `ToolImageService` (replace = new file + row in a transaction, old file deleted after commit), `API/Tools/SavedImageController`, Resource with a field whitelist (no path, no numeric id).
- [ ] Routes `routes/Apis/Tools/saved-images.php`, `auth:sanctum`:
  - `GET /tools/saved-images` returns metadata plus a **short-lived signed URL** (`URL::temporarySignedRoute`, 5 min, unguessable uuid, `Cache-Control: private, no-store`).
  - `POST /tools/saved-images`: multipart `kind`, `file`, `consent=1` (required, else 422), upload throttle 20/min.
  - `DELETE /tools/saved-images` (all) and `DELETE /tools/saved-images/{kind}`.
  - Signed file route: valid signature + owner, otherwise 404.
- [ ] Validation: `mimes:jpeg,png,webp`, max 10 MB (the tool's own upload limit), real-image check, max dimension ~6000 px. The server computes SHA-256; the same hash as the stored file means 200 with no write.
- [ ] Private storage: `tool-images/{user_uuid}/{random40}.{ext}`. Production location per **D1**.

### Frontend (`apps/tools`)
- [ ] Download counter: a per-browser count of successful downloads. Download 1 = free, download 2+ without a session = the OTP gate (see D2 for how this fits the existing `legacy/hard_gate/soft_gate` Amplitude flags).
- [ ] Gate copy and consent checkbox: through the `LoginCopy` override plus a tools-only consent slot. Check whether the shared `AuthModal` needs a small **additive** optional prop (default = old behaviour; blog/landing unchanged).
- [ ] Keep the current upload's original in memory, so after OTP + consent it can be uploaded (`savedImagesApi.upload`). Failure: 1 retry, then a quiet "couldn't save, try again" message. The download itself never waits on the save.
- [ ] `SavedImagesPanel` (tool page, logged-in): thumbnails, one-click "Download for this exam", "Upload new", "Delete my saved photos". One-click = fetch the original by signed URL → `resizeAndCompress` with this page's spec → the existing `saveFile`/`requestDownload` path.
- [ ] `OtherExamsOneClick` after a download: exams from the existing resizer data (same category / recent exams `cc-resizer-recent-exams`), each building from the stored original with that exam's spec. Only shown when saved images exist.
- [ ] Strings in en/hi/mr (the tool's own `messages`). Lazy-load all new code after the tool mounts (tool LCP must not drop).

### Dashboard (`apps/dashboard`) — account page
- [ ] Profile → "Saved tool photos": a list with a "Delete my saved photos" button (calls the same DELETE through `apiFetch`), en/hi/mr. It only shows when the user has some.

### Analytics (CC-174 + CC-155 names, see D3)
`tool_download` (exam, source_exam, is_cross_exam, asset_type, used_saved_image, upload_count), `tool_save_consent_given`, `tool_saved_images_deleted`, `tool_first_download`, `tool_gate_viewed`, `tool_gate_verified`, `tool_gate_dismissed`, `tool_download_after_verify`. User property `is_operator = true` when an account has 3+ uploads or downloads for 5+ exams (computed on the backend from `user_tool_images` + `tool_leads`, sent with the existing server Amplitude service). No phone number in any URL, analytics or Sentry event.

### Tests
- [ ] Pest `tests/Feature/ToolSavedImagesApiTest.php` (`DatabaseTransactions` + `Storage::fake`, never `RefreshDatabase`). Cases: upload with consent; without consent 422; replace; duplicate sha is a no-op; bad mime, oversize or not-an-image 422; another user's token 404; expired or tampered signed URL 404; delete removes the file; unauthenticated 401; throttle; lead upsert.
- [ ] Vitest (tools): the download-counter/gate decision, spec building from an original, and the cross-exam list.
- [ ] Playwright E2E through a **Sonnet** subagent, with real clicks and a real file chooser, against a tools dev server and the local backend, with ingest blocked. Flow: download 1 free → download 2 shows the OTP gate with copy + checkbox → verify (dummy phone, OTP 4321) → the download continues, no redirect → DB row + file exist only when the box was ticked → "Also applying for…" one-click gives the correct size/KB for another exam → new context, same user: "Your saved photo / signature" works → delete on the tool page, and on the dashboard Profile, removes the file + row. Plus: gate dismissed, upload 500 then retry, double tap, en/hi/mr at 390 px, existing download modes, and the Syllabus Tracker login unchanged.

## 4. Progress / completed changes
- 2026-11-20 — Inventory (read-only). First plan from the pasted request, then rewritten to CC-174 on the user's instruction.
- 2026-11-20 — Built on `feature/cc174-tools-saved-images` (both repos, uncommitted):
  - BE: migrations `2026_11_20_100000_create_user_tool_images_table`, `2026_11_20_100100_create_tool_leads_table` (VIRTUAL `exam_key` for the nullable unique); `Models/UserToolImage`, `Models/ToolLead`; `Services/Tools/ToolImageService` (private `local` disk, replace-after-commit, same-sha no-op, relative 5-min signed URL), `Services/Tools/ToolLeadService` (first-touch UTM, download count, `is_operator` `$identify` once per account via `Cache::add`); `API/Tools/SavedImageController`; `routes/Apis/Tools/saved-images.php` (+ `require` in `routes/api.php`); limiter `tool-image-upload` 20/min; `tests/Feature/ToolSavedImagesApiTest.php` (12 tests).
  - Shared: `packages/auth` `LoginCopy.extraContent` (optional, rendered under the phone note; absent = unchanged).
  - Tools: `lib/downloadMode.ts` (3rd flag + `devForcedDownloadMode` localhost-only QA override), `lib/experiment.ts` (flag key), `lib/useDownloadOptions.tsx` (mode `second_download_gate`, download counter, consent → `save_consent`), `lib/loginGate.ts` + `components/ToolsAuthGate.tsx` (`extraContent`), `lib/api/authedRequest.ts` (FormData body), `lib/savedImages/{api,logic,prepareOriginal,useSavedImages}.ts`, `components/{SaveConsentCheckbox,SavedImagesPanel,CrossExamDownloads}.tsx` (panels lazy), `components/ResizeImageTool.tsx` (save after consent, one-click, cross-exam, lead record, analytics props), `components/ResizerSpokePage.tsx` (`crossExams`), `lib/dictionary.ts` (`tool.savedImages` en/hi/mr).
  - Dashboard: `components/features/profile/SavedToolPhotos.tsx` in `ProfileWrap`, messages `profile.savedToolPhotos` en/hi/mr, event `Saved Images Deleted` in `lib/analytics/events/account.ts`.
  - Not in scope / deviations: the original is re-encoded in the browser (EXIF/GPS dropped, max 3000 px) before upload; one-click uses a centred crop to the exam's ratio (no manual crop); `upload_count` is kept on the server (feeds `is_operator`), not sent as an event property.

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-20 | Scope: pasted request (guest browser storage + auto-upload) vs CC-174 | **CC-174 exactly** (user) |
| 2026-11-20 | D1 Production file storage: no S3/R2 is configured, and files on the Coolify container disk are lost on every backend deploy unless a persistent volume is mounted. Persistent volume, or a Cloudflare R2 bucket? | **Coolify persistent volume** on `storage/app/private`, added in Coolify by the user before release; code uses Laravel's `local` (private) disk (user) |
| 2026-11-20 | D2 "OTP on 2nd download" vs today's Amplitude flags (`legacy` = no gate, `hard_gate` = OTP on the 1st download, `soft_gate` = PDF option). Make the 2nd-download gate the new default, or a 3rd flag mode that is off until switched on? | **New 3rd mode `second_download_gate`, default OFF**, switched on per exam from Amplitude; today's behaviour is unchanged (user) |
| 2026-11-20 | D3 Event names: CC-174's new snake_case events vs the rule "reuse existing events (`Resizer Image Downloaded`, the login events), Title Case". | **Reuse the existing events + new properties** (`used_saved_image`, `is_cross_exam`, `source_exam`, `asset_type`, `upload_count`); new Title Case events only for new actions (`Saved Images Consent Given`, `Saved Images Deleted`) (user) |
| 2026-11-20 | D4 "Store each verified user as a tool lead" contradicts the 2026-10-30 decision (phase 71) to store nothing extra for tool logins. Add the `tool_leads` table? | **Yes, a `tool_leads` table** (user, tool, exam, utm, referrer, time); `is_operator` is derived from it (user) |

## 6. Blockers / risks
- ⚠️ Personal data (face photo + signature): private storage only; a hard delete removes both file and row; never in logs, Sentry, Amplitude or a URL (the signed URL holds no ids, only a uuid + signature, and expires in 5 min).
- ⚠️ D1: without persistent storage, saved photos disappear on every backend auto-deploy.
- ⚠️ Shared `@clearcut/auth` change (consent slot): additive only; landing/blog login re-tested.
- ⚠️ Tool page LCP: the new code is lazy.

## 7. Dependencies / packages added
- 1–2 backend migrations. R2 env vars only if D1 = R2. No new npm packages expected.

## 8. Tests and verification
- [x] BE: `ToolSavedImagesApiTest` 12 passed (103 assertions; local MySQL, `DatabaseTransactions` + `Storage::fake`). Own migrations up/down/up. Pint on own files.
- [x] Tools: `tsc` clean, vitest 53 passed. Dashboard `tsc` + eslint clean for the touched files. `check:colors`: no new literals. Landing `tsc` 0; blog's 37 errors are the pre-existing `.next/dev/types` phantoms, none in `packages/auth`.
- [x] Playwright E2E (Sonnet, real clicks + file chooser, 2026-11-20): legacy mode unchanged; 1st download free; 2nd opens the sheet with an unticked consent box; X does nothing; no tick → no image row, but a lead row; tick → 1 POST, row + file; cross-exam one-click (a double tap gives 1 download); saved-panel one-click; Upload new replaces the image (old file gone); signature; signed URL tampered or without query → 404, no token → 401; a new-device login shows the panel; delete from the tool page and from dashboard Profile → 0 rows, 0 files; a signed-in download without consent saves nothing; console clean.
- [x] Defects found and fixed: one-click / cross-exam files were not checked against the exam's KB range (HTET 7 KB vs 20-50 KB) → now the same rule as the Download button (red message, no download); a repeat download re-POSTed the same original → now skipped. Re-test passed: HTET/REET/UPTET 39.3 KB in range, too-small shows the message, 3rd download sends no POST.
- [ ] Baseline LCP, old code vs new: not measured.
- [ ] **Not verified:** the Hindi login sheet and all Marathi screens at 390 px; real phones and FB/IG in-app browsers; LCP; Amplitude events in the real project (Amplitude was off locally) incl. the `is_operator` `$identify`; the production Coolify persistent volume (the user adds it before release); the Amplitude flag `second_download_gate` (not created yet; create it default OFF).

## 9. Next steps
- 2026-11-20 released: BE `156b202` + FE `0a8b214` on main. The user ran the two migrations on production. Coolify volume `clearcut-main-backend-tool-images` mounted at `/app/storage/app/private/tool-images` (only that folder) and redeployed (finished 08:44 UTC; `/up` 200, `/api/tools/saved-images` 401 unauthenticated). Tools deployed 2026-11-20 via `wrangler pages deploy` (Pages deployment `a38dc5eb`, branch main), built with the production backend/tools API and the live Sentry DSN; checked: no local hosts in `out/`, `/tools/resizer`, `/tools/resizer/htet` (en/hi/mr) and `/tools/syllabus-tracker` return 200, live chunks carry `second_download_gate`. Still open: check the volume folder is writable by php-fpm; Amplitude flag `second_download_gate` not created (until it exists and is ON, downloads behave exactly as before).

Get D1–D4 answered → create the branches → backend migrations + tests → tools gate/consent/upload → saved panel + one-click → dashboard delete → E2E (Sonnet). After release, the user watches Search Console clicks + LCP on tool pages for 2 weeks.
