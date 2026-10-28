# Phase 62 — CC-136 + CC-137: campaign, exam and transaction id on every payment

**Status:** Reported done by the user on 2026-10-28; **no code for these was found on this machine** (backend working tree has only the user_states/practice-test changes; no `first_touch`/`last_touch_campaign` column or migration anywhere in the backend; no `transaction_id` on the dashboard's payment analytics). Needs verification against the acceptance criteria below before being trusted.
**Jira:** [CC-136](https://clear-cutoff.atlassian.net/browse/CC-136) (database), [CC-137](https://clear-cutoff.atlassian.net/browse/CC-137) (Amplitude) — companions; related CC-130/131/132, CC-98
**Repos:** BE (migration, models, payment/webhook code, backfill command), CM `apps/dashboard` (`lib/analytics` payment events)
**Size:** medium

## CC-136 — database
- Capture first-touch (written once at signup) and last-touch (updated on each UTM visit) `utm_source`, `utm_campaign`, `utm_content`, `utm_id`, `captured_at` — new columns or a small `user_attribution` table, not `users.metadata`.
- Copy onto every successful transaction: `exam_id`, `first_touch_campaign_id`, `last_touch_campaign_id`, `ad_id`, `is_first_payment`; renewals copy from the first payment.
- One-time purchases must set `paid_at` (gateway capture time, not webhook time).
- Backfill last 90 days: `exam_id` via group_code → enrollment; `paid_at` from gateway timestamp in metadata; campaign ids only where stored UTMs exist.

## CC-137 — Amplitude
- On Payment Initiated and Payment Outcome (success and failure) send `exam_name` (always), `exam_id`, `transaction_id` (= `transactions.uuid`, same on both events), `is_first_payment`, `utm_campaign`, `utm_content`, `first_touch_campaign`.
- Find and fix every flow that leaves `exam_name` empty (19 of 83 successful payments in the last 30 days) and note the flows on the ticket.
- Keep all existing properties unchanged. Reuse the existing events — no new event names (see DEVELOPMENT_RULES analytics rule).
- Out of scope: renewals (CC-98), Meta Pixel/CAPI, the empty `Payment Completed` event (only report whether anything uses it).

## Acceptance (from the tickets) — test with these
- [ ] Last 7 days of successful transactions: 100% have `paid_at` and `exam_id`.
- [ ] Ad users (UTMs present): ≥95% of payments carry first- and last-touch campaign id.
- [ ] Last 7 days of successful `Payment Outcome`: 100% carry `exam_name`, `exam_id`, `transaction_id`; ≥95% from ad users carry `utm_campaign`.
- [ ] Every `transaction_id` seen in Amplitude exists in `transactions`.
- [ ] Amplitude vs database successful checkout payments for the same 7 days within 5%.
- [ ] One SQL query grouping successful payments by exam × first-touch campaign (30 days) is shared on CC-136.
- [ ] Spot check 10 random payments against Amplitude.
- [ ] Go-live date shared with the team.
