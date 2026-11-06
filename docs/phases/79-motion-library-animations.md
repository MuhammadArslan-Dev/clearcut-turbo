# Phase 79 — Motion library (animations package) + preview page

**Tickets:** (new, from user)
**Repos:** CM (packages/*, apps/dashboard)
**Branch:** not created yet — current working branch `feature/practice-test-flow` has many uncommitted changes; ask where to branch from before first commit. Not committed, not pushed.
**Created / start date:** 2026-11-06
**Status:** In Progress — package + preview route built and typechecked; visual verification pending (needs dev server)

> Source: `C:\Users\Admin\Downloads\clearcutoff-motion (1).zip` (web library: React + CSS Modules + inline SVG, no animation libs), `ClearCutoff Motion Library.html` (gallery, same as the ZIP's `PREVIEW.html`), `video/ClearCutoff_Animations_Review_v2.mp4` (client walkthrough inside the ZIP).
> **The approved-designs PDF has not been provided / found** — work from ZIP + HTML now; diff against the PDF when its path is given.
> An earlier attempt put this in the React Native app by mistake; all of it was removed from `E:\React Native\ClearCutoff-App - New` (its git status is back to the 6 pre-existing modified files).

---

## 1. Problem / objective
Bring the approved motion system (loaders, onboarding-complete, enrollment-success, mini test, test intro/submit/result, PDF download card, Nibbu mascot) into the monorepo as a reusable package, keeping every approved design, timing and easing exactly. Build a standalone preview page to view/test every animation and state. **Do not wire anything into real app flows yet** — wait for user instructions on where each goes.

## 2. Scope
- **In:** new shared package code under `packages/`; one dev-only preview page; en/hi copy exactly as in the source (`lang="en"|"hi"`); reduced-motion fallbacks; slow-motion switch like the gallery.
- **Out:** integration into dashboard/landing/blog/tools flows; Marathi copy (source is en+hi only — ask if mr is wanted); redesign/simplification of any approved design; the React Native app.

## 3. Implementation plan
- [ ] 1. Decide package location (🛑 see Decision log): recommended **new `packages/motion` (`@clearcut/motion`)** rather than adding ~100 KB of CSS to `@clearcut/ui` — keeps every app's bundle unaffected until it imports a subpath. Same convention as other packages: `exports` map of subpaths, no barrel, no build step.
- [ ] 2. Folder layout inside the package (per user request): `core/` (tokens, easing notes, `useCountUp`, `Confetti`, shared buttons), `nibbu/`, `loader/` (+ 7 scenes), `onboarding/`, `enrollment/`, `test/` (mini-test + test-flow: intro/submit/result), `download/`. Each with its own `index.ts`; docs from the ZIP's `docs/MOTION_GUIDELINES.md` kept as `README.md`.
- [ ] 3. Port components as-is (CSS Modules + inline SVG are already Next-compatible); fix only what the monorepo needs: `"use client"`, `@/`-free relative imports, `tsconfig` extends `tsconfig.base.json`, `typecheck` script, `@source` not needed for CSS Modules (confirm).
- [ ] 4. Colours: the library carries its own approved palette in CSS custom properties with `var(--color-brand, #0083ff)` fallbacks → resolves to the shared token for brand; remaining literals are approved artwork. **`check:colors` will count them** — plan: add the package to the guard's `EXCEPTIONS` (like icon/logo assets) or baseline it; decide with user (🛑).
- [ ] 5. Preview page: dev-only route in `apps/dashboard` (recommended `/[locale]/(public-pages)/…` is wrong — use a non-indexed route guarded to non-production or behind `?preview` flag, 🛑 confirm), tabs = Loaders · Onboarding · Enrollment · Mini test · Test flow · PDF download · Nibbu, Replay buttons, all 7 loader designs × fullscreen/inline/compact (+ onBrand), every state (test outcomes: cleared/close/below; download idle/progress/success/error), EN/हिं switch, 0.5× slow-motion, forced reduced-motion toggle. Reuse the ZIP's `gallery/` (entry.tsx, samples.ts, screens.tsx, page.css) as the starting point, rebuilt as a React route instead of a prebuilt `index.html`.
- [ ] 6. Verify against the ZIP's HTML: side-by-side screenshots per component at 360 px, EN + HI, normal + reduced motion (Playwright via sonnet subagent, per saved workflow).
- [ ] 7. Update `docs/DEVELOPMENT_RULES.md` (new package in §1/§5, "not yet integrated" note) and root `CLAUDE.md` package table.

## 4. Progress / completed changes
- 2026-11-06: ZIP extracted to scratchpad and inspected (read-only). RN attempt reverted.
- 2026-11-06: **`packages/motion` (`@clearcut/motion`) created** from the ZIP: `src/{core,nibbu,loader,onboarding,enrollment,download}`, `src/test/{mini-test,flow}`, `src/preview/{MotionPreview.tsx,screens.tsx,samples.ts,preview.css}`; `package.json` (subpath exports, no barrel), `tsconfig.json` (extends base), `css-modules.d.ts`, `README.md`, `MOTION_GUIDELINES.md`. Component code and CSS copied unchanged; only import paths changed (`test-flow`→`test/flow`, `mini-test`→`test/mini-test`).
- 2026-11-06: gallery `entry.tsx` → `MotionPreview.tsx` (client component, hash tab read after mount for SSR safety, no `createRoot`). Gallery `page.css` → `preview.css`, **scoped under `.motionPreview`** via native CSS nesting (dark-mode rules dropped, keyframes renamed `mpIn`/`mpBobble`) so it cannot leak into the dashboard (`.group`, `.panel`… are generic names).
- 2026-11-06: `apps/dashboard`: dependency `@clearcut/motion`, route `src/app/[locale]/(public-pages)/animation-preview/page.tsx` (noindex, 404 in production unless `NEXT_PUBLIC_ENABLE_MOTION_PREVIEW=true`).
- 2026-11-06: `scripts/check-hardcoded-colors.mjs`: added `packages/motion/` to EXCEPTIONS ("approved motion artwork"). `pnpm check:colors` green.
- 2026-11-06: **Topic Test result screen switched to the library `TestResult`** (user-approved): new `apps/dashboard/.../preparation/components/modal/MiniTestResultMotion.tsx` (same Modal/BottomSheet + open/close/"Improve Score" restart wiring, buttons use the app's own `modals.miniTestResult` i18n, copy language = UI locale, topic name localized). The previous screen `MiniTestResult.tsx` is kept UNTOUCHED as a backup; switch with the single flag `USE_MOTION_RESULT` in `components/layout/preparation/PreparationShell.tsx` (true = new, false = old; verified both). Library tweaks (design unchanged): `TestResult` gets `primaryLabel`/`secondaryLabel`, `ResultData.timeTakenSec` optional (Time line hidden — the topic test is untimed and the store doesn't track time), `.ctas` sticky at the bottom of the scroll area so the buttons stay reachable on short phones.
- 2026-11-06: result buttons: `MiniTestResultMotion` now renders the app's own `@clearcut/ui/button` (identical markup to the previous result screen) through a new `TestResult` `actions` slot — no library button is used there (the library's own `primaryLabel/secondaryLabel` props were removed again). "Improve Score" now closes the result before reopening the test (the previous screen leaves a stale `mini-test-result` in the modal stack, which reappeared after the next Continue Learning; left untouched in the backup screen).
- 2026-11-06: no-scroll result on phones: `result.module.css` — stat chips stay one row of four down to 346px width (2x2 only at <=345px), hero `zoom` 0.88 at <=800px and 0.72 at <=700px viewport height, tighter spacing; wrapper padding trimmed on short screens. Anything still taller than the screen scrolls with the buttons pinned at the bottom (sticky `.ctas`).
- 2026-11-06: docs: root `CLAUDE.md` package table, `DEVELOPMENT_RULES.md` repo map.
- 2026-11-06: preview tab "Mini test" = app's own mini-test UI + library animations only (`apps/dashboard/src/components/features/motion-preview/MiniTestDemo.tsx`, `packages/motion/src/test/mini-test/{MiniTestMotion.tsx,motion.module.css}`; `MotionPreview` got a `slots` prop; package exports `./core`, `./preview/samples`). `TestIntro` `minutes`/`questions` made optional.
- 2026-11-06: **INTEGRATED into the real Topic Test** (user-approved): `apps/dashboard/src/components/features/preparation/components/modal/MiniTest.tsx` — `TestIntro` (topic) plays INSIDE the modal body under its header (not full screen), localized topic name, then the existing test; library `QuestionSlide` / `OptionMotion` (replaces the framer shake/pop) / `AnswerFeedback` (Nibbu) / `StreakCombo` added. Language for the new pieces comes from the course language (`language`), NOT the store `locale` (the store resets it to "en" when questions load). Streak toast fires once per question (ref guard) so Previous/Next doesn't replay it. Result modal (`MiniTestResult.tsx`) untouched.

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-06 | Build for web in `clearcut-master/packages`, not RN | Web, in packages (user) |
| 2026-11-06 | Package: new `packages/motion` vs inside `packages/ui` | New `packages/motion` (user: all recommended) |
| 2026-11-06 | Preview page home: dashboard dev route vs tools app | Dashboard dev-only route (user: all recommended) |
| 2026-11-06 | `check:colors`: exception vs re-baseline | EXCEPTIONS entry (user: all recommended) |
| 2026-11-06 | Hindi only or add Marathi copy | en + hi only, as in the source (user: all recommended) |
| 2026-11-06 | PDF of approved designs | 🛑 not provided; proceeding with ZIP+HTML |

## 6. Blockers / risks
- Existing `packages/ui/full-screen-loader.tsx` (spinner) overlaps conceptually with `CCLoader`; not replacing it now (no integration).
- `framer-motion` already exists in `@clearcut/ui`; the motion library uses none (pure CSS) — no new runtime deps expected.
- Many hard-coded colours/strings in the source vs repo rules (no hard-coded UI text outside the lang prop pattern) — acceptable for a self-contained library; revisit at integration.
- Working tree already has many uncommitted changes from other work — new files only, no edits to existing ones except docs and the package/dashboard wiring.

## 7. Dependencies / packages added
None expected (new workspace package only; `pnpm install` to link it).

## 8. Tests and verification
- [x] `pnpm --filter @clearcut/motion typecheck` — clean
- [x] eslint on the new dashboard route — clean (packages/* are not linted by the repo)
- [x] `pnpm check:colors` — green with the EXCEPTIONS entry
- [x] `pnpm --filter dashboard typecheck` — no errors in MiniTest.tsx / motion files
- [x] Real Topic Test on the preparation page (Playwright, localhost, mocked `/v2/mini-test/count|get` because the local DB has no mini-test questions): intro inside modal, auto-advance (~4.5s), Skip (+double-click), close/reopen (intro replays, no ghost after closing mid-intro), Escape, rapid open/close x3, wrong/right feedback, streak toast (3 and 5, gone after ~2s, no replay on Previous/Next), double-click Check, finish -> result 5/5, Hindi course (intro label, localized topic, feedback, Hindi options), mobile 390x844 / 360x740 / 360x640 (bottom sheet, 1 column, no horizontal scroll, buttons in viewport), reduced motion (shorter intro, no motion animations running), slow questions (skeleton after intro), server 500 (Couldn't load + Try Again), empty list. No page errors.
- [x] Result screen (real modal, mocked questions): scores 5/5, 3/5, 2/5, 0/5, 1/5 -> correct title/outcome, stats, accuracy, no NaN, confetti only on a cleared cutoff; Improve Score restarts with fresh state + intro; Continue Learning / X / close work; count-up in normal motion vs instant final values in reduced motion (no confetti); mobile 390x844 / 360x640 (buttons visible via sticky CTAs); Hindi UI (/hi) fully Hindi; backup flag flip shows the old screen. No page errors.
- [ ] Not covered: real (non-mocked) questions with images/MathJax, Marathi course, iOS/Android WebView, a long real topic name in the intro title, Playwright on the unmodified preparation flows (regression of video/notes tabs).
- [ ] Preview page screenshots vs original `ClearCutoff Motion Library.html`, en + hi, 360 px, reduced motion

## 9. Next steps
1. Start dashboard dev server (`pnpm --filter dashboard dev`), open `http://localhost:3020/animation-preview`, verify every tab renders and animates (CSS Modules from a workspace package + nested CSS in Next 16).
2. Side-by-side screenshots vs the original HTML, 360 px, en+hi, reduced motion.
3. PDF of approved designs still missing — diff against it when provided.
4. Wait for user instructions on integration points.
