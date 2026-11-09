# ClearCutoff Motion

The motion system for clearcutoff.in, covering the whole user journey: **login → onboarding → dashboard → subject enrollment → preparation page → mini test → results**, plus loaders and PDF downloads. React + CSS Modules + inline SVG. No animation libraries.

**Preview everything:** double-click **`PREVIEW.html`** (same file as `gallery/index.html`) to open it in any browser (Loaders · Onboarding · Enrollment · Mini test · PDF download · Test results · Nibbu, with a slow-motion switch). Jump straight to a tab with `PREVIEW.html#onboarding`, `#enrollment`, `#mini-test`, `#pdf`, `#test-flow` or `#nibbu`. `video/ClearCutoff_Animations_Review_v2.mp4` is the 50-second client walkthrough.

## Structure

```
core/         Shared tokens + buttons (ui.module.css), useCountUp, usePrefersReducedMotion, Confetti
nibbu/        NibMascot — the approved mascot (moods + accessories). Shared by everything.
loader/       CCLoader — 7 designs (omr · cutoff · notebook · flashcard · path · book · stopwatch)
onboarding/   OnboardingComplete — celebrate → dashboard loading steps → curtain reveal
enrollment/   EnrollSuccess — subjects into ticket → ENROLLED → 7-day plan → into preparation page
mini-test/    MiniTest — "focus" (instant feedback, streaks) or "exam" (OMR, timer, palette)
download/     DownloadCard + useFileDownload — real progress, cancel, success/error states
test-flow/    TestIntro · TestSubmit · TestResult — topic, daily and full-mock tests, 3 result outcomes
gallery/      entry.tsx + build.mjs → index.html (self-contained preview built from the real components)
docs/         MOTION_GUIDELINES.md — easing tokens, timing, rules for adding new motion
video/        Client review video (1080p, 50s)
```

Each package has its own README with props and wiring.

## Install (Turborepo / Next.js App Router)

1. Copy the folders you need **plus `core/` and `nibbu/`** into `packages/ui/src/` (every package imports those two).
2. Export them from `packages/ui/package.json`:
   ```json
   "exports": {
     "./nibbu": "./src/nibbu/index.ts",
     "./loader": "./src/loader/index.ts",
     "./onboarding": "./src/onboarding/index.ts",
     "./enrollment": "./src/enrollment/index.ts",
     "./mini-test": "./src/mini-test/index.ts",
     "./download": "./src/download/index.ts",
     "./test-flow": "./src/test-flow/index.ts"
   }
   ```
3. If the app doesn't already transpile the UI package: `transpilePackages: ["@clearcut/motion"]` in `next.config`.
4. Use:
   ```tsx
   import { CCLoader } from "@clearcut/motion/loader";
   import { OnboardingComplete } from "@clearcut/motion/onboarding";
   import { EnrollSuccess } from "@clearcut/motion/enrollment";
   import { MiniTest } from "@clearcut/motion/mini-test";
   import { DownloadCard, useFileDownload } from "@clearcut/motion/download";
   import { TestIntro, TestSubmit, TestResult } from "@clearcut/motion/test-flow";
   ```

All components are client components (`"use client"`). CSS Modules work in Next.js with no config. Colours read `--color-brand` / `--color-brand-hover` from your Tailwind v4 theme, with ClearCutoff defaults as fallback.

## Scripts (optional, for working on the library itself)

```bash
npm install
npm run typecheck       # strict TS across all packages
npm run build:gallery   # rebuilds gallery/index.html
```

## Performance budget

| | |
|---|---|
| Animated properties | `transform` and `opacity` (plus a few small SVG stroke draws) |
| JavaScript per frame | none for loaders; count-ups use one `requestAnimationFrame` loop that stops at the target |
| Assets | none: no images, Lottie files or fonts; the mascot is ~1.3 KB of inline SVG |
| Layout shift | none: every animated element has a reserved box (fixed scene sizes, stacked tips, min-heights) |
| Loader CSS | ~11 KB gzipped with all 7 designs + mascot; each unused scene you delete from `scenes/` saves ~1–2 KB |

## Accessibility

- Loaders and overlays use `role="status"` / `role="dialog"` and announce once. Decorative motion is `aria-hidden`.
- `prefers-reduced-motion`: every component has a still fallback (no hops, confetti, count-ups or countdown pops).
- Intro countdown has an auto-focused **Skip**. `forced-colors` (Windows high contrast) supported.
- Bilingual: `lang="en" | "hi"` on every component.

## Status

| Area | State |
|---|---|
| Nibbu | Approved by client |
| Loaders V1–V4 | Motion polish v2 done |
| Loaders V5–V7 | New options; client to pick from all seven |
| Onboarding complete, Enrollment success | Built, ready for review |
| Mini test | Two directions (focus / exam) for the client to choose |
| PDF download | Built with a real download hook |
| Test results flow | v1 built |

## Where each piece goes in the journey

| Moment | Component |
|---|---|
| Any route change / data load | `CCLoader` (pick one design) |
| Last onboarding step submitted | `OnboardingComplete` over the dashboard |
| "Enroll" tapped after choosing subjects | `EnrollSuccess`, then the preparation page |
| Mini test on the preparation page | `MiniTest` → `TestResult type="topic"` |
| Topic / daily / full mock | `TestIntro` → test → `TestSubmit` → `TestResult` |
| PDF lists, solutions, notes | `DownloadCard` + `useFileDownload` |
