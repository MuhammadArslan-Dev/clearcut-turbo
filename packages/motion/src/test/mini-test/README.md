# MiniTest

The mini test on the preparation page, in two directions to choose from (or ship both):

| `layout` | Feel | Key interactions |
|---|---|---|
| `"focus"` | Practice, Duolingo-like | One question at a time · Check → green/red feedback footer with explanation · Nibbu hops (right) or puts on the headband (wrong) · progress bar springs forward · streak flame, "3 in a row!" toast · keys 1–4 + Enter |
| `"exam"` | Real exam | OMR bubbles with ink fill · timer ring pill (amber at 25%, red + pulse at 10%, auto-submit at 0) · progress dots · mark for review · question palette sheet · submit confirmation with answered/marked/left counts |

```tsx
<MiniTest
  layout="focus"
  title="Child Development · Mini test"
  questions={[{ id, text, options: [...], answer: 1, explanation }]}
  minutes={5}                        // exam layout only
  onFinish={(r) => showResult(r)}    // { answers, correct, wrong, skipped, timeTakenSec, bestStreak }
  onExit={() => router.back()}
  lang="hi"
/>
```

The component fills its container (`height: 100%`). Feed `onFinish` into `<TestResult type="topic">` from the test-flow package for the result screen. Options are `role="radio"` buttons inside a `radiogroup`; the timer is `role="timer"`.
