# Phase 54 — Blog Home + Exam Page Redesign

**Tickets:** (new, from user)  
**Repos:** CM blog  
**Status:** Built (not committed); tsc + lint + check:colors clean; Playwright pending  
**Created:** 2026-10-27

---

## Built (2026-10-27)

| File | Change |
|---|---|
| `src/components/ui/exam/CourseCard.tsx` | **Reused, not replaced.** This component already existed with the same shape (logo + `CheckIcon` badge, the same four icon rows, the `examCard` i18n namespace) but had **zero importers** — dead code. Restyled to the design instead of adding a parallel card: `maxWidth` 400 → 540, the CTA moved from a bottom-of-card "Start 3-day FREE Trial" pill to a "View Exam →" button inside the facts column, the fixed `w-[200px]` facts column became fluid, and a new optional `href` wraps the card in a locale-aware `Link`. Dead props (`rating`, `badge`, `unlockClick`) dropped; `examData` renamed to `cutoff`. Stays presentational — it knows nothing about the `Exam` type. |
| `src/components/blog/blog-exam-cards.tsx` | Rewritten: hero, search input, the three filter chips, and the Central / State-grouped white section panels. Owns the `Exam` → `CourseCard` prop mapping, including a defensive `parseMetadata` — the old inline card called `JSON.parse` unguarded, so one row with null `metadata` took the whole listing down. Search matches short name, full name **and** state, so "haryana" finds HTET. Empty state when nothing matches. Container widened 900 → 1100 px. |
| `src/components/blog/sections/exam-levels-section.tsx` | Rewritten around a `LevelCard` (book-icon tile, name, detail line, chevron) + the blue info strip. `localise()` reads the row's `translation` JSON for the active locale with a fallback to the raw columns. The existing drill-down, redirect effect and the hidden crawlable root links are unchanged. |
| `messages/en.json`, `messages/hi.json` | **+29 lines each, additions only** — new `blogHome` (18 keys) and `examPage` (7 keys) namespaces. Verified no pre-existing key changed. |
| `src/types/course-data-types.ts` | `Exam.translation?: string` added (it was always on the payload, just untyped). |

### Decisions as built
- **D1-a / D2-a** — search and all three chips are client-side over the already-fetched list; no API change, no new request.
- **D3-b** — paper cards show name + class range only. The design's subject line ("Child Development, Language I & II…") is **not in the API**: `navigation` children are language subjects (English and Hindi, Hindi and Sanskrit, English and Sanskrit), so showing it would mean hardcoded syllabus copy to maintain per exam.
- **D4-a** — Hindi comes from the API's own `translation` JSON (`"Paper 1"` → the hi `name`, `"Classes 1-5"` → the hi `detail`) plus new hi.json copy.
- **D5-a** — header untouched.

### Known cosmetic difference from the mock
The mock reads "Classes I – V" (Roman numerals); the API's `detail` is "Classes 1-5", and D4-a says the API is the source. Changing it is a backend content edit, not a frontend one.

### Checks
- `npx tsc --noEmit` (blog): **33 = baseline**, zero errors in the changed files.
- `npx eslint` on the three components: **clean**.
- `pnpm check:colors`: blog **221 → 217** (the rewrite removed 4 hardcoded colours).

## Playwright run 1 (2026-10-27) — 22 PASS, 1 FAIL

Temp copy of the app on its own port against the live read-only API; en + hi at 1280 and 390.

Passed: hero/search/chips markup and copy; Central + State("Haryana") grouping; all four fact rows
with values; card and CTA both navigating; **search by name, by state ("haryana" → HTET), empty
state, all three chips, and chip+search combinations**; the exam page's breadcrumb, "CTET Blog"
pill, title, hint ("CTET has 2 papers…"), both paper cards, info strip, and the full drill-down
(Paper 1 → language subjects → `/ctet/paper-1?levels=english-and-hindi`); Hindi on both pages,
including paper names and class ranges coming from the API's own `hi` translations; no horizontal
scroll anywhere.

