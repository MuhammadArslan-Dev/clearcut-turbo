# Phase 96 — Cutoff Meter motion (`@clearcut/motion/meters`)

**Tickets:** (new, from user, 2026-11-11)
**Repos:** CM (packages/motion, apps/dashboard preview only)
**Branch:** `feature/motion-meters`. Not merged to main.
**Created / start date:** 2026-11-11
**Status:** In Review. Built and verified locally; branch pushed, not merged.

## 1. Problem / objective
Port the approved **Cutoff Meter Studio** design (`C:\Users\Admin\Downloads\Cutoff Meter Studio.html`, a self-contained HTML/CSS/JS prototype) into the motion library as a new folder `packages/motion/src/meters`. It must match the design exactly: same look, same states, same animations and timings. This follows the pattern of the existing motion modules (React + CSS Modules + inline SVG, no animation libraries, `"use client"`).

## 2. Scope
- **In:**
  - **Meter component** with both styles from the design:
    - **Gauge**: semicircle; zone segments need / almost / clear / safe; cutoff tick and label; needle with knob; confidence band; number count-up; zone pill. Size `lg` and `sm`.
    - **Fill bar**: zone track, cutoff mark, rider Nibbu, band, scale. Size `lg` and `sm`.
  - **Overlays**: locked (lock icon, `?`), unlock (lock break), cooling (desaturate + ❄ chip), delta chip (`+6` / `−7` / tiny `+0.4`), wobble, burst ring, confetti, "Cleared ✓" stamp, toast.
  - **The 9 states** with their data and copy in en + hi: locked, calibrating / early estimate, far, close, cleared, safe, dropped, cooling, final week. Each has its phone screen: app bar, exam chip, meter card, gap line, 5-week sparkline, Nibbu bubble, "Your next moves" actions (with "These cover your gap"), and the section breakdown bars.
  - **The 8 animation moments**: unlock, open/sweep, live tick, score rises (toast), crossing the cutoff (burst + confetti + stamp + cap), score drops (ease-down + wobble + toast), cooling & warm-up, range tightens.
  - **The "Where it shows" surfaces**: home tile, locked tile, test-result delta, header pills, weekly report, push/WhatsApp nudge.
  - **Logic & spec** content (zones, range, what moves the meter, picking the 3 moves, motion tokens, copy rules) in the preview.
  - **Zone logic** as pure, exported functions: `zoneOf`, segments, `gapText`, configurable `max` / `cutoff` (defaults 150 / 90, HTET L2 General).
  - **Preview**: a "Meters" tab in the existing `MotionPreview` gallery (dashboard dev-only route `/animation-preview`), with the design's toolbar: Gauge / Fill bar, English / हिंदी, slow motion 0.5×, Replay.
  - **Nibbu additions needed by the design**, additive only: mood `sleepy` (closed eyes, flat mouth) and accessories `zzz` and `star`, using exactly the SVG from the design. Existing moods and accessories stay byte-identical.
- **Out (not doing):**
  - Wiring the meter into any real flow, page or API. Like the rest of the library it is gallery-only until the user says where.
  - Backend score prediction.
  - Analytics events. The design names them; implementing them is a later phase.

