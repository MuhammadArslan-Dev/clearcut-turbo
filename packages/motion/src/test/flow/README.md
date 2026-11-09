# ClearCutoff Test Flow (start → submit → result)

Three screens, three test types (`topic` · `daily` · `full`), Hindi + English. Same Nibbu, same tokens as the loader.

Only dependency is React. Uses the shared mascot in `../nibbu`. Preview: `../gallery/index.html` → Test flow tab.

## Install (Turborepo)

1. Copy `test-flow/` **and** `nibbu/` into `packages/ui/src/`.
2. Export it (e.g. `"./test-flow": "./src/test-flow/index.ts"` in `packages/ui/package.json`).
3. Import: `import { TestIntro, TestSubmit, TestResult } from "@clearcut/motion/test-flow";`

| Screen | Component | What happens |
|---|---|---|
| Start | `<TestIntro>` | Type visual (topic: Nibbu lands on a target · daily: streak flame · full: OMR sheet + exam clock + rules checklist) → 3·2·1 ring countdown → "Go!" burst → `onStart()` |
| Submit | `<TestSubmit>` | Scanner beam sweeps the answer sheet, ✓ ✗ – marks appear, counter climbs (never shows 100% before your API returns) → "CHECKED" rubber stamp → `onFinish()` |
| Result | `<TestResult>` | Score ring counts up with a cutoff tick → outcome moment → stats → per-type card → CTAs |

## Result outcomes (auto from `getOutcome`)

| Outcome | Rule | Nibbu | Moment |
|---|---|---|---|
| `pass` | score ≥ cutoff | graduation cap, double jump | green ring, glow, confetti, "Cutoff cleared!" |
| `near` | below cutoff by ≤ 8% of max (min 1 mark) | red headband, determined nod | amber ring, "Just 6 marks away" + weakest section |
| `below` | further below | red headband, determined nod | blue ring, no confetti, "Every attempt builds your score" + where to start |

No confetti and no sad face on a fail. The headband echoes the hero illustration on your homepage. Below-cutoff results are the majority on HTET L3, so that screen tells them exactly where their next marks are instead of feeling like a verdict.

Per-type card: **full** → section-wise bars + rank · **daily** → streak number flips (11 → 12), today's dot fills · **topic** → chapter mastery marker slides up a level.

## Wiring

```tsx
// 1. Start
<TestIntro type="full" title="HTET Level 2 · Full Mock 3" questions={150} minutes={150} marks={150}
  rules={["150-minute timer starts on Go", "Switch Hindi / English anytime"]}
  onStart={() => startTimer()} />

// 2. Submit — flip `done` when your evaluate API resolves
<TestSubmit type="full" total={150} done={!!result} onFinish={() => router.push(`/result/${id}`)} />

// 3. Result
<TestResult type="full" data={{ score, maxScore, cutoff, correct, wrong, skipped, timeTakenSec, sections, rank }}
  onReview={...} onSecondary={...} />
```

Only put real values in `rules` (e.g. "no negative marking" only for exams where that's true). `rank`, `sections`, `streak`, `mastery` are optional; the cards hide when absent.

## Notes

- Skip button on the intro (auto-focused). Repeat users shouldn't be forced through a countdown every daily test.
- `prefers-reduced-motion`: no countdown pops, no confetti, numbers show final values, scanner hidden.
- Overlays are `position: fixed`; the result is a normal page section.
- `examples/TestFlowDemo.tsx` is a working harness with sample data for all 9 combinations (3 test types × 3 outcomes).
