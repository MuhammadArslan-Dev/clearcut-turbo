# EnrollSuccess

Shown inside the exam-enrolment sheet ("Select Paper" → "Select Subjects" → **Start Learning**) until the Preparation page is ready. It is the onboarding completion animation (same mascot, motion, timing and curtain, see `../onboarding`) with enrolment copy and the user's real selection path (the paper, then one option per group) drawn as the app's selected option cards.

```tsx
<EnrollSuccess
  exam="HTET Exam"
  selection={[{ title: "Level 2 (TGT)", subtitle: "Classes 6 to 8" }, "Hindi", "Maths & Science"]}
  progress={{ current: 2, total: 2 }}
  fit="parent"                      // plays inside the sheet / modal (use position: relative on it)
  ready={!!prepData}
  onDone={() => router.push(`/preparation/${groupCode}?subject_selected=1`)}
  lang="en"
/>
```

Props: `exam`, `selection`, `ready`, `onDone`, `lang?`, `logo?`, `progress?`, `fit?` (`"screen"` | `"parent"`). The optional practice-test sheet (Amplitude flag) is not part of this animation.

Preview: motion gallery → Enrollment tab (the real sheet in an iframe, phone = bottom sheet, desktop = modal). Not wired into the real enrolment modal yet.
