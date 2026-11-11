# ClearCutoff Motion Guidelines

Use these for every new screen so the product feels like one system.

## 1. Character

Nibbu is approved. **Do not change its shape, face, colours or proportions.** Express state with the existing `mood` (`happy`, `determined`, `wow`, `sleepy`) and `accessory` (`cap`, `headband`, `zzz`, `star`) props and with motion, never by redrawing. `sleepy`, `zzz` and `star` come from the approved Cutoff Meter design (phase 96); `frame="tall"` gives the meter's taller box (room above the head).

| Moment | Nibbu |
|---|---|
| Waiting / loading | `happy`, gentle hop or bob |
| Effort ahead (full mock intro) | `determined` |
| Surprise / reveal (Go!, stamp) | `wow` |
| Below or close to cutoff | `determined` + `headband`, steady nod, no sad faces |
| Cleared / success | `happy` + `cap`, double jump |
| Well above cutoff (Cutoff Meter Safe Zone) | `happy` + `star`, star pops on |
| Inactive / cooling (Cutoff Meter, 3+ idle days) | `sleepy` + `zzz`, colours drain; back to `happy` on the next test |

## 2. Easing tokens

Defined on the loader root (`CCLoader.module.css`). Use literal values inside `@keyframes`.

| Token | Curve | Use for |
|---|---|---|
| `--cc-ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | entrances, reveals, things coming to rest |
| `--cc-ease-in` | `cubic-bezier(0.55, 0, 1, 0.45)` | exits, things leaving |
| `--cc-ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | pops, badges, chips (small overshoot) |
| `--cc-ease-io` | `cubic-bezier(0.65, 0, 0.35, 1)` | loops, breathing, sweeps |
| rise (gravity up) | `cubic-bezier(0.33, 1, 0.68, 1)` | upward half of a jump |
| fall (gravity down) | `cubic-bezier(0.32, 0, 0.67, 0)` | downward half of a jump |

Never use the `ease` keyword or `linear` for character motion.

## 3. Timing

| Thing | Duration |
|---|---|
| Micro-interaction (button press, toggle) | 120–200 ms |
| Element entrance | 300–500 ms, stagger siblings 60–90 ms |
| Exit | 220–360 ms (shorter than the entrance) |
| Scene loop | 3.2 s (`--cc-loop`) — one beat per loop |
| Loader appears after | 250 ms (never flash on fast loads) |
| Loader stays at least | 700 ms once shown (never flicker) |

## 4. Rules

1. **Split axes.** Anything that jumps gets separate X and Y layers. X glides; Y uses rise/fall. One shared curve makes it float.
2. **Every contact has weight.** Squash (≈1.15, 0.85) → stretch (≈0.9, 1.1) → small settle. Origin at the point of contact (`transform-origin: 50% 100%` for Nibbu).
3. **Lean into travel.** 4–8° forward on take-off, back to 0 on landing.
4. **Cause before effect.** The thing that causes a change moves first (nib touches → ink spreads → ripple → tick draws).
5. **One beat per loop.** Each scene builds to a single highlight, then resets quietly.
6. **Overshoot only on reveals.** Use `--cc-ease-spring` for things appearing, never for things leaving.
7. **No layout shift.** Reserve space; crossfade in a shared grid cell instead of swapping elements.
8. **Transform + opacity.** Avoid animating width, height, top, left, box-shadow, filter or blur. A short SVG stroke draw is fine.
9. **Honest progress.** Never show 100% before the server says done.
10. **Reduced motion is a design, not an off switch.** Show the meaningful end state (filled bubble, ticked line, cleared bar), still.

## 5. Copy tone

Short, encouraging, specific. Hindi and English for every string. After a low score, name the next step ("Start with Mathematics"), never a verdict.

## 6. Review checklist

- [ ] Looks right at 0.5× speed (gallery slow-motion switch)
- [ ] Still frame makes sense with reduced motion on
- [ ] No layout shift when it enters, loops or exits
- [ ] Works at 360 px width and in Hindi
- [ ] Only transform/opacity in DevTools → Rendering → Paint flashing
