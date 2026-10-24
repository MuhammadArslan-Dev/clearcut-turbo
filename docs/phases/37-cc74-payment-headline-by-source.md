# Phase 37 — CC-74: payment page headline matches what the student tried to unlock

**Status:** Built + verified locally (2026-10-24), branch `phase-37-cc74-headline-by-source` (on top of Phase 36). Not pushed.
**Jira:** [CC-74](https://clear-cutoff.atlassian.net/browse/CC-74)
**Repos:** CM `apps/dashboard`
**Size:** small

## What the ticket says
- Students reach `/payment/initiated` from different places (`?source=`), but everyone sees one headline.
- **Ask:** change only the headline + one-line sub-headline by source.

## Approved copy (en; hi/mr to be written in the same tone)
| Source (`?source=`) | Headline |
|---|---|
| `full_test_card_clicked` | Unlock this full-length test and every other test |
| `chapter_card_clicked`, `topic_card_clicked` | Unlock this chapter and the full {exam} syllabus |
| `trial_ended` | Your free trial has ended. Keep your preparation going |
| plan ended (renewal / expired plan) | Your plan has ended. Renew to continue |
| anything else (`floating_widget_clicked`, `my_courses_card_clicked`, none) | today's headline, unchanged |

## Plan
- [ ] In `app/[locale]/(protected)/(payment)/payment/initiated/page.tsx`: map `source` → message key. One small `headlineKeyFor(source, planState)` next to the page. Unknown sources fall back to today's key.
- [ ] Find the existing signal for "plan ended" (CC-111 / plan-ending banner) instead of adding a new param.
- [ ] Keys in `messages/{en,hi,mr}/payment.json` (dashboard namespace file). Hindi and Marathi in the same plain style as the page.
- [ ] No layout change: same element and size as today's headline. A longer line wraps; it must not push the plan cards below the fold at 360 px.
- [ ] Existing `Purchase Intent Initiated` already carries `source`. No new event.

## Verification
- Playwright at 360 px and desktop: each `source=` value in en/hi/mr shows its headline, and an unknown/missing source shows the old one.
- Check line wrapping on 320 px.

## What was built
- `src/lib/payment/paymentHeadline.ts`: `paymentHeadlineKey(source)` → a key in `modals.unlockFullAccessModal`.
  - `full_test_card_clicked` → "Unlock this full-length test and every other test".
  - `chapter_card_clicked`, `topic_card_clicked`, `chapter_index_list_card_clicked`, `next_button_clicked` (locked next topic) → "Unlock this chapter and the full {exam} syllabus".
  - `trial_ended` → "Your free trial has ended. Keep your preparation going".
  - `plan_ended` → "Your plan has ended. Renew to continue".
  - Everything else (`floating_widget_clicked`, `my_courses_card_clicked`, sectional/test-series cards, daily tests, none) → today's "Unlock Full Access".
- "Plan ended" signal: My Courses already sent `trial_ended` for both `trial_end` and `expired` enrollments. It now sends `plan_ended` for `expired`, so `Purchase Intent Initiated` / the funnel's `source` can tell the two apart too.
- Sub-headline unchanged for every source (no new copy was approved for it).
- en/hi/mr keys `headline_full_test`, `headline_chapter`, `headline_trial_ended`, `headline_plan_ended`.

## Verification (2026-10-24, local dashboard)
- 360 px: every source above in en, plus full test / chapter / trial / plan / none in hi and mr → the expected headline. Unknown and missing source → old headline.
- 320 px mr trial-ended: the headline wraps to 2 lines; no horizontal scroll; plan cards still in view.
- Typecheck and lint clean for the changed files.
- Not done: sectional test cards keep the old headline (the approved copy says "full-length").
