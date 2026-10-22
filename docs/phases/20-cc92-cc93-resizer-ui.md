# Phase 20 — CC-92 + CC-93: resizer looks clickable where it isn't, and gives no feedback

**Status:** Built + verified locally (2026-10-22) — not merged, not deployed
**Jira:** [CC-92](https://clear-cutoff.atlassian.net/browse/CC-92), [CC-93](https://clear-cutoff.atlassian.net/browse/CC-93)
**Repos:** CM `apps/tools` (branch `phase-20-resizer-ui`, based on phase 19: e9ce32d; deploy: Cloudflare Pages, see TOOLS_DEPLOY.md)
**Size:** small–medium, one shared template covers every `/tools/resizer/*` page

## What the tickets say
**CC-92: requirement labels look like buttons**
- TNPSC: 2,391 sessions. "275×118" was tapped in 990 of them, "Dimensions" in 608, "Signature" in ~450, "10–20KB" in 262.
- RD's comment: same on Canara Bank (8,596 dead clicks) and UP PGT. Test all three before closing.
- Asks:
  - Two clear tabs at the top: **Photo / Signature**.
  - Requirements as plain text in a grey info box: "ज़रूरी: 275×118 px · 10–20 KB · JPG".
  - The upload box is the biggest tappable thing.
- Done when: dead taps on the labels drop by 80%+.

**CC-93: no visible result after taps**
| Button | Sessions with dead taps |
|---|---|
| "Apply & Optimize" | 1,161 |
| "Download Image" | 967 |
| "Click to upload or drag a file" | 711 |
| "Process Another" | 157 |

The actions mostly work; nothing on screen says so. Asks:
- **Upload:** instant preview with name and size.
- **Optimize:** a spinner/progress ("ऑप्टिमाइज़ हो रहा है…"), then a before/after with the new size.
- **Download:** green toast "✓ डाउनलोड हो गया — अपनी Downloads फ़ोल्डर देखें".
- **Process Another:** resets without a reload and keeps the Photo/Signature tab.
- **Amplitude:** `resizer_upload`, `resizer_processed`, `resizer_download`, `resizer_process_another`, each with the exam name.

## What the code shows (2026-10-22, first pass)
- One component: `apps/tools/src/components/ResizeImageTool.tsx` (buttons "Apply & Optimize", "Download Image", "Process Another").
- Tools analytics: `src/lib/toolsAnalytics.ts` is lazy and **login-modal only** today. Resizer events need either that loader extended or a small new tracker. Tools has no Amplitude page tracking of its own except `PageViewTracker.tsx`.
- Tools is a static export with no next-intl. The hi strings in the ticket need tools' own copy mechanism; check how the tools pages handle hi/mr today.

## What was found (2026-10-22, local, 390px, TNPSC / Canara Bank / UP PGT)
- **CC-92 is mostly already done in the code:**
  - Photo / Signature have been two big card-buttons since September.
  - On 2026-10-20 the requirements box (`275×354 · 20–50KB · JPG`) became plain text (no input-like tiles). The code comment cites the same Clarity dead taps.
  - That change went live with the tools deploy earlier this session.
  - The ticket's Clarity window is mostly before it, so nothing more was changed (no look change, D1 not needed). **Re-check Clarity in 2 weeks**; if label taps are still high, revisit with a mockup.
- **CC-93:**
  - Upload shows the crop preview at once.
  - Apply shows the processing status, then Original vs result with sizes and a "Perfect Match / Outside target" line.
  - Process Another resets to upload and keeps the document type.
  - **Missing:**
    - After "Download Image" nothing on screen changed.
    - In Facebook/Instagram in-app browsers `<a download>` on a blob URL saves nothing at all, so this is the likely main cause of the 967 dead-tap sessions.
    - No resizer events in Amplitude.

## What was built
- After Download, a status line: "✓ Downloaded — check your Downloads folder." In FB/IG in-app browsers it adds the press-and-hold "Save image" fallback (the result is a real `<img>`). en/hi/mr in `dictionary.ts`. It clears on Process Another / new result.
- Amplitude (`logAmplitudeEvent`):
  - `resizer_upload` (`file_kb`)
  - `resizer_processed` (`size_kb`, `within_target`)
  - `resizer_download` (`in_app_browser`)
  - `resizer_process_another`

  All with `exam_name` (spoke pages; null on generic tools), `document_type` and `locale`.

## Verification
- [x] Playwright, TNPSC, 390px:
  - Chrome: the downloaded line shows and the file downloads.
  - FB in-app UA: also shows the hint.
  - Process Another clears it.
- [x] Events read from blocked requests (gzip-decoded; nothing reached Amplitude): all four fire with `exam_name: "TNPSC"`.
- [x] tools `tsc` clean; `check:colors` passes. Tools has no ESLint config.
- [ ] `next build` (static export) before deploy.
- [ ] Note: tools sends Amplitude by default in local dev. Earlier local test runs in this session may have sent a few localhost "Page Viewed" events. Run tools dev with `NEXT_PUBLIC_AMPLITUDE_ENABLED=false`.

## Plan
- [ ] Reproduce on TNPSC, Canara Bank and UP PGT (Playwright, 390px).
- [ ] Photo/Signature tabs (reuse the tab pattern already used in tools, if any; else a simple segmented control with tokens).
- [ ] Requirements → one plain info line (not chips).
- [ ] Upload preview (name, size), optimize progress plus before/after, download toast, Process Another resets state.
- [ ] Amplitude events (exam name as a property).
- [!] 🛑 **D1:** the tabs and info box change the page's look. Show a screenshot before building all pages (design change rule).
- [!] 🛑 **D2:** language: are the resizer pages Hindi, English or both today? The ticket's toast copy is Hindi.
- [!] ⚠️ Deploy goes through `wrangler pages deploy` (this machine's Cloudflare upload was flaky on 2026-10-22).
- [ ] Verify: Playwright on the 3 pages (taps give a visible result within 1 s; downloads work); tsc; check:colors; screenshots.

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| 2026-10-22 | CC-92 tabs/labels | Already done in code (Sep cards, Oct 20 plain requirements); no look change now, re-check Clarity | Claude (from code), report to user |
