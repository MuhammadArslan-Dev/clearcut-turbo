# Legacy loader backup (trial replacement, phase 83)

Before the Lesson Path loader trial, the dashboard's loading state was `@clearcut/ui/full-screen-loader`
(`packages/ui/src/full-screen-loader.tsx`: white screen, brand spinner ring, "Clear Cutoff", 3 pulsing dots; `MainLoader` = the bare ring).

| File | What it is |
|---|---|
| `FullScreenLoader.legacy.tsx` | Verbatim copy of the old shared component (self-contained, no imports). |
| `FullScreenLoader.original-reexport.tsx.txt` | Verbatim copy of the old `components/FullScreenLoader.tsx` (the one-line re-export of `@clearcut/ui/full-screen-loader`). |

`packages/ui/src/full-screen-loader.tsx` itself was NOT touched (apps/landing still uses it for its pre-hydration auth-redirect loader).

## Revert immediately

Pick one:
1. Set `NEXT_PUBLIC_LEGACY_LOADER=true` in the dashboard env and rebuild — `components/FullScreenLoader.tsx` then serves the legacy loader.
2. Or edit `components/FullScreenLoader.tsx`: set `USE_LEGACY = true`.
3. Or restore the old file: copy `FullScreenLoader.original-reexport.tsx.txt` over `components/FullScreenLoader.tsx`.

No call site changes in any of the three (they all import `@/components/FullScreenLoader`).
