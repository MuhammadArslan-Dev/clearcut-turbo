# Phase 23 — CC-66 + CC-64: Hindi/Marathi payment page, and a "payment failed" page that recovers the sale

**Status:** Not Started
**Jira:** [CC-66](https://clear-cutoff.atlassian.net/browse/CC-66), [CC-64](https://clear-cutoff.atlassian.net/browse/CC-64)
**Repos:** CM `apps/dashboard`; BE for the payment status check and failure-reason logging
**Size:** medium (CC-66 small review; CC-64 a new page design)

## What the tickets say
**CC-66: conversion by language (6 months)**
| Page | Sessions | Paid |
|---|---|---|
| /payment/initiated (en) | 4,005 | 6.8% |
| /hi/payment/initiated | 1,502 | **3.8%** |
| /mr/payment/initiated | 101 | **2%** |

Check at **360px**:
- Cut-off or badly wrapped text (pay button, plan cards, badges).
- Anything still in English.
- Layout and font size the same as English.
- Shorter Hindi pay button, e.g. "₹99 में अनलॉक करें".
- The same trust elements: secure payment line, UPI logos, "कभी भी कैंसल करें" for autopay.

Before/after screenshots go to RD for copy approval.

**CC-64: /payment/failed. 54 sessions in 6 months; these are the warmest leads.**
- Check the real status first, then say: "पेमेंट पूरा नहीं हुआ। आपके पैसे नहीं कटे हैं / कटे हैं तो 5–7 दिन में वापस आएँगे".
- Big "फिर से कोशिश करें" button that reopens checkout with the same plan.
- "दूसरा UPI ऐप / QR से पे करें": Razorpay with the UPI QR / UPI-ID method preselected.
- If autopay failed: fall back to one-time ("ऑटोपे के बिना एक बार पे करें").
- WhatsApp help with a prefilled "Payment failed – {exam} – {phone}".
- Log the Razorpay failure reason (`error.code`, `error.reason`).

## What the code shows (2026-10-22, first pass)
- **Payment page:** `app/[locale]/(protected)/(payment)/payment/initiated/page.tsx`. Copy comes from `modals.unlockFullAccessModal.*` and `payment.checkout.*`.
- **Since CC-60:**
  - Errors show under the button.
  - The "UPI / Card / Net banking" line opens the checkout.
  - A paid order whose webhook is late never lands on the failed page.
  - Since CC-61 the page loads once and doesn't jump.
- **Failed page:** `app/[locale]/(protected)/(payment)/payment/failed/page.tsx`. Its params are `exam_id`, `course_name`; it doesn't know the plan or the transaction yet.
- **Failure reasons:** `getPaymentFailureReason` already feeds the "Payment Outcome" event; Sentry logs non-customer failures. The ticket wants them countable, so check Amplitude or add a BE log.
- **WhatsApp number:** the landing/auth flows use `917404758398` (login). Confirm the support number with RD (CC-97 mentions Ganesh's support number).

## Plan
- [ ] CC-66: Playwright screenshots at 360px of en/hi/mr (all 3 plans, button, badges, trust row); list every cut-off or English string; fix; shorter hi/mr button copy; same trust row in all three. Before/after for RD.
- [ ] CC-64: pass `plan`, `transaction_id`/`subscription_id` and the failure reason to the failed page; fetch the real status (verify endpoint) before choosing the "not deducted / refunded in 5–7 days" line.
- [ ] Retry (same plan), alternate method (Razorpay `config.display` / method preselect), autopay → one-time fallback, WhatsApp help.
- [ ] Log the failure reason (Amplitude property + BE log).
- [!] 🛑 **D1:** the failed page's layout is new UI. Approve a mockup/screenshot first.
- [!] 🛑 **D2:** WhatsApp support number for payments.
- [ ] 📞 **C1:** RD approves the hi/mr copy (ticket requirement).
- [ ] Verify: Playwright with the fake-Razorpay harness from CC-60 (failure → failed page → retry / fallback); 360px screenshots; tsc, eslint, check:colors.

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| | | | |