## 3. Implementation plan
- [x] `packages/motion/src/meters/`:
  - `zones.ts`: pure logic (`zoneOf`, `segments`, `gapText`, `riderPose`, gauge geometry; `scale` defaults to 150 / 90)
  - `Meter.tsx`: gauge + bar, lg/sm; declarative `value` / `band` / `locked` / `cooling`, plus an imperative `MeterHandle` (`set` / `setBand` / `lock` / `unlock` / `cool` / `delta` / `wobble`) for the timed moments
  - `meters.module.css`: the studio CSS, scoped; `--k` slow-motion factor
  - `effects.tsx`: confetti, burst, stamp, toast (the design's own, not `core/Confetti`)
  - `data.ts`: the 9 states copied verbatim from the HTML, en/hi
  - `MeterScreen.tsx`
  - `moments.tsx`: the 8 moments
  - `MetersStudio.tsx`: States · All states · Animations · Where it shows · Logic, plus the toolbar
  - `Nib.tsx`
  - `index.ts`
  - `README.md`
- [x] `package.json` exports `./meters`
- [x] Nibbu (additive):
  - mood `sleepy`, accessories `zzz` and `star`, `frame="tall"` (viewBox 0 -9 66 81)
  - 2 new poses in the gallery's Nibbu tab
  - MOTION_GUIDELINES Nibbu table
- [x] Gallery tab "Cutoff Meter" in `MotionPreview` (hash `#meters`)
- [x] Reduced motion: final state immediately, delta chip kept
- [x] Verified (see §8)

## 4. Progress / completed changes
- 2026-11-11: phase file and branch created. Design file read in full: 678 lines, no external scripts, Google Fonts only.
- 2026-11-11: built.
  - **New:** `packages/motion/src/meters/{zones.ts, Meter.tsx, meters.module.css, Nib.tsx, effects.tsx, data.ts, MeterScreen.tsx, moments.tsx, MetersStudio.tsx, index.ts, README.md}`
  - **Changed:** `packages/motion/package.json`, `src/nibbu/NibMascot.tsx`, `src/nibbu/NibMascot.module.css`, `src/preview/MotionPreview.tsx`, `MOTION_GUIDELINES.md`
  - **Fixes found during visual parity:**
    - font via the app's `next/font` variables (`--font-noto-sans`), because the literal "Noto Sans" fell back to the system font
    - heading weights, because Tailwind preflight resets them
    - 390 px overflow: studio `min-width: 0` and `minmax(0, 1fr)`
    - `--k` fallback, so nested scopes don't reset slow motion

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-11 | Where | `packages/motion/src/meters`, "same to same" as the studio file (user) |
| 2026-11-11 | Nibbu sleepy / zzz / star are not in the library | Add them additively, exactly as drawn in the design (developer; the user asked for "same to same") |

## 6. Blockers / risks
- `MOTION_GUIDELINES.md` §4.8 says to animate only transform and opacity. The design animates `stroke-dashoffset`, `width` / `left` (bar fill and rider) and `filter` (cooling). Kept as designed ("same to same"); the deviation is noted here and in the README.
- Fonts: the design uses Noto Sans and Noto Sans Devanagari from Google Fonts. The package inherits the app font and does not load fonts itself.

## 7. Dependencies / packages added
None. New package export `@clearcut/motion/meters`.

## 8. Tests and verification
- [x] **Baseline:** the original HTML served locally and captured with Playwright (reference set under `scratchpad/meters/ref*-*.png`)
- [x] `tsc` `packages/motion`: clean
- [x] `tsc` `apps/dashboard`: 111 errors with and without this change (diffed per file: 0 new). The old "93" baseline is stale because `main` moved.
- [x] `pnpm check:colors`: no new counted literals (motion is excepted)
- [x] `pnpm turbo run build --filter=dashboard`: compiled successfully
- [x] **Nibbu byte-identity:** old vs new `NibMascot` `renderToStaticMarkup` for 18 combinations (3 moods × 3 accessories × 2 looks): 0 differences
- [x] **Visual parity**, `/animation-preview#meters` vs studio HTML at 1440 px:
  - all 9 states (gauge), 4 states (bar), Hindi, All states, Animations (t ≈ 1.7 s / 3.7 s / end), Where it shows, Logic
  - same numbers, zones, pills, colours, needle/band/tick, copy, Nibbu poses, cooling desaturation and ❄ chip, `+0.4` / `+3` / `−7` chips, stamp, confetti, toasts
- [x] **390 px:** no horizontal overflow in any sub-view, en + hi (scrollWidth = 390)
- [x] **Slow motion 0.5×:** count at 1.1 s reads 67 (normal speed: 106); both end at 108
- [x] **Reduced motion:** final value (81) shown at 800 ms, delta chip kept
- [x] No page errors in the console
- [ ] **Not verified:**
  - ESLint: `packages/motion` has no ESLint config; the dashboard config ignores files outside the app, as for every other motion module
  - real phones / RN WebView
  - Marathi (the design has en + hi only)
  - pixel-exact text wrapping: the dashboard hides the screen scrollbar (about 15 px wider than the studio) and loads Noto Sans only at 400/500/600, so the studio's 700/800 weights render as 600
- [x] **Security note:** opening the preview with a stale local token triggered `redirectToLogin()` to the production site (`clearcutoff.in` → `app.clearcutoff.in/dashboard?token=…`, an existing session in the Playwright profile). All `clearcutoff.in` traffic was blocked for the rest of the run and nothing was used. The user may want to log that browser profile out.

## 9. Next steps
User reviews `/animation-preview#meters` (Cutoff Meter tab). Then merge to main on go-ahead, which deploys the dashboard; the preview is 404 in production unless `NEXT_PUBLIC_ENABLE_MOTION_PREVIEW=true`.
