# Phase 37 — CC-74: payment page headline matches what the student tried to unlock

**Status:** Planned (2026-10-24). The copy was approved on 2026-10-23; see Phase 33.
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
