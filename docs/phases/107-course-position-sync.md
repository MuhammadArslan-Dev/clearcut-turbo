# Phase 107 — Resume position + paper/card sync (stale cache root causes)

Date: 2026-11-13. Branch `fix/course-position-sync` (frontend only; the backend already stores the position and, since phase 106, picks the card's paper from it).

## 1. Ask
1. Reopening a course must resume at the saved section → chapter → topic (after navigation, refresh, new session).
2. After switching Paper 1 → Paper 2 and returning to Learn WITHOUT a refresh, the My Course card + meter + progress must show Paper 2; no stale selection.

## 2. How it works (audited)
- One row per `(user, course group_code, mode='learning')` in `user_course_resume_states` (`paper_id, section_id, chapter_id, topic_id, last_accessed_at`); written by `POST /v2/interactions/resume-state`, requires a topic. Read by `/v2/preparation/{course}` (→ `paper_id`, `section_id`), by the chapters endpoint (→ `state`) and by `GET /v2/interactions/resume-state` (Learn resume bar).
- The Sidebar saves the settled selection 500 ms after each change.

## 3. Root causes (baseline measured in a real browser, old code)
| # | Cause | Evidence |
|---|---|---|
| C1 | The saved position is embedded in responses cached for 5–30 min (`["preparation", course]` staleTime 5 min: `paper_id`/`section_id`; `["chapter", section]` 30 min: `state`; `["resume-state", course]` 2 min). Nothing updated them when the student moved, so reopening in the same session restored the FIRST fetch's position. | picked section 2/topic 46 (saved correctly in SQL) → Learn resume bar showed an older topic → reopening opened `section=7&topic=44` |
| C2 | …and the page then SAVED that stale position over the real one. | SQL after reopening: `18\|7\|10\|44` (was `18\|2\|10\|46`) |
| C3 | `["chapter", sectionId]` was not scoped by course: two courses sharing a section id restored each other's `state`. | code |
| C4 | `selectPaper` kept the OLD paper's chapter/topic until the new chapters arrived, so the save in that window stored "new paper + old paper's chapter/topic"; `hydrateFromApi` took the fallback section and `selectedSection` from the FIRST paper even when the course resumed on another. | code |
| C5 | Leaving the page inside the 500 ms debounce aborted the pending save (cleanup `abort()`), so the last position was lost. | code |
| C6 | The card's `["my-courses"]` (5 min) and meter queries were not refreshed when the paper/position was saved, so Learn showed the previous paper until a reload. | after switching to Level 1 (SQL `15\|1\|35\|116`), Learn card still "Level 2 (TGT)"; after a reload "Level 1 (PRT)" |

## 4. Fix (one central place)
- `lib/preparation/courseSync.ts`: `patchCoursePosition` (writes the selection into every cache that embeds it, immediately) and `refreshCourseViews` (after the save lands: resume bar names, `my-courses`, meter, progress summary).
- `Sidebar.tsx`: patch on every settled selection; refresh after the save; skip the save while no topic is selected (a paper switch before its chapters load); flush the pending save on unmount / `pagehide` with `keepalive` (`setResumeState(..., {keepalive})`).
- `useChapterData`: key `["chapter", group_code, section]`.
- `usePreparationDataStore`: `selectPaper` drops the old paper's chapter/topic (unless the section is shared); `hydrateFromApi` uses the open paper's sections.

## 5. Not changed / limits
- One resume row per course: the position of the paper the student left is not remembered separately (switching back to it opens its first section, or the saved one if the saved paper matches).
- The resume row requires a topic, so a paper switch is saved once the new paper's first topic is selected (automatic).
- Console CORS error seen once on `resume-state` after navigation (request cancelled while leaving); not reproduced as a server error.
