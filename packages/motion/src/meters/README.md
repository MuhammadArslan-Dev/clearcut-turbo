# Cutoff Meter (`@clearcut/motion/meters`)

A 1:1 port of the approved **Cutoff Meter Studio** design (phase 96): the predicted-marks meter, its 9 states, 8 animation moments and the surfaces where it appears. React + CSS Modules + inline SVG, no animation libraries. Like the rest of the motion library, it is **gallery-only** until the product says where it goes (dashboard dev route `/animation-preview#meters`, "Cutoff Meter" tab).

## Use

```tsx
import { Meter, type MeterHandle } from "@clearcut/motion/meters";

// declarative: spring in to a value (band = confidence ±marks)
<Meter variant="gauge" lang="hi" value={82} band={6} />
<Meter variant="bar" size="sm" locked />

// imperative, for timed sequences (same verbs as the studio)
const m = useRef<MeterHandle>(null);
<Meter ref={m} />;
await m.current!.set(88, { band: 6 });   // needle spring + count-up, 1150 ms
m.current!.delta(6);                      // +6 chip, 1600 ms float
m.current!.cool(true);                    // desaturate + ❄ chip
await m.current!.unlock();                // lock shakes and breaks, 650 ms
m.current!.wobble();
```

Other exports:
- `MeterScreen`: the full phone screen for one state.
- `MetersStudio`: the whole studio with its toolbar.
- `MeterSurfaces` and `MeterLogic`.
- `MOMENTS` (the 8 sequences) and `STATES` (the 9 states, en/hi copy verbatim from the design).
- `useFx` (confetti, burst, stamp, toast).
- `Nib`.
- Pure logic: `zoneOf`, `segments`, `gapText`, `riderPose`, `ZONES`, plus `DEFAULT_SCALE` (150 / 90, HTET L2 General). Every component takes a `scale: { max, cutoff }`.

**Slow motion:** wrap the tree in `<MeterMotionContext.Provider value={{ k: 2 }}>`. `k` multiplies every JS timer and every CSS duration (`--k`).

**Reduced motion:** jumps to the end state but keeps the delta chip (design spec).

## Zones (relative to the student's cutoff)
- **need:** below cutoff − 15
- **almost:** cutoff − 15 up to the cutoff
- **clear:** cutoff up to cutoff + 10
- **safe:** cutoff + 10 and above
- **locked:** no tests yet
- The pill reads "Early estimate" while the band is ±12 or wider.

## Nibbu
The meter uses the approved `NibMascot` in `frame="tall"`. The design needs three additions, made additively: mood `sleepy` and accessories `zzz` and `star`. The existing moods and accessories render byte-identically, verified for all 18 old combinations.

## Deviations from MOTION_GUIDELINES
- **§4.8 (transform/opacity only):** kept exactly as designed. The needle and fill use `stroke-dashoffset`; the fill bar animates `width` and `left` (fill and rider); cooling animates `filter`; section bars animate `width`.
- **Fonts:** the studio uses Noto Sans 400–800. The package uses the host app's `next/font` variables (`--font-noto-sans`, `--font-noto-devanagari`) and does not load fonts itself. The dashboard loads weights 400/500/600 only, so the studio's 700/800 weights render as 600 there.
- **Slow motion:** the gallery's global slow switch (`playbackRate` 0.5 on CSS animations) and the studio's own switch (`--k` / `k`) are independent. Use one at a time.