**FAIL (E23) — fixed.** At 390 px the Exam Date value was clipped with an ellipsis on both `/` and
`/hi` ("06 September 2026" → "06 Sep…"; scrollWidth 124 vs clientWidth 56). Cause: the 150 px logo
column left the facts beside it only ~190 px on a ~358 px card, and the value span was `truncate`.
Hindi was worse — its longer label left ~67 px. The mock is a 1280 design, where the card is 540 px
and it fits.

Fix: logo column `w-[104px] sm:w-[150px]` with tighter sub-`sm` padding, and the fact row is now
`flex-wrap` with `truncate` removed — so a value that still doesn't fit wraps to its own line
instead of being cut off. Desktop is untouched (all changes are below the `sm` breakpoint except
the wrap, which never triggers at 1280).

## Playwright run 2 (2026-10-27) — E23 fixed, no regression

Every value span and every label span at 390 now has `scrollWidth === clientWidth` in both locales
(e.g. CTET Exam Date 124/124 EN, 122/122 HI; Hindi labels complete). Short name, exam type and the
CTA are unclipped in the narrower column (CTET 36/36, "Eligiblity" 52/52, button 193/193). No
horizontal scroll at 390 or 1280. Links still resolve to `/ctet` and `/htet`. Desktop 1280 is
byte-for-byte the same as run 1 — nothing wraps, every row 20 px, card 540 px.

One row wraps at 390 in both locales: CTET's "06 September 2026", the longest value, sits on its
own line under its label (row 40 px instead of 20). **Left as-is deliberately** — it would need
~20 px more, and any fixed-width tuning would break again on a longer date ("25 September 2027"),
whereas the wrap degrades safely for every string. HTET's shorter date still fits on one line.

Run 2 re-ran only E22/E23/A6/A7 plus a 1280 spot-check; A1–A5, B, C and D were not repeated after
the layout change.

Cosmetic, not fixed: at 390 on `/hi/ctet` the Hindi title wraps to two lines and sits close under
the "CTET Blog" pill without overlapping it. `exam_type` renders as "Eligiblity" — a typo in the
API data, not in the code.

Not covered: exams other than CTET/HTET, `/hi/htet`, and the second-level drill-down in Hindi.

---

## Goal

Rebuild two blog pages same-to-same from the provided design screenshots:
1. **Blog home `/`** — exam listing with search, filter chips, grouped sections, exam cards
2. **Exam page `/[examName]`** — paper selection screen (CTET as canonical example)

Design files: `docs/screens/blog/Clear Cutoff Academy Exams Dashboard.png` and `docs/screens/blog/Clear Cutoff CTET Paper Selection.png`.

---

## Design Breakdown

### Page 1 — Blog Home `/`

| Element | Design spec | Current code |
|---|---|---|
| Header | Logo + "Start for FREE" blue pill + "EN" language button | ✅ Existing `Header` component (logo + language switcher + login/register buttons) |
| Hero title | "Exams on Clear Cutoff" — "Clear Cutoff" in `--color-brand` blue | `CustomizableHeader` exists, supports `highlightText` prop |
| Hero subtitle | "Start your journey of success with Clear Cutoff Academy" | New copy in i18n |
| Search input | "Search exams (e.g. CTET, HTET...)" with magnifying glass icon | New — no search input on current page |
| Filter chips | "All Exams" (active/blue) · "Central Exams" · "State Exams" | New — `Chip` from `@clearcut/ui/chip` exists |
| Section heading | "Central Teaching Exams" — "Central" in blue | New — reuse `CustomizableHeader` |
| State sub-heading | Under State section: "Haryana" (black, normal weight) | New |
| Exam card | Logo (with verified badge) · Exam name · divider · 4 metadata rows + "View Exam →" outlined button | Exists as `ExamCourseCard` in `blog-exam-cards.tsx` but needs redesign to match |

#### Exam card metadata rows (from `metadata` JSON field — already in API):
- 📅 Exam Date: `metadata.exam_date`
- 📋 Exam Mode: `metadata.exam_mode`
- ⏱ Duration: `metadata.duration`
- 🏆 Cutoff: `metadata.cutoff`

