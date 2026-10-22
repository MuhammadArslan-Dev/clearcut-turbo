# Phase 18 — CC-105 + CC-83: content and subject-card taps that do nothing

**Status:** Built + verified locally (2026-10-22) — not merged, not deployed
**Jira:** [CC-105](https://clear-cutoff.atlassian.net/browse/CC-105), [CC-83](https://clear-cutoff.atlassian.net/browse/CC-83)
**Repos:** CM `apps/dashboard` (branch `phase-18-content-dead-taps`); BE (branch `phase-18-free-chapter`: db0b72f, 53ca90b)
**Size:** small, UI behaviour with existing components (no new design)

## What the tickets say (Clarity, 90 days)

**CC-105: content pages (topic=, content/notes, content/pyqs)**
| Control | Dead clicks | Sessions |
|---|---|---|
| "View PDF" | 82 | 30 |
| "✕" close (popup/PDF) | 98 | 27 |
| "Papers" tab | 132 | 20 |
| "Start Learning" | 65 | 19 |
| "Show Correct Answer and Explanation" (topic tests) | 413 | 12 |
| Answer options A/C/D (topic tests) | ~830 | ~13 |

Asks:
- ✕ close: tap area ≥ 44×44 px with nothing on top; also close on Back and on a tap outside.
- View PDF: opens at once with a loader. Large PDFs show "PDF डाउनलोड हो रहा है…" with progress. In FB/IG in-app browsers, open in a new tab or an in-page viewer.
- Papers tab: switches, or is hidden when empty.
- Topic-test answer options: the whole row is tappable.

**CC-83: preparation subject card "30/150 marks · 0/0 chapters"**
- Students tap the card and nothing happens.
- "0/0 chapters" looks like there's no content.
- Asks:
  - The whole card opens the subject's chapter list.
  - Show the real count ("0/12 अध्याय पूरे"), never 0/0.
  - If "30/150" is the subject's exam weight, say so ("परीक्षा में 30 अंक").

## What the code shows (2026-10-22, first pass)
- View PDF card: `components/features/downloadable-content/components/cards/CourseContentCard.tsx`
- Papers tab: `components/features/downloadable-content/components/ContentPageSwitch.tsx:46` (`t("papers")`)
- Topic tests ("Show Correct Answer", options): `components/features/preparation/components/RelatedContent/Content.tsx`
- Subject card with marks/chapters: `components/layout/preparation/Sidebar.tsx`. `Sidebar animation.tsx` is a stale copy; don't edit it.
- Not yet traced: which modal owns the ✕ the tickets mention (PDF viewer vs popup), and where "0/0" comes from (empty chapter count from the API, or a count before data arrives).

## What was found (2026-10-22)
- **View PDF:** on phones the PDF opened in an iframe, which Android Chrome and the FB/IG in-app browsers don't render. The modal stayed blank, so the tap looked dead. The ✕ was about 30×24 px, and Back left the page instead of closing the modal.
- **Papers tab:** on a slow phone (4× CPU, Slow 4G), nothing changed for about 1.3 s after the tap. Then the Papers page showed "Loading notes...".
- **Answer options:** the options in the topic page's PYQ modal (`PreviousModal`) and the Papers page's paper modal (`ExamInstanceModal`) looked tappable (`cursor-pointer`) but had no click handler. This is the ~830 dead taps.
- **Subject card:** "30/150 Marks" was **hardcoded** for every subject, every student (since the first push). The real marks are in `e_sections.total_marks` (HTET English 60, CDP 30, …) but the API didn't send them. "0/0 chapters" showed while the list loaded. The card had no tap handler.
- **Bigger find (BE):** the trial "first chapter free" rule was `chapter_order == 1`, but `chapter_order` counts across a whole subject. A level's section can start at 10 (HTET L2 English), so trial students got **no free chapter there**, even though CC-67's copy promises one. Locally, 3 of 29 subjects have no chapter with order 1. **Production (section-level query, 2026-10-22): 2 sections affected: 8 English (starts at order 10, 36 chapters) and 13 Home Science (starts at 5, 6 chapters).** The fix unlocks exactly their first chapter and changes nothing elsewhere.

## What was built
- **BE** `ChapterResource`: the free chapter is the lowest `chapter_order` in that section's list (both callers: preparation + notes).
- **BE** `SectionResource`: returns `total_marks`, selected in `PreparationService`. The `group_sections:*` cache (30 min) picks it up by itself after deploy.
- **FE** `PdfViewerModal.tsx` (`usePdfViewer`, shared by notes + papers):
  - Phone width: opens a new tab.
  - Desktop: modal with "Opening PDF…" until the iframe loads, a 44×44 ✕, Esc, and a tap outside to close.
  - Back closes it (one history entry per open; ✕ removes it).
  - Above the floating widget (`--z-modal`).
- **FE** `TabSwitch` link mode: the tapped tab shows active at once (49 ms after the tap vs ~1.3 s before). `notes/loading.tsx` and `pyqs/loading.tsx` now show the page skeletons.
- **FE** option rows in `PreviousModal` and `ExamInstanceModal` are buttons. A tap opens the answer + explanation. Look unchanged.
- **FE** subject card:
  - Tapping it opens the chapter Index.
  - Shows "Exam: 60 marks" / "परीक्षा: 60 अंक" / "परीक्षा: 60 गुण", hidden if the backend sends no marks.
  - "–" instead of 0/0 while loading; labels don't wrap.

## Verification (local, Playwright, test user 9988776655 on trial_end)
- [x] Trial user: HTET L2 English chapter 1 (order 10) now unlocked; section 9 (order 1) unchanged.
- [x] Phone: View PDF opens the S3 PDF in a new tab.
- [x] Desktop: modal ✕ is 44×44; Back closes it and stays on /content/notes; ✕ then Back leaves no stale entry.
- [x] Papers tab pill moves 49 ms after the tap under 4× CPU + Slow 4G; no "Loading notes" on Papers.
- [x] PYQ modal: tapping option B opens "Answer & Explanation".
- [x] Subject card: no "30/150", shows "Exam: 60 marks", no "0/0", tap opens Index. en + hi on one line at 390px.
- [x] tsc / eslint: no new errors in touched files (Sidebar.tsx(121) and 15 lint errors already on main). `check:colors` passes.
- [ ] `ExamInstanceModal` option tap not clicked through (the local trial user sees no paper list). Same change as PreviousModal.

## Plan
- [ ] Trace each control with Playwright at 390px (and an FB in-app UA): is the tap swallowed (overlay, `pointer-events`, small hit area) or is the handler slow?
- [ ] ✕: ≥ 44px hit area via padding (no visual change), Back closes (`useBackHandler`-style), tap outside closes.
- [ ] View PDF: immediate loading state, a progress line for big files; new tab in FB/IG (reuse `isFacebookOrInstagramInAppBrowser` logic).
- [ ] Papers tab: hide when there's no content, or fix the switch.
- [ ] Topic-test options: the whole row is the button (`QOption` pattern from the attempt UI).
- [ ] Subject card: whole card tappable → chapter list; real chapter count; marks label clarified (en/hi/mr).
- [!] 🛑 **D1:** "30/150": is it the subject's marks in the exam, or the student's score? Confirm from the API before rewording.
- [!] 🛑 **D2:** PDF in FB/IG: new tab (simple) or an in-page viewer (heavier)?
- [ ] Verify: Playwright taps at 390px, en/hi/mr; tsc, eslint, check:colors; before/after screenshots.

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| 2026-10-22 | Free chapter rule | Backend fix: first chapter of each section's list is free | User |
| 2026-10-22 | D2 PDF | Phone + FB/IG: new tab; desktop: modal | User |
| 2026-10-22 | D1 30/150 | Read the API, label it honestly: it was hardcoded; now the section's own exam marks | User ("find out from code") |
