# Phase 24 — CC-79: "start here" guide for first-time students on the preparation page

**Status:** Not Started (the ticket says "after CC-80")
**Jira:** [CC-79](https://clear-cutoff.atlassian.net/browse/CC-79)
**Repos:** CM `apps/dashboard`; BE to store "guide seen" per user + exam
**Size:** large, new UI flow

## What the ticket says
- **Problem:** in 90 days (Amplitude), 3,630 students picked an exam or subject, but only **1,135 (31%)** opened any video, notes or test within a day. New students jump subjects, hit a lock and go to payment.
- **Build:** 3 pointers + a "start here" badge, the first time on the preparation (syllabus/chapter) page. Everything else dims; each step has "आगे" (next) and "छोड़ें" (skip).

| Step | Highlight | Text |
|---|---|---|
| 1 | Subject tabs | "यहाँ अपना विषय चुनें" |
| 2 | First free chapter card | "यह अध्याय फ्री है — इसे खोलें" |
| 3 | "पढ़ाई शुरू करें" inside that chapter | "यहाँ टैप करें: वीडियो देखें, नोट्स पढ़ें, फिर छोटा टेस्ट दें" |

- **Badge:** after the steps, a pulsing "यहाँ से शुरू करें" stays on the first free topic until any content is opened (also when skipped).
- **Rules:**
  - Once per student per exam, saved **on the user**.
  - Once more if they leave without opening content.
  - Only point at free items.
  - Hide the floating Unlock button while it's open.
  - Never on test or video screens.
  - en/hi/mr; Ganesh reviews hi/mr.
- **Tracking:** `guide_shown`, `guide_step_viewed` (1/2/3), `guide_skipped`, `guide_completed`, plus the existing Content Started.
- **Done when:** Exam Added → Content Started goes from 31% towards 50% in 3–4 weeks.

## What the code shows (2026-10-22, first pass)
- **A tour already exists:** `components/features/tour/GlobalTour.tsx` (driver.js), used by `features/preparation/pages/preparationPage.tsx`. Extend or reuse it, don't add a second tour library.
- **Free chapter:** BE marks `chapter_order == 1` as unlocked during the trial (`ChapterResource`). The guide can point at the first chapter with `locked: false`.
- **"Seen" storage:** the enrollment has `study_guide_seen` (boolean, `types/Exam.ts`). Check whether that's this guide's flag or an older study-guide modal; it may already be per user + exam.
- **Floating Unlock:** `components/features/PayWalls/PaywallFloatingWidget.tsx`.

## Plan
- [ ] Read GlobalTour + where it's triggered; check `study_guide_seen` usage and BE endpoint to set it.
- [ ] Steps 1–3 + the pulsing badge on the first unlocked topic; hide the floating widget during the tour; never on test/video routes.
- [ ] Show rules: per user + exam (BE flag), one repeat if no content was opened.
- [ ] Amplitude events (typed in `lib/analytics/events`).
- [ ] en/hi/mr copy; 📞 Ganesh reviews hi/mr.
- [!] 🛑 **D1:** reuse `study_guide_seen` or add a new per-exam flag (needs a BE migration)?
- [!] ⚠️ Depends on CC-80 (the "Start your first free test" button after onboarding) per the ticket. Decide whether to do CC-80 first or ship independently.
- [ ] Verify: Playwright first-visit (shown) / second visit (not shown) / skip / badge until content opened; trial user only points at unlocked items; screenshots en/hi/mr.

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| | | | |
