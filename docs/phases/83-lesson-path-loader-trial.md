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
