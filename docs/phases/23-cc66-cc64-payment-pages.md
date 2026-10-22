# Phase 23 — CC-66 + CC-64: Hindi/Marathi payment page, and a "payment failed" page that recovers the sale

**Status:** Built + verified locally (2026-10-22) — branch `phase-23-payment-pages` (e4c7658), not merged, not deployed
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

## What was found (2026-10-22, 360px, local)
- **CC-66:**
  - On the 12-month plan card the long Hindi chip "अगली एग्ज़ाम के लिए बेस्ट वैल्यू और फुल कवरेज" squashed the radio into a thin oval (the radio had no `shrink-0`; same in MainPaywall/PreparationPaywall).
  - The Hindi CTA "₹149 के लिए फुल एक्सेस अनलॉक करें" fit on one line but read long.
  - No "cancel anytime" anywhere for the autopay plan.
  - Marathi level names show in English ("Level 1 (PRT)…"): the backend level translations have no `mr`. This is data, not fixed.
  - Nothing else cut off or left in English (the dev Agentation toolbar's English is dev-only).
- **CC-64:**
  - The failed page didn't know which plan failed ("Complete payment" went to the default plan via the paywall).
  - It said "No money was deducted" (not always true).
  - The price row rendered **"NaN"** (`Number(exam.price)` on a JSON string).
  - A `<p>` wrapping `<div>`s threw a hydration error.
  - "Need help" opened `ContactUsModal`, whose **default numbers were a placeholder `+919999999999`**. Every dashboard "Call us / WhatsApp" (Profile, Learn page, exam, daily test, failed page) dialled a fake number.

## What was built
- **Support:** `lib/support.ts` holds `SUPPORT_PHONE` "+917210708599" (landing contact page / JSON-LD) and `SUPPORT_WHATSAPP` "917404758398" (landing StartAuthForm / shared login screen). `ContactUsModal` defaults use them.
- **CC-66:**
  - Radios get `shrink-0` (payment page + both paywalls).
  - New `unlockFullAccessModal.ctaPrice`: en unchanged, hi "{price} में अनलॉक करें", mr "{price} मध्ये अनलॉक करा". Used by the three price buttons; the shared `cta` stays because full-course-payment-modal passes an exam name into it.
  - `cancelAnytime` ("ऑटोपे कभी भी कैंसल करें") under the trust row, only on the autopay plan.
- **CC-64:**
  - `/payment/initiated` sends `plan` + `price` to the failed page.
  - A `?plan=` (1month | 1month-onetime | 1year) preselects that plan, read once for the initial state (no URL sync, CC-61 stays).
  - Failed page: "Try again" reopens the same plan. Autopay failures add "Pay once, without autopay" (→ 1month-onetime). "Get help on WhatsApp" opens wa.me with "Payment failed – {exam} – {phone}" and fires `Support Contacted {source, channel}`.
  - The description says money, if deducted, returns in 5–7 working days. The price shows "₹149 (incl. GST)" or hides when unknown. The hydration error is fixed.
  - Old links without `plan` still work (paywall route, "Complete Payment to Continue").

## Verification
- [x] 360px en/hi/mr payment page:
  - Radios 16×16.
  - CTA "Unlock Full Access for ₹149" / "₹149 में अनलॉक करें" / "₹149 मध्ये अनलॉक करा", one line.
  - Cancel line shows on autopay and hides on one-time.
- [x] Failed page:
  - `plan=1year` → Try again opens initiated with ₹799 selected.
  - `plan=1month` → Pay once opens ₹229.
  - Pay once is hidden for the yearly plan.
  - WhatsApp opens `wa.me/917404758398?text=Payment failed – HTET Exam – +919988776655` (blocked in test).
  - No NaN; no hydration error.
- [x] End-to-end with stubbed `/v2/payment/create` + a fake Razorpay that fires `payment.failed`:
  - `?plan=1month-onetime` → CTA ₹229 → order type `1month-onetime`.
  - Lands on `/payment/failed?...&plan=1month-onetime&price=229` with Try again + WhatsApp (no Pay once).
- [x] tsc: no new errors (3 pre-existing in initiated/failed-modals). eslint: 8 before = 8 after. check:colors passes.
- [ ] Not built (needs Razorpay checkout config work + a real-device test): "pay with another UPI app / QR" preselect.
- [ ] 📞 RD approves the hi/mr copy (CTA, refund line, buttons). 📞 Confirm 917404758398 is the support WhatsApp (it's the number the login help uses).

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
| 2026-10-22 | D1 failed page layout | Same layout and components; only the actions/copy changed | Claude; user asked to continue without stopping |
| 2026-10-22 | D2 WhatsApp number | 917404758398 (the number login help already uses) — confirm | Claude, flagged |
