# Phase 61 — CC-73 + CC-76 (+ CC-74 pointer): payment page plan cards

**Status:** Reported done by the user on 2026-10-28; **no commit for CC-73 or CC-76 was found** in CM, backend, ASTRO or RN (git log across all branches, branch names, docs). Treat as "needs a code check during testing". CC-74 is merged (see below).
**Jira:** [CC-73](https://clear-cutoff.atlassian.net/browse/CC-73), [CC-76](https://clear-cutoff.atlassian.net/browse/CC-76), [CC-74](https://clear-cutoff.atlassian.net/browse/CC-74) — parent CC-57
**Repos:** CM `apps/dashboard` (`payment/initiated/page.tsx`, `features/payment/PlanCard.tsx`)
**Size:** small–medium

## CC-74 (already built)
Headline follows `source=`. Commit `b4d04c9`, plans in [phase 33](33-cc63-cc74-payment-page-exit-and-headline.md) and [phase 37](37-cc74-payment-headline-by-source.md).

## CC-73 — autopay and one-time side by side, equal weight
What the ticket asks:
- Two equal cards: "₹99/month – autopay" and "₹139 – one month, no autopay", same size and weight, in en/hi/mr. Autopay stays pre-selected.
- Comment from Rohit (later addition): when Razorpay returns `recurring_payment_not_enabled`, or an autopay attempt is cancelled, offer the one-time plan right there.
- Ship before (or identically in both groups of) the CC-62 strike-through A/B test.

Related recent commit: `8819bdf` — payment page mobile pass; one-time 1-month is now first and the default plan. Whether that fully covers CC-73 (and the two comment additions) is not documented anywhere — check during testing.

## CC-76 — plan price ladder (6-month ₹499 vs 12-month ₹599)
- Label on the ticket: **needs-RD-decision**. Step 1 is Rohit's choice (Option A: drop the 6-month plan; Option B: space prices e.g. ₹399/₹599 and show "₹X/month").
- Step 2 (build): update plan cards in en/hi/mr, show the per-month price and the saving, update the Razorpay plans/prices to match.
- Keep separate from the CC-62 test.

## Test checklist (for Ganesh)
- [ ] en, hi, mr: both monthly options equal in size/weight; autopay pre-selected.
- [ ] Long plans show per-month price and saving; "Most Popular" badge is only on a plan where it is true.
- [ ] Razorpay plan ids/prices match the cards (checkout opens with the same amount).
- [ ] `recurring_payment_not_enabled` and cancelled-autopay show the one-time offer.
- [ ] Amplitude: plan choice and `source` still on Payment Initiated / Payment Outcome (reuse existing events, no new ones).
