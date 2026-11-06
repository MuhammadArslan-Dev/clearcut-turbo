# EnrollSuccess

Shown after the user picks subjects and enrolls in an exam, until the preparation page is ready.

**Sequence:** subject chips fly into the exam ticket (the counter ticks up as each lands) → ENROLLED stamp, confetti, Nibbu cheers → the next 7 days fill in as the study plan (the last day waits for `ready`) → the ticket zooms toward the user into the preparation page.

```tsx
<EnrollSuccess
  exam="HTET Level 2"
  subjects={selected}               // string[]
  ready={!!prepData}
  onDone={() => router.push("/prepare/htet-2")}
  lang="en"
/>
```

Chip flight paths are measured once on mount (one `getBoundingClientRect` per chip). Reduced motion: chips skip straight into the ticket, no stamp slam or zoom.
