# OnboardingComplete

Shown when the user finishes onboarding, until the dashboard is ready.

**Sequence:** Nibbu drops in with confetti and the user's choices pop in as chips (≈2.3s) → "Setting up your dashboard" with three steps that tick in order → the whole layer lifts away to reveal the dashboard underneath.

```tsx
<OnboardingComplete
  name="Priya"
  summary={["HTET Level 2", "Hindi medium", "20 min a day"]}
  ready={!!dashboardData}          // the last step waits for this — progress is never faked
  onDone={() => setShowOverlay(false)}  // render the dashboard underneath, or router.push here
  lang="hi"
/>
```

Render the dashboard **under** the overlay as soon as you can, so the curtain reveals real content. Steps can be overridden with `steps={[...]}`. Reduced motion: no drop/confetti, steps still tick, curtain becomes a fade.
