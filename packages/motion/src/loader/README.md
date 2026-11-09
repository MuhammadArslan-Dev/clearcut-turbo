# ClearCutoff Loader (Nibbu)

Drop-in replacement for the `animate-spin rounded-full border-4 border-[var(--color-brand)]` ring spinner.
Nibbu (the pen nib from the logo) hops across OMR bubbles, stamps the right answer, gets a green tick, celebrates, hops back. 3.2s loop.

## Files

| File | What it is |
|---|---|
| `CCLoader.tsx` | The component (`fullscreen` / `inline` / `compact`) |
| `CCLoader.module.css` | All styles + keyframes. Reads `--color-brand` / `--color-brand-hover` from your Tailwind v4 theme |
| `scenes/` | Designs V2–V4 (V1 lives in `CCLoader.module.css`) |
| `useDelayedVisibility.ts` | Delay (250ms) + min-duration (700ms) + exit transition |
| `examples/loading.tsx` | Next.js App Router Suspense fallback |
| `examples/usage.tsx` | Controlled overlay, button, inline, Hindi |
| Preview | `../gallery/index.html` → Loaders tab |

No dependencies beyond React. Type-checked against React 19 with `strict`.

## Install (Turborepo)

1. Copy `loader/` **and** `nibbu/` into `packages/ui/src/` (the loader imports `../nibbu`).
2. Export it from the package (e.g. `"./loader": "./src/loader/index.ts"` in `packages/ui/package.json` exports).
3. If the app doesn't already transpile the UI package: `transpilePackages: ["@clearcut/motion"]` in `next.config`.
4. Find and replace the old spinner:
   ```
   rg 'animate-spin rounded-full border-4' apps packages
   ```
   Small spots → `<CCLoader variant="compact" />`. Sections → `variant="inline"`.

## Designs

| `design` | Scene | Files |
|---|---|---|
| `"omr"` (default) | V1 · Nibbu hops across OMR bubbles and marks C | in `CCLoader.module.css` |
| `"cutoff"` | V2 · Rides a score bar; bar turns green as it clears the cutoff line | `scenes/CutoffScene.tsx` + `cutoff.module.css` |
| `"notebook"` | V3 · Writes two lines of notes, then ticks them | `scenes/NotebookScene.tsx` + `notebook.module.css` |
| `"flashcard"` | V4 · A PYQ card flips from ? to Correct!, Nibbu cheers, next card slides in | `scenes/FlashcardScene.tsx` + `flashcard.module.css` |

Once you pick one, delete the other scene files and their imports in `CCLoader.tsx` to keep the bundle minimal. Or keep two and use different ones per context (e.g. `cutoff` on result calculation, `flashcard` on test start).

## API

```tsx
<CCLoader
  design="omr" | "cutoff" | "notebook" | "flashcard"   // default omr
  variant="fullscreen" | "inline" | "compact"   // default fullscreen
  active={isLoading}      // optional. Omit in loading.tsx (Suspense)
  label="Setting up your test"
  tips={DEFAULT_TIPS | customTips | false}
  lang="en" | "hi"        // hi = Hindi copy + क ख ग घ bubbles
  tone="onBrand"          // compact only: white mascot inside blue buttons
  delay={250} minDuration={700}
/>
```

## Where to use it (and where not to)

Use: app route changes (`app/(app)/loading.tsx`), test start, test submit / result calculation, Razorpay payment verification, dashboard data fetches.

**Don't** put it in a root `app/loading.tsx` that wraps marketing, blog or Academy pSEO pages. Those got to sub-1s loads and the bounce-rate win came from showing content immediately. A splash there would hurt LCP and bounce. Keep the loader inside the logged-in segment.

## Accessibility & performance

- `role="status"` + `aria-live="polite"`; the label is announced once. Rotating tips are `aria-hidden` so screen readers aren't spammed.
- `prefers-reduced-motion`: mascot stands still on the answer, fill gently pulses, no hops/sparkles.
- `forced-colors` (Windows high contrast) supported.
- Only `transform` and `opacity` animate → compositor-only, smooth on budget Android.
- ~3 KB gzipped CSS + ~4 KB gzipped TSX source (less once minified). No Lottie, no images, no fonts.
- Uncontrolled mode delays via CSS `animation-delay`, so it's SSR-safe and causes no hydration mismatch.

## Customising

- Tips: pass your own `{ en, hi }[]`. Exam-specific tips per route (HTET vs UGC NET) are a cheap win.
- Colours: override `--cc-brand`, `--cc-success`, etc. on a parent.
- Speed: `--cc-loop` (keep keyframe percentages, change duration only).


## Motion system (v2 polish)

Nibbu's design is unchanged; this pass only refines the motion around him.

| Rule | How it's built |
|---|---|
| Real arcs | Three layers: `rider` (X glide) › `hop` (Y gravity: ease-out up, ease-in down) › `squash` (scale + lean from the nib tip). Never put X and Y on one easing curve. |
| Weight | Every contact: squash → stretch → small settle. Lean into the direction of travel. |
| Cause → effect | Bubbles dip and ripple on landing; ink fills from the nib's touch point; the tick draws itself after the badge pops. |
| One rhythm | Each scene runs on a single 3.2s loop (`--cc-loop`); the halo "breathes" on the same beat. |
| Enter / exit | Staggered entrance (halo → scene → label → tip). Exit eases out in ~360ms (`exitDuration`) instead of cutting. |
| Tips | Old tip drifts up while the new one arrives; both share one grid cell, so no layout shift. |
| Easing tokens | `--cc-ease-out`, `--cc-ease-in`, `--cc-ease-spring`, `--cc-ease-io` on the loader root; reuse them for any new motion. |

The gallery has a 0.5× slow-motion switch for reviewing timing.
