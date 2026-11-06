# Phase 83 — Lesson Path loader (trial replacement of the dashboard loader)

**Tickets:** (new, from user)
**Repos:** CM (`apps/dashboard` only; `packages/motion` and `packages/ui` untouched)
**Branch:** pushed to main (2026-11-06)
**Created / start date:** 2026-11-06
**Status:** Completed — approved by the user (2026-11-06) and pushed; revert = one switch, see below

## 1. What was replaced
The dashboard's loading state = `@clearcut/ui/full-screen-loader` (white screen + brand spinner ring + "Clear Cutoff" + 3 dots; `MainLoader` = the bare ring), re-exported by `apps/dashboard/src/components/FullScreenLoader.tsx`. Call sites: `ProtectedPage` (fallback), `dashboard/page.tsx` (import), `payment/initiated` (verifying screen, `MainLoader`), `ContentShell` (first course-content load, `MainLoader`).

## 2. New loader
`@clearcut/motion/loader` `CCLoader` with `design="path"` (V5 Lesson Path: Nibbu hops up a chapter path, nodes tick, trophy shines). Wrapped in `components/loader/AppLoader.tsx` (`AppFullScreenLoader` = fullscreen + tips, `AppMainLoader` = inline, no tips; language via `useMotionLang`, Marathi -> Hindi). Uncontrolled mode: CSS-delayed fade-in (250 ms), so fast loads show nothing and no loading logic changed.

## 3. Backup / revert
- `components/loader/legacy/FullScreenLoader.legacy.tsx` — verbatim copy of the old shared component (self-contained).
- `components/loader/legacy/FullScreenLoader.original-reexport.tsx.txt` — verbatim copy of the old `FullScreenLoader.tsx`.
- `packages/ui/src/full-screen-loader.tsx` NOT modified (apps/landing still uses it).
- `components/FullScreenLoader.tsx` is now the only switch. Revert: `NEXT_PUBLIC_LEGACY_LOADER=true` + rebuild, or `USE_LEGACY = true`, or restore the `.txt` backup over it. No call site changes. Verified: flipping `USE_LEGACY` renders the old spinner again.
- Landing is not part of the trial.

## 4. Tests (Playwright, local dev, mocked API)
See section 5 of the hand-over; harness page removed afterwards.

## 5. Follow-up (2026-11-06, user request): never cut the loader mid-animation
Problem: when the data arrived, the loader unmounted at once (mid-hop). Fix: `components/loader/useLoaderHold.ts` — if the loader was actually visible (loading lasted > 250 ms), it stays until the CURRENT 3.2 s loop completes (max one loop); a load that ends before the loader appeared adds no wait. Used by `ProtectedPage` (only for its default loader fallback, not custom skeleton fallbacks) and `ContentShell`. Payment verifying screen unchanged (it already stays until the redirect).
Tested on a harness: 100 ms load -> content immediately, no loader; 1.2 s load -> content at the first loop end (3.2 s after mount); 3.5 s load -> content at the second loop end (6.4 s). Trade-off: a slow load can now show the loader up to ~3 s longer. Pushed 2026-11-06.
