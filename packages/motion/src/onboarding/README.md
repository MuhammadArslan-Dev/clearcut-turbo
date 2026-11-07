# OnboardingComplete

Shown when the user finishes onboarding (after the exam step's Continue), until the dashboard is ready. Built from the app's real onboarding screens: the user's choices come back as the app's own *selected option cards* (language circle icon + name, exam name + "State (Type)"), under the brand logo and the "2/2" step bars.

**Sequence:** Nibbu drops in with confetti and the cards pop in (≈2.3s) → "Setting up your dashboard" with three steps that tick in order → the whole layer lifts away to reveal the dashboard underneath.

```tsx
<OnboardingComplete
  summary={[
    { title: "हिंदी", icon: <HindiLangCirclIcon /> },
    { title: "HTET Exam", subtitle: "Haryana (State)" },
  ]}
  logo={<img src="/logos/clear_cutoff_logo.png" alt="Clear Cutoff" />}
  progress={{ current: 2, total: 2 }}
  ready={!!dashboardData}          // the last step waits for this — progress is never faked
  onDone={() => setShowOverlay(false)}  // render the dashboard underneath, or router.replace here
  lang="hi"
/>
```

Props: `name?` (headline), `summary` (items or plain strings), `logo?`, `progress?`, `fit?` (`"screen"` default, `"parent"` = fill a positioned parent), `steps?`, and copy overrides `title` / `highlight` / `subtitle` / `buildingTitle` / `buildingSubtitle` (used by `EnrollSuccess`). Render the dashboard **under** the overlay as soon as you can. Reduced motion: no drop/confetti, steps still tick, curtain becomes a fade.

Preview: motion gallery → Onboarding tab (real screens in an iframe, phone / desktop, EN / हिंदी / मराठी, slow network). Wired into the real onboarding (phase 84): see `apps/dashboard/src/components/features/onboarding/OnboardingCelebration*.tsx`; revert with `NEXT_PUBLIC_LEGACY_ONBOARDING=true`.
