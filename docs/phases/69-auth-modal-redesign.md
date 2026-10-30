# Phase 69 — Auth modal redesign (landing signup + tools download modal + OTP screen)

**Repos:** CM (`packages/auth`, consumed by `apps/landing`, `apps/blog`, `apps/tools`). Backend untouched. Dashboard has its own auth and is out of scope.
**Status:** **Implemented and verified (tools + landing modal, 2026-10-30); shipped together with phase 70.** Created 2026-10-30 in worktree `clearcut-master-exp` (clean `main`); the main worktree's uncommitted work is untouched.
**Source of truth (untracked in the main worktree):** `docs/screens/login-sheet/Clear Cutoff Exam Preparation Signup Modal.png` (landing) and `Clear Cutoff OTP Verification Flow (2).png` (tools: number step → OTP step).

## 1. Request
1. Landing login/signup modal matches the signup reference (illustration, title, "Videos • Notes • PYQs", flag + "+91" field, shield text, "Start FREE Preparation →", trial pill, terms, close X). Illustration as optimized, lazy-loaded WebP.
2. One OTP screen design everywhere (landing + all tools). OTP is **4 digits**.
3. Tools modal (resizer download, tracker save/load) uses the same design; only heading / description / CTA are contextual.
4. Reuse the shared auth architecture; no separate implementations; WebP + lazy loading, no layout shift; test login, OTP, invalid/expired, resend, tool-triggered auth, desktop + mobile.

## 2. What exists (inspected)
| Piece | Where | Notes |
|---|---|---|
| Phone step | `packages/auth/src/screens/login-screen.tsx` (595 lines) | Logo, `heading-medium` title, subtitle, optional seat timer / Truecaller (mobile) / flag + label row, `MainInput` with `+91 -` prefix, helper text, pill button, optional trial banner, terms. No close X, no illustration |
| OTP step | `packages/auth/src/screens/otp-screen.tsx` (439 lines) | `OTP_LENGTH = 4` already; auto-submits at 4 digits; resend with 30 s timer, "Resend OTP (30s)"; errors for wrong / expired / 429 |
| Container | `packages/auth/src/ui/modal.tsx`, `drawer-sheet.tsx` | Desktop modal `md:max-w-[400px]`, mobile full-height sheet. No `role="dialog"`, no close button (Esc works) — found in phase 68 testing |
| Per-app copy | `LoginCopy` (`title`, `subtitle`, `submitLabel`, `showTrialBanner`, `showTrustText`) | Text only: cannot carry an illustration, feature chips, or OTP-step CTA |
| Tools wiring | `apps/tools/src/lib/loginGate.ts`, `useLoginGate.tsx`, `ToolsAuthGate.tsx` | Phase 68; passes `LoginCopy` |
| `/start` page | `apps/landing/.../StartAuthForm.tsx` (own UI, same API) | Not the modal; **out of scope** unless you say otherwise |

## 3. Gap vs. the approved design
Signup modal (landing): close X; illustration (cap + book + checklist); bolder 2-line title, grey "Videos • Notes • PYQs"; one-line label (no flag beside it); field with flag + chevron + "+91" + divider; shield icon + 2-line helper; pill CTA with arrow "Start FREE Preparation →"; light-blue "🎁 3-day FREE Trial • No card or payment required" pill; terms with side rules.
Tools modal: close X; image-lock illustration; title/description; field; "Continue →"; two chips "100% Free Download" / "Secure & Private"; terms.
OTP step: phone-SMS illustration; "Enter OTP"; "We've sent a 4-digit OTP to +91 98765 43210 ✎" (edit = back to number); key-icon field "Enter 4-digit OTP"; "Didn't receive OTP? Resend in 00:28"; CTA "Verify & Download" (contextual); "← Change Number".

