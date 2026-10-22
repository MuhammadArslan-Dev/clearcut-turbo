# Phase 21 — CC-111 + CC-25: My Courses page clarity, and the real exam logo on every exam card

**Status:** Built + verified locally (2026-10-22) — not merged; tools deploy waits for approval
**Jira:** [CC-111](https://clear-cutoff.atlassian.net/browse/CC-111), [CC-25](https://clear-cutoff.atlassian.net/browse/CC-25)
**Repos:** CM `apps/dashboard` + `apps/tools` (branch `phase-21-my-courses`: badf54f). No BE change needed.
**Size:** medium

## What the tickets say
**CC-111: My Courses (/dashboard/my-courses), 90 days**
| What | Number |
|---|---|
| Sessions | 775 |
| Quick backs | 368 (**47%**) |
| Dead taps "Start 3-day FREE Trial" | 142 taps / 58 sessions |
| Dead taps "Start Learning" | 200 / 42 |
| Dead taps "Mode: Offline" / "Offline" badge | 213 / 9 |
| Dead taps "Continue to Subjects" | 81 / 36 |
| Dead taps "Trial ended" card | ~230 / ~4 |

Asks:
- **"Offline" badge** → plain text "परीक्षा: ऑफलाइन (पेन-पेपर)". Today it looks like the app is offline, or like a toggle.
- **"Start 3-day FREE Trial":** don't ask for the paper again if it was already picked.
- **"Trial ended" card:** the whole card taps through to payment with `source=trial_ended`.
- **One clear button per course card:** "पढ़ाई जारी रखें", going to the last topic.
- **Done when:** quick backs drop below 25%.

**CC-25: exam logos**
- All exam cards show one generic icon. Each card should show its own exam logo (HTET, CTET, …), same size and position, at every screen size.
- There's a reference image in Jira.
- Comment: "pass this from backend".

## What the code shows (2026-10-22, first pass)
- **My Courses cards:** `components/features/dashboard/mycourse/MyCoursesWrapTwo.tsx` + `MyCourseCard.tsx`. `MyCourseCard` is **"do not restyle" (client-approved)** per DEVELOPMENT_RULES, so only behaviour and text change there.
- **Course listing cards:** `components/features/dashboard/courses/CourseCard.tsx` + `CoursesList.tsx`. These show `study_mode` (likely the "Offline" badge) and already reference `logo`.
- **Logos:** `exam.logo_url` already exists on enrollments (used by MyCourseCard and MyCoursesList), so CC-25 may be frontend-only. Check which card still shows the generic icon.

## What was found (2026-10-22)
- **CC-25 is a tools ticket, not dashboard.** The Jira reference image is the resizer category page (Teaching Exams: HTET, CTET, REET …) showing a generic document icon on every card.
- The backend part ("pass this from backend") is done: the tools API returns `exam.icon` for 55 of 118 exams, all teaching exams included. `ExamCard` already renders it.
- **Real cause: the tools build reused a stale fetch cache.** `.next/cache/fetch-cache` held API responses from 2026-10-03/05, so every production build since then (including the one deployed earlier today) used that old data. That means no icons, and the 4 exams added since (CSIR, CSIR-NET, JKSET, UGC-NET) and the "other" category never shipped.
  - Before/after on 118 exam pages: **no photo/signature dimension changed**, no page disappears, `seo:check` passes (658 pages).
  - The 4 new exams land in an "Other" category because the backend has no category for them (data to fix in the tools sheet).
- **CC-111 (`/dashboard/my-courses` = add-an-exam list; the Learn page holds enrolled courses):**
  - "Mode: Offline" showed the backend's raw English string on every locale, next to an ⓘ icon. The `examMode` translations existed but were unused.
  - "Continue to Subjects" / "Start Learning" were tapped while disabled (no paper/subject picked): a disabled `<button>` swallows the tap, so nothing happened.
  - Single-paper exams (HPTET, UP PGT, UP TGT locally) still asked the student to pick the only paper.
  - The "Trial Ended" pill on the Learn card was plain text.
  - "One clear button": left as is. `MyCourseCard` is "do not restyle", and Continue already resumes the last place (`/preparation` resume state).

## What was built
- **tools:** `pnpm build` runs `scripts/clear-fetch-cache.mjs` first, so every build reads the live API. The category page now shows each exam's own logo (36×36, same place, mobile + desktop).
- **dashboard `CourseCard`:** mode label is "Offline (pen & paper)" / "Online (computer-based)", hi "ऑफ़लाइन (पेन-पेपर)" / "ऑनलाइन (कंप्यूटर पर)", mr too.
- **`BuySigleCourseModal`:**
  - A transparent layer over the disabled footer button shows "Select any one option" (existing string, en/hi/mr). It clears on pick, back or next.
  - A single-paper exam is pre-selected.
- **`MyCourseCard`:** `statusClick` makes the status pill a button (same look, 44px tap area). `MyCoursesWrapTwo` passes it for `trial_end` enrollments with a subject → `/payment/initiated?...&source=trial_ended` + `Purchase Intent Initiated {entry_point: trial_ended_badge}`. The Buy button keeps `my_courses_card_clicked`.

## Verification
- [x] Playwright 390px, local backend:
  - UPTET: tap on the disabled button shows the hint; picking Paper 1 clears it and enables the button.
  - UP PGT opens with "Continue to Subjects" enabled.
  - en + hi mode labels.
  - Trial Ended pill is 97×44 and opens payment with `source=trial_ended`.
- [x] tools: fresh build has 10 exam-logo URLs on the Teaching Exams page. Served locally: 7/7 logos load at 36×36 (mobile + desktop), matching the Jira reference.
- [x] tsc: no new errors (MyCourseCard.tsx(86) pre-existing). eslint: no new errors. check:colors passes.
- [ ] Not done: hi/mr still show some backend metadata in English ("Upcoming", "Eligiblity Exam", "2 h 30 min"). Pre-existing, data-side.
- [ ] Tools deploy needs approval (it also ships the 4 new exams + Other category).

## Plan
- [ ] Find which screen the "Offline" badge, "Start 3-day FREE Trial", "Start Learning" and "Continue to Subjects" taps come from (Playwright, logged-in test user).
- [ ] Offline badge → plain text label (en/hi/mr).
- [ ] Trial start: skip the paper picker when a paper is already chosen.
- [ ] Trial-ended card → payment with `source=trial_ended`.
- [ ] Continue button → last topic (check the API has last-accessed topic; `last_accessed_at` is on the enrollment, the topic may not be).
- [ ] CC-25: render `exam.logo_url` on every exam card (fallback to the current icon when missing); same box size everywhere.
- [!] 🛑 **D1:** MyCourseCard is "do not restyle". Is the "one clear button" change allowed on it, or only on the listing card?
- [!] 🛑 **D2:** what is the reference image's logo size/shape (circle, square, size)? Read the Jira attachment before building.
- [ ] Verify: Playwright at 390px + desktop, en/hi/mr; screenshots; tsc, eslint, check:colors.

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| 2026-10-22 | D1 one-button card | Not changed (MyCourseCard do-not-restyle; Continue already resumes) | Claude, report to user |
| 2026-10-22 | D2 logo reference | Jira image = tools category page; fixed via fresh build | Claude (from Jira attachment) |