#### Central vs State grouping logic:
- `state === "India"` → "Central Teaching Exams" section
- `state !== "India"` → "State Teaching Exams" section → sub-grouped by state name (`translation[locale].state` or `state`)

---

### Page 2 — Exam Page `/[examName]`

| Element | Design spec | Current code |
|---|---|---|
| Breadcrumb | Home icon / CTET chip | ✅ `CustomBreadcrumbs` exists |
| Top-right pill | "CTET Blog" outlined pill button | Exists as an inline Link in current page |
| Hero title | "CTET Exam on Clear Cutoff" — "CTET" in blue | ✅ `ExamLevelsSection` sets this via `CustomizableHeader` |
| Hero subtitle | "Select the paper you want to practice. You can change it anytime." | Current subtitle: "Select the subjects you want. You can update later!" → **copy change** |
| "Choose your paper" label | Bold label above cards | New inline heading |
| Paper descriptor line | "CTET has two papers. Each paper has different subjects and syllabus." | New inline copy |
| Paper card | Book icon in light-blue square + paper name + class range + subject list → chevron | **Full redesign** — current code renders `ExamSelectionContainer` (generic selector) |
| Info strip | Light-blue background: "You can switch between papers anytime from the top menu." | New — simple info row |

#### Paper card data mapping:
- Paper name: `navigation[i].translation[locale].name` (e.g. "Paper 1" / "पेपर 1")
- Class range: `navigation[i].translation[locale].detail` (e.g. "Classes 1-5" / "कक्षा 1-5")
- Subject list: **⚠️ NOT in API** — API `navigation` children are language subjects (English and Hindi, Hindi and Sanskrit…), not CDP/Math/EVS. Subject descriptions in design are hardcoded per exam.

---

## API Data Fields Confirmed

From `GET /blog/exam?status=active` and `GET /blog/exam?short_name=ctet&enavigation=true&first=true`:

```
Exam-level:
  short_name      e.g. "CTET", "HTET"
  name            e.g. "Central Teacher Eligibility Test"
  logo_url        S3 WebP URL
  state           "India" (central) | "Haryana" | "Rajasthan" | …
  metadata        JSON: { exam_date, exam_mode, duration, cutoff }
  translation     JSON: { en: { state }, hi: { state } }   ← locale state name
  slug            null (not used yet)

Navigation (papers, from enavigation=true):
  id, slug        e.g. "paper-1", "paper-2"
  parent_id       null = top-level paper
  group           "Paper"
  translation     JSON: { en: { name, group, detail }, hi: { name, group, detail } }
```

---

## Steps

### Step 1 — Blog Home: ExamCard redesign
**File:** `apps/blog/src/components/blog/blog-exam-cards.tsx`
**File:** `apps/blog/src/components/blog/exam-card.tsx` (new, extracted)

- Extract `ExamCourseCard` into a standalone `ExamCard` component
- Layout: two-column header (logo + verified badge left, exam name right) with a vertical divider, then 4 metadata rows (icon + label + value), then "View Exam →" outlined button
- Use `@clearcut/ui/button` variant `outline` / `@clearcut/ui/card` for wrapper
- Use `@clearcut/ui/icons/*` for calendar, clock, info, chart icons (already imported in current code)
- No new colors — `--color-brand` token for active/highlight, `--color-neutral-border` for divider, existing card bg

### Step 2 — Blog Home: Search + Filter + Section grouping
**File:** `apps/blog/src/components/blog/blog-exam-cards.tsx` (or new `blog-home-page.tsx`)

- Add `useState` for `searchQuery` (string) and `activeFilter` ("all" | "central" | "state")
- Filter exams client-side: `exam.short_name` or `exam.name` includes search string (case-insensitive)
- Group by Central (`state === "India"`) vs State (`state !== "India"`) → then by `state` within the state group
- Show "Central Teaching Exams" heading (with highlight) + "State Teaching Exams" heading + state sub-heading
- Search input: plain `<input>` or `@clearcut/ui/main-input`; filter chips: `Chip` from `@clearcut/ui/chip`
- Active chip: blue fill (`--color-brand` bg); inactive: outlined
- Entire section hidden if search yields 0 results (show empty state message)