## 4. Proposed approach
1. **One shared presentation in `@clearcut/auth`**: extend `LoginCopy` into a small `AuthModalCopy` (all optional, defaults = today's behaviour so blog/other callers do not change until opted in): `title`, `subtitle`, `submitLabel`, `otpSubmitLabel`, `illustration: "study" | "image-lock"`, `featureChips`, `trialBanner`, `helperText`. Landing opts into the "study" preset; Tools passes the "image-lock" preset + contextual strings (phase 68 configs already own the text).
2. **Close X + dialog semantics** in the shared container (`role="dialog"`, `aria-modal`, labelled by the title, focus into the modal and back on close, Esc already works). Closing runs nothing (phase 68 rule kept).
3. **Field**: flag + chevron + `+91` + divider, same `MainInput` and `normalizeIndianMobileInput`; the chevron is decorative (India only) — it must not look interactive.
4. **OTP step**: new layout per design; keep `OTP_LENGTH = 4`, auto-submit, error handling, resend (`Resend in 00:28` format, same 30 s), "Change Number" and the pencil both call the existing edit action. All copy says **4-digit**. No backend/validator change is needed: the backend and the OTP input are already 4 digits (verified in `otp-screen.tsx`; backend `AuthController` to be re-checked, read-only).
5. **Images**: the references are full-screen mockups, not separate assets, so the 3 illustrations (study, image-lock, phone-SMS) are **cropped from the mockups** at their native (≈2×) resolution and exported as WebP (target ≤ 15 KB each) into `packages/assets`-style shared path used by all apps, `loading="lazy"`, fixed `width/height` and an aspect-ratio box (no layout shift), `decoding="async"`; shown only inside the modal, which is already `next/dynamic`, so nothing is added to the pages' first load.
6. **Tokens/colours**: only existing tokens (`--color-brand`, gray scale, `--color-border-gray-subtle`, existing radii). Any colour the design needs that has no token is reported, not hardcoded (`check:colors` stays green).
7. **i18n**: shared package strings are English today; en first, hi/mr strings for the new copy added where the host app already passes translated copy (tools gate presets already have hi/mr); the package defaults stay English as before.

## 5. Test plan (headed Playwright, OTP mocked, no real SMS; isolated browser context)
Landing modal (open from the landing CTA), tools download modal, tracker save/load modal: render vs. reference (side-by-side screenshots at 1280 and 360), invalid OTP, expired OTP, resend (30 s countdown + resend), 429, edit number / Change Number, close X + Esc + focus return, tool-triggered auth resuming the download exactly once, logged-in user bypass, session persistence, Truecaller row still shown on mobile when available, no layout shift (CLS check on image load), `tsc`, `check:colors`, builds of landing/blog/tools. Landing `/start` and blog callers regression-checked for unchanged defaults.

## 6. Open questions (blocking)
1. **Illustration quality / source.** Only the mockup PNGs exist; cropping gives ≈ 2× (≈ 470 px wide) art on a white card, fine for the modal but not vector. If you have the original illustration files (SVG/PNG), send them and I use those instead.
2. **The phone illustration shows "123456" (6 digits)** but OTP is 4 digits. Options: (a) crop and paint over the digits with "1234", (b) redraw that one illustration as a small SVG, (c) use a different art. Which?
3. **Landing modal copy "Start FREE Preparation" + "3-day FREE Trial" pill** — keep exactly as the mockup (landing only), and blog's modal (same shared component) stays on today's copy unless you want it changed too?
4. **Scope of "all tools":** resizer download (live now), Syllabus Tracker save/load, any other tool? Age calculator has no login today.
5. **Country chevron**: purely visual (India only) — OK?
6. **`/start` page** keeps its own UI (not the modal) — OK to leave out?

## 7. Decisions (2026-10-30)
All §6 answers approved: illustrations cropped from the mockups (no originals exist); the phone art's "123456" repainted to **1234**; landing copy exactly as the mockup (it equals the existing default copy), blog keeps the same words; resizer download + Syllabus Tracker use the tools preset; country chevron is decorative; `/start` untouched.

## 8. What changed
- `packages/ui/src/main-input.tsx`: opt-in `appearance="outlined"` (default unchanged).
- `packages/auth/src/ui/auth-sheet-parts.tsx` (new): `AuthIllustration` (lazy `<img>`, fixed width/height), `AuthCloseButton`, `IndiaPhonePrefix` (inline SVG flag — removes the old `/images/indian-flage.webp` request/404), icons, `FeatureChip`.
- `login-screen.tsx` / `otp-screen.tsx`: new layout per the approved design; behaviour (validation, auto-send at 10 digits, auto-verify at 4 digits, errors, resend timer, Truecaller row) unchanged; OTP "Resend" is now a real `<button>`; both steps carry `role="dialog"`, `aria-modal`, labelled by their title.
- `types.ts` / `auth-modal.tsx` / `create-auth-feature.tsx`: `LoginCopy` gains `illustration`, `featureChips`, `otpSubmitLabel`; `assetBase` dep; the OTP step now also receives the copy.
- `apps/{landing,blog,tools}/public/images/auth/*.webp` (study 31 KB, image-lock 12 KB, otp-phone 9 KB, transparent, exact 2x of their CSS size).
- `apps/tools`: `loginGate.ts` (download preset: image-lock art, chips, "Verify & Download", en/hi/mr), `ToolsAuthGate.tsx`, `toolsAuthFeature.ts` (`assetBase: "/tools"`).
- OTP length: no change needed — the input, validation and backend call were already 4 digits; all new copy says 4-digit (the mockup's "6-digit" was not followed).

## 9. Verification log
`tsc`: tools 0 errors, landing 0, blog 34 (pre-existing, none in auth/ui), dashboard fails on its own pre-existing errors. `check:colors` green (flag uses named colours).
Live, headed Chrome via Playwright MCP, isolated contexts, OTP mocked (no real SMS), tools dev server:
- PASS visual match vs both references: tools number step, tools OTP step, default/landing look (trial pill, "Start FREE Preparation →", mobile trust line) via a temporary harness page that was deleted, tracker modal, Hindi mobile; 360 px: no horizontal scroll.
- PASS wrong OTP -> error, stays, no download; retry -> one download
- PASS expired OTP -> "OTP has expired", Resend becomes a button, resend restarts "Resend in 00:30", one download after the new code
- PASS 429 on send and verify -> "Too many attempts", usable, retry works
- PASS close X, Esc, "Change Number", pencil -> back to the phone step; nothing downloads before login; exactly one download after
- PASS `role="dialog"` present (count 1); focus lands in the phone field
- NOT RUN: real landing/blog apps (no `.env`, landing needs the CMS) — covered only through the shared component in tools; landing `/start` (untouched); Safari/in-app download; focus return to the opener on close; Truecaller row (needs the app on a phone); real backend OTP.
- Known: Hindi title/subtitle line-height is tight (the `.heading-large` rule overrides utility line-height); illustration `study` is 31 KB, above the 15 KB aim, but loads only when the modal opens.
