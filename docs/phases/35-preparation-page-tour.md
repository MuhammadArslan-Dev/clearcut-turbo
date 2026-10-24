# Phase 35 — Preparation page tour: audit, fixes, topic tour, coverage guard

**Status:** built and tested locally (2026-10-24), not pushed.
**Repos:** CM `apps/dashboard` (+ `.github/workflows/ci.yml`)
**Decision (user, 2026-10-24):** two tours. The CC-79 "start here" tour stays short; a second tour runs the first time a topic is opened; a "How to use this page" link replays everything.

## Inventory and gap table

The page has 11 places a student needs to understand. Before this phase the tour (CC-79) pointed at 3 of them.

| # | Component (file) | Before | Issue | Fix |
|---|---|---|---|---|
| 1 | Subject tabs (`SectionsTab`) | step 1, `#start-guide-subjects` | none (hidden when the paper has one subject, step skipped, correct) | `data-tour="prep-subjects"` |
| 2 | First free chapter header (`Sidebar`) | step 2 | copy said "open it", but tapping a free chapter header does nothing; also called "free" for paid students | copy "This chapter is free / All its topics are open to you"; step only for students who haven't bought the course |
| 3 | First free topic (`Sidebar`) | step 3 | title "Tap here" on desktop | "Start with this topic" |
| 4 | Study path, Video → Notes → Test (`ChapterDetailHeader`) | not covered | — | topic tour step |
| 5 | Video card (`VideoWrapper`) | not covered | lazy (async fetch, skeleton first) | topic tour step; skeleton marked `data-tour-loading` so the tour waits |
| 6 | Notes / Concepts / Trends / Bonus videos tabs (`RelatedContentWrapper`) | not covered | lazy | topic tour step + loading marker |
| 7 | Start Topic Test (`BottomBarV2` desktop, `BottomBar` V1 on phones) | not covered | rendered twice (phone + desktop copy, one hidden) | step; the visible copy is picked at run time |
| 8 | Next topic (both bottom bars) | not covered | rendered twice; locked "Unlock" variant must not be the target | step on the unlocked button only |
| 9 | Paper: Add/Change Paper (desktop bottom bar), paper tabs (Topbar, < lg) | not covered | two different controls per breakpoint | one step, two targets, visible one wins |
| 10 | Index button (`Sidebar`) | not covered | — | step (desktop, and phone list view) |
| 11 | Course / Test Series switch (`Topbar`, mirrored in `BottomPageSwitchReveal`) | not covered | mirrored copy is 0 px wide until you scroll | step; the 0-px copy is never picked |
| — | First-visit guide modal (`GuideLine`) | starts the tour | — | unchanged |
| — | Floating Unlock widget (`PaywallFloatingWidget`) | hidden during tour | — | unchanged, now for every tour |
| — | Modals (chapter index, mini test, change paper, paywall) | — | a tour must not start over them | topic tour waits while a modal/paywall is open |

**Behaviour bugs found and fixed**

