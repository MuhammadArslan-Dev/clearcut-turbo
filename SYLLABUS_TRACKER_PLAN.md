# Syllabus Tracker — `apps/tools`

## Context

New tool inside `apps/tools` (clearcutoff.in/tools) called **Syllabus Tracker**: student picks exam → level → subjects, then checks off chapters as they study them. All tracking state lives in the browser (`localStorage`) — nothing gets written to the database, ever. Same "browser-only, no-backend" spirit as the existing resizer/age-calculator tools, with one deliberate exception: the *syllabus itself* (which exams/levels/subjects/chapters exist) comes from a new read-only API, because `apps/tools` has no dataset of its own for that.

Two things grounded this plan:

1. **Live-tested reference**: [mymarga.in/app](https://mymarga.in/app), a chapter tracker for JEE/NEET/CBSE/ISC/ICSE/KCET/MHT-CET. Walked the full flow (Choose Exam → Select Chapters → tracker dashboard) and read its `localStorage` directly via the JS console to reverse-engineer its schema.
2. **This repo's own onboarding flow** (`apps/dashboard/src/components/features/onboarding/steps/ExamStep.tsx` + `LevelStep.tsx`) — the "already working" exam→level UX the user pointed to — same card-grid pattern, same "select exam, then pick a level" shape.

## What I found

### Marga's localStorage shape (`https://mymarga.in/app`)
Keys are versioned and namespaced per anon-device (`marga<Thing>_v1_<hash>`). The parts that matter:

```
margaTabs_v1_<hash>        → ["cbse10", "jee"]                 // which exams are loaded, in tab order
margaLastActiveExam_v1_<hash> → "jee"                          // which tab is open
margaCardOrder_v1_<hash>   → { jee: ["Physics", "Chemistry: Physical", ...] }   // subject card order, per exam
margaSelections_v1_<hash>  → { jee: { Physics: ["Kinematics (1D)", ...] } }     // which chapters the user opted IN to track (from the picker step)
margaTracker_v1_<hash>     → {
  _loadedExams: ["cbse10", "jee"],
  _currentMode: "jee",
  _customMetas: {},          // user-renamed/added custom chapters, if any
  _deletedExams: {},
  jee: {
    Physics: [
      { name: "Units, Dimensions & Measurement", id: 53, completed: true, revised: "", prep: "none" },
      ...
    ],
    "Chemistry: Physical": [...],
  },
  cbse10: { ... }
}
```

Flow: **Choose Exam** (grouped by board: CBSE/ISC/ICSE, plus a flat "Competitive Exams" group for JEE/NEET/KCET/MHT-CET) → **Select Chapters** (full syllabus pre-checked, per-subject, with Select All/Deselect All + search — the "customize what you're tracking" step) → **Load Exam** → main dashboard: one card per subject, one row per chapter (checkbox + strike-through + a `Rev:` revision-date field), a subject-level `N/M` counter, an exam-level overall `% mastered` bar, and Reset/Export/Import/+Sub-Exam controls per exam. Multiple exams can be tracked in parallel via a left sidebar of exam icons.

### This repo's existing patterns reused here

- **`apps/dashboard/…/onboarding/steps/ExamStep.tsx`**: card grid of exams, `useExams()` (SWR) hook hitting `GET {LARAVEL_BACKEND}/blog/exam?status=active` — this Blog route group (`routes/Apis/Blog/api.php`, required at the top level of `routes/api.php`, **no auth middleware**) is already public.
- **`apps/dashboard/…/onboarding/steps/LevelStep.tsx`**: card grid of levels for a chosen exam (`useLevels(examId)` → `GET /v1/exam/all-levels/{id}`), with a synthetic "Full Exam" option alongside real levels (`parent_id === null` = a level). **That specific endpoint is auth-gated** (`Apis/V1/dataapi.php`, inside `Route::middleware(['auth:sanctum'])`) — not callable from the unauthenticated `apps/tools`, hence new public endpoints below.
- **`apps/tools/src/lib/recentExams.ts`**: the established safe localStorage pattern in *this exact app* — `typeof window === "undefined"` guard, try/catch around parse/stringify, silent fallback (private browsing / quota / corruption never throws). The tracker's storage layer follows this, not Marga's.
- **`apps/tools/src/lib/resizerExams.ts`**: this app already fetches exam data from an external API at *build time* (`clearcut-tools-backend`, a separate small backend for tools-specific data like resizer specs). The Syllabus Tracker is different: it needs the syllabus tree fetched at **runtime** (interactive picker), so it talks to a different source — the main Laravel backend.
- Checked whether the public Blog API (`get-enavigation`, `get-sections`, `get-subject`) could be reused directly — it can't cleanly: `BlogExamRepository::getSubject()` is hardcoded around CTET-specific paper-language quirks ("the only exam this route serves today," per its own comment) and shaped for PYQ/question browsing, not a general chapter checklist. Confirms new, purpose-built, public, read-only endpoints are the right call.
- The underlying data already exists and is clean: `Exam`, `ENavigation` (level hierarchy, parent_id tree — same shape `LevelStep.tsx` already renders), `ESection` (subject), `SChapter` (chapter), `MappingNavigationSection` / `MappingSectionChapter` (join tables). New endpoints query these same models directly, sidestepping the CTET-specific hacks in the Blog repository.

## Decisions

- **Chapter-level tracking, not topic-level.** `SChapter` is one row per Marga-style checkbox; `STopic` (finer-grained, inside a chapter) is not surfaced in v1. Matches Marga exactly, keeps the picker/tracker UI simple.
- **One active exam+level at a time in v1** (not Marga's multi-exam sidebar tabs). Matches the user's own description of the flow (exam → level → subjects → track). The localStorage schema below is written so multi-exam support is an additive v2 change, not a rewrite.
- **Public, unauthenticated, read-only, heavily cached endpoints** — no `auth:sanctum`, matching `blog/exam`'s existing precedent, since `apps/tools` has no login.

## Data flow

```
Laravel (new, public, read-only)          apps/tools (client)
──────────────────────────────           ─────────────────────
GET /tools/syllabus/exams          →      Step 1: pick exam
GET /tools/syllabus/levels/{examId}→      Step 2: pick level (skippable if none)
GET /tools/syllabus/syllabus/{examId}/{levelId} →  Step 3: pick subjects + customize
                                            chapters (Select All / Deselect All, per Marga)
                                     →      Step 4: tracker dashboard
                                            (all state below lives ONLY in localStorage)
```

### New backend endpoints (`clearcutoff-main-backend`)

New route file `routes/Apis/Tools/syllabus.php` (required at top level of `routes/api.php`, same as `Apis/Blog/api.php` — no middleware group), prefix `tools/syllabus`:

- `GET /tools/syllabus/exams` — id, short_name, name, state, exam_type (same shape `ExamStep.tsx` already consumes from `blog/exam`).
- `GET /tools/syllabus/levels/{examId}` — flat list from `ENavigation` where `exam_id_b` matches, `{ id, name, parent_id, group }`, same shape `LevelStep.tsx` already renders. The synthetic "Full Exam" entry is added client-side exactly like `LevelStep.tsx` does — not baked into the API.
- `GET /tools/syllabus/syllabus/{examId}/{levelId}` — `{ subject_name: [{ id, name, chapter_order }] }` sourced from `ESection` → `MappingSectionChapter` → `SChapter`, `Cache::remember(..., 3600)` (mirrors `BlogExamRepository::getSection`'s existing caching pattern, without the CTET-specific branching).

New Laravel controller `App\Http\Controllers\API\Tools\SyllabusController` with `exams()`, `levels()`, `syllabus()` — thin, reuses existing Eloquent models, no new migrations.

### `apps/tools` localStorage schema (`cc-syllabus-tracker-v1`)

One versioned key, following `recentExams.ts`'s safe-access pattern:

```ts
interface SyllabusTrackerState {
  version: 1;
  exam: { id: number; shortName: string; name: string } | null;
  level: { id: number | "full-exam"; name: string } | null;
  subjects: {
    [subjectName: string]: Array<{
      id: number;
      name: string;
      completed: boolean;
      revisedAt: string | null; // ISO date, mirrors Marga's `Rev:` field
    }>;
  };
}
```

`apps/tools/src/lib/syllabusTracker.ts` exports `getTrackerState()` / `saveTrackerState()` / `resetTrackerState()`, `typeof window` guard + try/catch, same shape as `recentExams.ts`.

## Frontend structure (`apps/tools`)

- `src/app/syllabus-tracker/page.tsx` — the tool page (flat route, no locale prefix — matches this app's existing no-i18n convention).
- `src/components/syllabus-tracker/`
  - `ExamPickerStep.tsx` — card grid, mirrors `ExamStep.tsx`'s layout (not its auth/enrollment logic).
  - `LevelPickerStep.tsx` — card grid + "Full Exam" synthetic option, mirrors `LevelStep.tsx`'s layout.
  - `ChapterPickerStep.tsx` — per-subject chapter checklist with Select All/Deselect All + search, matching Marga's "Select Chapters" step.
  - `TrackerDashboard.tsx` — the main view: subject cards, chapter rows (checkbox + strikethrough + revision-date input), per-subject and overall progress, Reset/Export/Import.
  - `useSyllabusTracker.ts` — the hook wrapping `syllabusTracker.ts`, exposing `toggleChapter`, `setRevisedDate`, `resetAll`, `exportJson`, `importJson`.
- `src/lib/api/syllabusApi.ts` — three fetch functions hitting the new endpoints (plain client-side `fetch`, no SWR/React Query — keeps this tool dependency-light like the rest of `apps/tools`).
- `src/lib/syllabusTracker.ts` — the localStorage layer described above.
- Add a "Syllabus Tracker" entry to `apps/tools`'s hub/`MoreTools.tsx`-style tool list so it's discoverable from the existing tools hub.

## Verification

1. `pnpm --filter tools dev`, open `/syllabus-tracker`, walk exam → level → subject-customize → dashboard.
2. Check a few chapters, set a revision date, reload the page — confirm state survives (localStorage), confirm nothing hits the network except the three read-only GETs.
3. `pnpm --filter tools exec tsc --noEmit` and `pnpm --filter tools lint`.
4. Backend: `php artisan route:list --path=tools/syllabus` to confirm no auth middleware attached; hit the three endpoints directly (curl/Postman) unauthenticated to confirm 200s.
5. Confirm `pnpm --filter tools build` (static export) still succeeds — the new page is client-rendered (`"use client"`), so it exports as an empty shell + client fetch, same as this app's existing interactive pages.
