# Phase 34 — CC-91 + CC-95: resizer never hands out a file the exam will reject, and "Script error." becomes readable

**Status:** CC-91 built + verified locally (2026-10-23), CM `phase-34-resizer-limits`. Not merged; tools deploy is manual (needs approval). CC-95: findings only, one risk decision pending.
**Jira:** [CC-91](https://clear-cutoff.atlassian.net/browse/CC-91), [CC-95](https://clear-cutoff.atlassian.net/browse/CC-95)
**Repos:** CM `apps/tools` (resizer), `apps/dashboard` + `apps/landing` (script tags, Sentry)
**Size:** small–medium

## What the tickets say
**CC-91:**
- About 3% of TNPSC resizer sessions (78 of 2,391) saw "⚠ Outside target range" and could still download. Example: a signature needs 10–20 KB and came out at 43.4 KB.
- **Ask:**
  - After processing, check KB, px and format against the exam's rules.
  - If outside the range, retry in the browser (lower JPG quality step by step, resize) until it fits.
  - Enable Download only when it fits, with a green "✓ TNPSC के लिए सही: 15KB, 275×118".
  - If it really can't fit: "फोटो बहुत छोटी है, बड़ी फोटो डालें" and no download.
  - Check every exam preset.

**CC-95:**
- "Script error." (the cross-origin hidden message) appears on payment pages (104), `/hi/start` (28) and `/hi/onboarding` (13).
- **Ask:**
  - `crossorigin="anonymous"` on the third-party scripts we control (Razorpay, analytics, CDNs) where their servers send CORS.
  - Source maps uploaded to Sentry.
  - Sentry on signup/onboarding/payment, tagged with page + language.
  - After a week, list the top 5 real errors.

## What the code shows (2026-10-23, first pass)
- **Resizer:** `apps/tools/src/components/ResizeImageTool.tsx` → `resizeAndCompress(file, w, h, maxKB, …)` already targets `maxKB` (`lib/jpegBudget.ts`). `withinTarget` drives "Perfect Match / Outside target", and Download is always enabled. Phase 20 added the downloaded line + events.
- **Below min KB:** an output under the minimum (e.g. a very flat image) may need upscaling of quality/size (padding is not allowed). The ticket only shows the over-max case.
- **Scripts:** Razorpay `checkout.js` loader (`loadRazorpay`, CC-60), GTM/Clarity/FB loaders (`LazyGTM`, landing pixel), Sentry lazy loader (Phase 17). Sentry: dashboard eager; landing/blog/tools load after idle and are inert without a DSN.

## What was found (2026-10-23)
- **CC-91:** `encodeJpegWithinBudget` already searches the highest JPG quality under the max.
  - For TNPSC's signature (275×118 px, 10–20 KB) a real JPG at the lowest quality is ~2–3 KB, so a 43 KB result only happens when the browser ignores `toBlob("image/jpeg", q)` and returns a **PNG** (some in-app browsers / old WebViews). Reproduced by forcing PNG: 270 KB for the photo.
  - Download was always enabled, whatever the size or format.
  - The output px are fixed by the exam, so shrinking the image to fit is not allowed. Below the minimum, the photo itself lacks detail (nothing is padded).
- **CC-95:** CORS headers checked with curl (`Origin: https://app.clearcutoff.in`):

  | Script | Access-Control-Allow-Origin |
  |---|---|
  | Razorpay `checkout.js` | `*` |
  | GTM | echoes the origin |
  | Clarity | `*` |
  | jsDelivr (MathJax) | `*` |
  | Facebook `fbevents.js` | **none**: `crossorigin` would block it, never add it there |

## What was built (CC-91)
- **The result is checked before Download:**
  - The file must really be a JPG.
  - It must be inside the exam's KB range (Add Name & Date has no range: format only).
- **Download is disabled otherwise,** with the reason (en/hi/mr):
  - "too small for this exam (x KB, needs at least y KB) — upload a bigger, clearer photo"
  - "couldn't get under y KB — try a different photo"
  - "this browser can't make a JPG — open in Chrome"
- **When it fits:** "✓ Ready for the exam: 47.2KB, 275×354px".
- `resizer_processed.within_target` also counts the format.

## Verification (local, tools dev, TNPSC page, 390 px)
- [x] Detailed photo → 47.2 KB (20–50 KB) → "✓ Ready…", Download on.
- [x] Flat photo → 1.8 KB → "too small…", Download off.
- [x] Browser forced to return PNG → 270.4 KB → "can't make a JPG…", Download off.
- [x] tsc clean; check:colors passes (tools has no ESLint config, same as main).
- [ ] Build + `wrangler pages deploy` after approval (TOOLS_DEPLOY.md).

## Pending decision (CC-95)
- **`crossorigin="anonymous"` on Razorpay's `checkout.js`** would make the payment page's "Script error." readable, and Razorpay sends CORS today.
  - But if Razorpay ever stopped sending that header, checkout would not load at all.
  - Payment-critical, so not changed without an OK.
  - GTM/Clarity are loaded by their own snippets.

## Plan
- [ ] **CC-91:**
  - After compress, if `size > maxKB`: loop quality down (and scale down by small steps if quality hits a floor) until it fits or gives up.
  - If `size < minKB`: raise quality up to the max. If it still can't reach the minimum, show the "बड़ी फोटो डालें" message.
  - Download is disabled unless within range; show the green ✓ line with KB and px (en/hi/mr).
  - Run all presets with a few test images (Playwright, as in Phase 20).
- [ ] **CC-95:**
  - List every third-party `<script>` per app, and check which origins send `Access-Control-Allow-Origin` (curl -I).
  - Add `crossorigin="anonymous"` only where CORS is sent (otherwise the script breaks).
  - Confirm the dashboard/landing Sentry DSN + source-map upload in builds.
  - Add page/language tags.
- [!] ⚠️ `crossorigin` on a script whose server doesn't send CORS **blocks the script**. Check each origin before changing it (Razorpay especially).
- [!] Tools deploy is manual (TOOLS_DEPLOY.md) and needs approval.
- [ ] **Verify:**
  - Resizer: no download possible outside the range, for every preset (automated loop over presets).
  - Script tags load with CORS (network panel), and a thrown test error inside a third-party callback shows its real message in a Sentry dev run.

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| | | | |