| Issue | Where | Fix |
|---|---|---|
| "Is it visible?" used `offsetParent`. On phones the chapter list and the topic view are both mounted and one is slid off-screen with a transform, so an off-screen element counted as visible (e.g. opening the page with `?topic=`). | `StartGuide` | `isOnScreen()` checks size, `visibility` and that the element is horizontally inside the viewport (`tour/tourTargets.ts`). |
| Click-to-advance set `element.onclick` from a `MutationObserver` on the whole body; the handler stayed on the element after the tour, and every click (even "Start Topic Test", which opens a modal) just moved to the next step over the modal. | `GlobalTour` | one capture-phase click listener; each step says `advanceOnClick` true (in-place change → next step) or false (opens something → tour ends). |
| Browser back / swipe back with a tour open left the overlay pointing at a slid-away element. | `GlobalTour` | `popstate` ends the tour. |
| Tour could start before topic content loaded and silently drop steps. | `StartGuide` | waits until required targets are on screen, no `data-tour-loading` skeleton is on screen, and the set of targets is stable (max 8 s). |
| No way to see the tour again. | — | "How to use this page" link under the progress card. |
| Stale `id="step-1"` / `id="step-2"` from an old tour on the bottom bar / desktop header. | `preparationPage.tsx` | left in place (nothing reads them; user rule: don't delete). |

**Not tour bugs, seen while testing (not changed):**
- `ChapterDetailHeader` shows a hardcoded English "Progress:", and the Trends tab rows ("Topic Importance", "Marks Asked"…) are English in /hi.
- "The Prelude" (HTET Level 2, English) lists Video in its study path but no video card renders.
- Local backend: `GET /v2/daily-tests/{id}/history` returns 500 on `/dashboard`.

## Step configuration

Ids: `src/components/features/preparation/components/startGuideIds.ts` (`PREP_TOUR`). Steps: `prepTourSteps.ts`. Runner: `StartGuide.tsx`. Elements carry `data-tour={PREP_TOUR.<key>}`.

| Order | Target | Tour | Tap on it | Notes |
|---|---|---|---|---|
| 1 | subjects | start | next step | |
| 2 | freeChapter | start | next step | free / trial students only |
| 3 | firstTopic | start | next step (on phones this opens the topic → topic tour follows) | required |
| 4 | studyPath | topic | next step | required |
| 5 | video | topic | ends tour | skipped when the topic has no video |
| 6 | contentTabs | topic | next step | |
| 7 | startTest | topic | ends tour | skipped when the topic has no test |
| 8 | nextTopic | topic | ends tour | skipped when next is locked / last topic |
| 9 | paper | topic | ends tour | |
| 10 | index | topic | ends tour | |
| 11 | pageSwitch | topic | ends tour | |

When each runs:
- **start:** after the first-visit modal, or on a later visit while nothing has been opened; at most 2 times per course (`cc-start-guide:<courseId>`, unchanged).
- **topic:** once per device (`cc-topic-guide`). Phones: when the topic view opens. Desktop: when the student picks another topic, or right after finishing the start tour. Never over a modal or the paywall.
- **replay:** every step that is on screen now, in the order above. It also marks the topic tour as seen.

Analytics: the existing `guide_shown` / `guide_step_viewed` / `guide_skipped` / `guide_completed` events, plus `tour` (`start` | `topic` | `replay`) and `step_name` (the target). No new events.

## Copy (en; hi/mr in `messages/{hi,mr}.json` → `startGuide`)

| Step | Title | Body |
|---|---|---|
| subjects | Choose your subject here | Each tab is one subject of your exam. |
| freeChapter | This chapter is free | All its topics are open to you. No payment needed. |
| firstTopic | Start with this topic | Watch the video, read the notes, then take a short test. |
| studyPath | Your study path | Video, then notes, then a short test. Follow this order for each topic. |
| video | Watch the lesson | Start with the video for this topic. |
| contentTabs | More on this topic | Notes, key concepts, exam trends and extra videos are here. |
| startTest | Test yourself | A quick test shows how much you remember. |
| nextTopic | Next topic | Done here? Move on to the next topic. |
| paper | Your paper | Switch to another paper of your exam, or add one. |
| index | All chapters | Open the index to jump to any chapter. |
| pageSwitch | Test Series | Switch here for full-length mock tests. |
| link | How to use this page | — |

## Automated guard

`pnpm --filter dashboard check:tour` (`apps/dashboard/scripts/check-tour-targets.mjs`, runs in CI after the colour check) fails when:
- a `PREP_TOUR` id has no step,
- no component renders it (`data-tour={PREP_TOUR.x}` / `tourId={PREP_TOUR.x}`),
- a step points at an unknown id, or
- a title/body key is missing in en, hi or mr.

Verified: removing `data-tour` from the video card makes it exit 1 with "PREP_TOUR.video is not rendered by any component".

The repo has no Playwright runner. The browser checks below were run with Playwright by hand. Adding `@playwright/test` would turn them into a spec, but that is a new dependency.

## Test checklist (run after any change to the preparation page)

Setup: clear `cc-start-guide:<courseId>` and `cc-topic-guide` in localStorage. For "first-time", make `/v2/interactions/learning-progress/by-topic` return `{"data":{}}` (Playwright `page.route`), so no database change is needed.

| # | Case | Expect | 2026-10-24 |
|---|---|---|---|
| 1 | Desktop 1366, first-time | badge + start tour 3 steps, last button "Got it" | pass |
| 2 | …then "Got it" | topic tour starts by itself (8 steps on a topic with video + test) | pass |
| 3 | Skip on step 1 | tour, overlay gone; Unlock widget back | pass |
| 4 | Reload (2nd visit) / Escape | start tour again / closes | pass |
| 5 | 3rd visit | no tour (count 2) | pass |
| 6 | Desktop, returning student (has progress) | no start tour on load; picking another topic → topic tour once | pass |
| 7 | Tap the highlighted "Start Topic Test" | tour ends, Topic Test opens | pass |
| 8 | Replay link, desktop | 10 steps (no video on that topic), each highlights its own element, ends clean | pass |
| 9 | Phone 390, first-time, /hi | start tour 3 steps in Hindi; tap the highlighted topic → topic view → topic tour (4 steps) | pass |
| 10 | Phone, topic with video + test | 5 steps: path, video, tabs, test, next | pass (failed before the V1 bottom-bar targets + loading wait were added) |
| 11 | Phone, back with tour open | tour + overlay gone | pass (failed before the `popstate` fix) |
| 12 | Phone list view, replay | 5 steps, no off-screen content steps | pass |
| 13 | Tablet 820 (phone layout), paid course | no "free chapter" step; replay uses paper tabs | pass |
| 14 | Tap Course/Test Series on its step | navigates, no overlay left on Test Series | pass |
| 15 | Back to leave the page with tour open | no overlay / `driver-active` body class left | pass |
| 16 | `pnpm --filter dashboard check:tour` | passes; fails when a target is removed | pass |

Not run: Marathi on screen (copy checked by the guard), a real iPhone / Android WebView, and a course where every chapter of the current subject is locked. In that last case the start tour has no topic to point at; it doesn't start, and tries again when the subject changes.