### Step 3 — Blog Home: Hero section
**File:** `apps/blog/src/app/[locale]/(blog)/page.tsx`

- Add `CustomizableHeader` with title "Exams on Clear Cutoff", `highlightText="Clear Cutoff"`, subtitle from i18n
- Remove existing `BlogExamCardsSection` outer container's inline heading (if any) — one h1 per page
- Add i18n keys: `blogHome.title`, `blogHome.highlightText`, `blogHome.subtitle`, `blogHome.searchPlaceholder`, `blogHome.filterAll`, `blogHome.filterCentral`, `blogHome.filterState`, `blogHome.sectionCentral`, `blogHome.sectionState`, `blogHome.viewExam`

### Step 4 — Exam Page: Paper card redesign
**File:** `apps/blog/src/components/blog/sections/exam-levels-section.tsx` (or new `paper-selection.tsx`)

- Replace `ExamSelectionContainer` (generic nav tree) with flat paper card list for root navigation items (`parent_id === null`)
- Paper card: white card, book icon in light-blue `bg-[var(--color-brand-light)]` square (need token check), paper name bold, class range below, subject list in gray, chevron right
- Subject list: **hardcoded per exam** (see decision D3 below) in i18n under `exam.{examSlug}.papers.{paperSlug}.subjects`
- Info strip below cards: light-blue bg, text from i18n `exam.switchPapersInfo`
- On click: same existing behavior (route push to `/{examName}/{paperSlug}`)

### Step 5 — i18n strings
Files: `apps/blog/messages/en.json`, `hi.json`, `mr.json`

Add all new keys under `blogHome` and `examPage` namespaces. Hindi + Marathi translations needed for all keys.

### Step 6 — Verification
- `pnpm typecheck` — target: 33 (blog baseline)
- `pnpm check:colors` — no new hardcoded colors
- Screenshots en + hi at 390px and 1280px for both pages (Sonnet Playwright agent)

---

## Decisions Needed (🛑 stop and ask user before acting)

| # | Question | Options | Impact |
|---|---|---|---|
| **D1** | Search input: client-side filter OR skip search for now? | (a) Client-side JS filter on the fetched list — fast, no new API needed. (b) Skip search (design-only, leave as TODO). | Step 2 scope |
| **D2** | Filter chips: show "Central Exams" / "State Exams" chips OR only "All Exams" for now? | (a) Full 3-chip filter as in design. (b) Chips visible but only "All" works (Central/State grouping already shows). | Step 2 scope |
| **D3** | Paper card subjects: hardcode per exam in i18n OR omit subject list for now? | (a) Hardcode CDP/Math/EVS etc per exam in i18n — team must maintain. (b) Omit subject list (show only paper name + class range). | Step 4 — design fidelity vs maintenance |
| **D4** | Hindi (hi locale) exam page: translate subtitle + paper names (API returns Hindi), or English-only for /hi? | (a) Use API's hi translations for paper name/detail + translated copy in hi.json. (b) English-only for now. | Step 5 scope |
| **D5** | "Start for FREE" button in header: current header has login/register — leave as-is or match design's single CTA? | (a) Leave existing header — it already has the right buttons. (b) Match design — replace with single "Start for FREE" pill. | Header component |

---

## Decision Log

| Date | Decision | By |
|---|---|---|
| 2026-10-27 | Phase file created; decisions D1–D5 need user answers before coding starts | — |
| 2026-10-27 | **D1-a** client-side search filter; **D2-a** all 3 chips functional (All/Central/State); **D3-b** omit subject list on paper cards (name + class range only, no hardcoded syllabus to maintain); **D4-a** use the API's `hi` translations for paper name/detail + Hindi copy in hi.json; **D5-a** leave the existing header as-is (login/register stay) | User |

---

## Verification

- tsc: target ≤ 33 errors (blog baseline)
- check:colors: no new counts above baseline
- Screenshots: blog home en 390+1280, blog home hi 390, exam page en 390+1280, exam page hi 390
- Playwright (Sonnet): visible exam cards, search filter works (D1), paper cards navigate correctly
