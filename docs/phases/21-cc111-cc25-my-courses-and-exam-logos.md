# Phase 21 — CC-111 + CC-25: My Courses page clarity, and the real exam logo on every exam card

**Status:** Not Started (CC-25 is "In Progress" in Jira from earlier work)
**Jira:** [CC-111](https://clear-cutoff.atlassian.net/browse/CC-111), [CC-25](https://clear-cutoff.atlassian.net/browse/CC-25)
**Repos:** CM `apps/dashboard`; BE only if the logo isn't in the API (CC-25 comment: "pass this from backend")
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
| | | | |
