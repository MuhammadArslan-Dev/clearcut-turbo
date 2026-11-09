# Phase 82 — Test start + submit animations as overlays (modal on desktop, bottom sheet on mobile)

**Tickets:** (new, from user)
**Repos:** CM (`packages/motion`, `apps/dashboard`)
**Branch:** local only on `feature/practice-test-flag` working tree — **not committed, not pushed**
**Created / start date:** 2026-11-06
**Status:** In Review — implemented and tested locally (mocked API); awaiting the user's own test

---

## 1. Problem
The 3-2-1-Go intro (phase 80/81) and the "checking your answers" animation covered the whole screen with a white page, so the test (and its timer) vanished and it felt like leaving the test. Submit was the worst case: the learner's test disappears for a long wait.

## 2. Decisions
- Library: `TestIntro` and `TestSubmit` got `presentation="cover" | "sheet"` (default `cover` = unchanged full screen, so the Mini Test pane and the preview gallery are untouched). `sheet` = dimmed backdrop + bottom sheet (<768px) / centred modal (>=768px); the artwork keeps its approved design, only the scale (`--k`) is smaller so the test behind stays visible.
- `TestStartIntro` and `SubmitOverlay` (dashboard wrappers) pass `presentation="sheet"`, so Daily, Practice, Chapter, Sectional and Full all follow.
- Intro keeps its Skip button (no X). Submit has NO skip / close / grabber / swipe: no backdrop tap, Escape and Tab are swallowed, keydown never reaches the page behind, a tap on the backdrop cannot move focus out of the panel (`onMouseDown` preventDefault + refocus on blur). It ends only through `onFinish`.
- Daily: the attempt screen mounts only after the intro (its timer starts on mount), so the intro there sits over the plain page background instead of the test. Practice and the exam tests show the real screen behind.

## 3. Bugs found by testing
- My modifier class `.sheet` collided with the existing `.sheet` (paper-sheet artwork, `position:absolute`) in intro/submit CSS, collapsing the panel to its padding. Renamed `.inSheet`.
- A tap on the backdrop moved focus to `<body>` (later Tab/Enter could reach the page behind). Fixed as above.

## 4. Tests (Playwright, mocked API)
- Harness at 320x568, 360x640, 390x844, 768x1024, 1280x800: panel 370-533px high, never scrolls, no horizontal overflow.
- Real flows: chapter test from the list (390x844): intro sheet over the list, submit sheet over the exam question; Practice test (390x844): intro and submit sheets over the question. During submit: Escape, Tab, Enter, ArrowRight, backdrop tap, panel tap, wheel scroll — the sheet stayed, the URL did not change, zero buttons inside it, focus stayed inside; it closed only when the result opened. One end-exam / submit request.
- NOT done: real phones, Daily real page (same wrappers, not run end to end here), reduced-motion toggle.
