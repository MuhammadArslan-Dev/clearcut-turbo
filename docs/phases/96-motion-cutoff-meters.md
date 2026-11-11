# Phase 96 — Cutoff Meter motion (`@clearcut/motion/meters`)

**Tickets:** (new, from user, 2026-11-11)
**Repos:** CM (packages/motion, apps/dashboard preview only)
**Branch:** `feature/motion-meters`. Not merged to main.
**Created / start date:** 2026-11-11
**Status:** In Progress

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
- [ ] `packages/motion/src/meters/`:
  - `zones.ts` (pure logic)
  - `Meter.tsx` + `meter.module.css` (gauge + bar, imperative-free React state: value, band, locked, cooling)
  - `effects.tsx` (delta, confetti via existing `core/Confetti` if it matches, else the design's confetti; burst, stamp, toast)
  - `states.ts` (9 states, en/hi data)
  - `MeterScreen.tsx` (phone screen per state)
  - `moments.ts(x)` (8 moments as timed sequences)
  - `Surfaces.tsx`
  - `index.ts`
  - `README.md`
- [ ] `package.json` exports `./meters`
- [ ] Nibbu: `sleepy` + `zzz` / `star` (additive) and the guidelines table
- [ ] Preview tab "Meters" (States · All states · Animations · Where it shows · Logic), toolbar as in the design
- [ ] Reduced motion: jump to the final state, keep the delta chip (design spec)
- [ ] Verify:
  - `tsc` for `packages/motion` and `apps/dashboard`
  - eslint on touched files
  - `check:colors` (motion is an excepted, approved-artwork package)
  - dashboard build
  - screenshots side by side with the original HTML at 1440 px and 390 px, en + hi, both styles, slow motion

## 4. Progress / completed changes
- 2026-11-11: phase file and branch created. Design file read in full: 678 lines, no external scripts, Google Fonts only.

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
- [ ] Baseline: the original HTML opened in a browser (reference screenshots)
- [ ] tsc / eslint / check:colors / dashboard build
- [ ] Visual parity screenshots: 1440 + 390, en + hi, gauge + bar, each state and moment
- [ ] Reduced motion
- [ ] **Not verified:** (fill in)

## 9. Next steps
Build `meters/` in the background; report when done.
