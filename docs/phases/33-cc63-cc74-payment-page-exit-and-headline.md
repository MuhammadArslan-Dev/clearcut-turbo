# Phase 33 — CC-63 + CC-74: an instant "Continue free" with a reason, and a headline that matches what the student tried to unlock

**Status:** CC-63 done (2026-10-23, branch `phase-33-continue-free-sheet`, not pushed yet). CC-74 headlines still wait for RD copy.
**Jira:** [CC-63](https://clear-cutoff.atlassian.net/browse/CC-63), [CC-74](https://clear-cutoff.atlassian.net/browse/CC-74)
**Repos:** CM `apps/dashboard` (payment page); BE to store the "why not buying" answers (or Amplitude only)
**Size:** medium

## What the tickets say
**CC-63:**
- "Continue free learning" is the most tapped thing on the payment page: 1,270 exits, 180 rage-tap sessions, 1,883 dead clicks.
- **Ask:**
  - Navigate on tap without waiting for any API or tracking (`sendBeacon`).
  - Make it a smaller text link under the pay button.
  - One optional bottom-sheet question:
    - महँगा
    - और देखना है
    - बाद में
    - पेमेंट में दिक्कत
    - Skip
  - Save it against user/exam/plan for RD.
  - "पेमेंट में दिक्कत" → WhatsApp help right away.

**CC-74:**
- Students reach the payment page from 5 sources (`floating_widget_clicked`, `my_courses_card_clicked`, `chapter_card_clicked`, `topic_card_clicked`, `full_test_card_clicked`; CC-111 added `trial_ended`), but everyone sees the same headline.
- **Ask:** change only the headline + one-line sub-headline by source, e.g.:
  - full test: "यह फुल-लेंथ टेस्ट + {N} और टेस्ट ₹99 में अनलॉक करें"
  - chapter/topic: "'{chapter}' और पूरा {exam} सिलेबस अनलॉक करें"
- RD can tweak the copy.

## What the code shows (2026-10-23, first pass)
- **Payment page:** `app/[locale]/(protected)/(payment)/payment/initiated/page.tsx`.
- **"Continue free learning"** is the bottom `Button` (`router.back()`; check what it awaits).
- **Header:** `modalT("title")`-style header + subtitle at the top. `source` is already read.
- **Since CC-61:** the page doesn't re-navigate. The CC-66 short CTA and `ctaPrice` are in place.
- **WhatsApp:** `lib/support.ts` (Phase 23).
- **Answer storage:** no table yet. Amplitude `continue_free_reason` is the simplest v1 (same choice as CC-97).

## What was found and built (2026-10-23)
- **"Continue free learning" and the back arrow** call `router.back()` (no API or tracking wait; the funnel event added in Phase 29 is fire-and-forget).
  - But a payment page opened straight from a link (WhatsApp reminder, ad, push, a shared URL) has nothing to go back to: `history.length` is 1. The tap did nothing, a likely source of the rage taps.
- **Built:** `leavePaymentPage()` goes back as before; if the page is still there 400 ms later, it opens `/preparation/<course>`. No visual change.
- **Verified locally:**
  - With history 1 → `/preparation/6a92b987a139f`.
  - Coming from the dashboard → back to `/dashboard` as before.
  - eslint equal to main.
- **Not built (needs a decision):** text-link restyle (D1), the reason bottom sheet + storage (D2), source headlines (C1, RD copy).

## CC-63 decisions built (2026-10-23)
- **D1 (user):** "Continue free learning" is a small underlined text link under the pay button (was a full-width grey button). The unused `Button` import is gone.
- **D2 (user): Amplitude only.** Tapping the link opens "Why not now?" in the app's standard sheet (`features/Sheets` BottomSheet on mobile / Modal on desktop + `ModalHeader`, like ExamEndConfirmationSheet).
  - The sheet is `components/features/payment/ContinueFreeSheet.tsx` with four outlined buttons and a Skip text link.
  - Reasons: expensive / exploring / later / payment issue.
  - Any answer or Skip sends `continue_free_reason {reason, …funnel props}` and leaves at once (`leavePaymentPage`).
  - **"Payment issue"** opens WhatsApp support with a prefilled message and stays on the page.
  - The close button or backdrop just stays.
  - Copy en/hi/mr in `modals.unlockFullAccessModal.continueFree*`.
- **Verified locally:**
  - hi mobile sheet + en desktop modal screenshots.
  - Payment issue → WhatsApp popup and still on the page; X → stays.
  - Skip from a direct link → `/preparation/<course>`.
  - A reason with history → back.
  - tsc clean; eslint equal to main (44 = 44); check:colors passes.

## Event names corrected (2026-10-23, user's rule: reuse existing events)
The first version created new snake_case events next to existing ones. Now:

| Moment | Event (existing unless marked new) | Properties added |
|---|---|---|
| Payment page opened | Purchase Intent Initiated | exam, plan, price, source, language, in_app_browser |
| Plan changed | Plan Switched | exam, plan, price, source, language, in_app_browser |
| Pay tapped / autopay checkout created | Payment Initiated | plan, price, source, language, in_app_browser (+ `resumed_session` allowed in payment_flow) |
| Razorpay checkout opened | **Checkout Opened** (new) | billing_type + the same context |
| Paid / failed / cancelled in checkout | Payment Outcome | error_code, error_reason (failed) + the context |
| "Continue free" sheet resolved | **Continue Free Clicked** (new) | reason: expensive / exploring / later / payment_issue / skipped / closed + the context |
| Test saved after end-exam | Test Submitted (catalog, never sent before) | exam, course_id, section_name, total_questions, language |
| Test left (page closed / 30 min idle) | **Test Abandoned** (new) | test_id, test_type, course_id, reason, answered |
| Report opened / tab | Performance Report Viewed / Performance Report Tab Viewed (catalog, never sent before) | — |
| Cancel flow steps | **Cancel Started / Cancel Reason Selected / Save Offer Shown / Save Offer Accepted** (new, renamed from snake_case) | unchanged |
| Cancel/pause/resume done in the app | Subscription Status Updated | subscription_id, source: app, reason, note |
| Server: paid / renewal | Payment Completed (name already in Amplitude) | plan, price, billing_type, payment_method, is_renewal, renewal_count, days_since_first_payment, exam, course_id |
| Server: pending / halted / completed, or cancel/pause/resume by Razorpay | Subscription Status Updated | new_status, plan_name, exam_id, exam_name, subscription_id, source: razorpay, cancelled_by |
| Resizer (tools) | **Resizer Image Uploaded / Processed / Downloaded, Resizer Process Another Clicked** (renamed to Title Case) | unchanged |

- Clarity gets the same names through `trackPaymentEvent` (lib/analytics/paymentFunnel.ts).
- Removed names: pay_page_view, plan_selected, pay_tap, rzp_opened, rzp_dismissed, rzp_failed, continue_free_tap, continue_free_reason, test_submitted, test_abandoned, report_viewed, cancel_started, cancel_reason_selected, save_offer_shown, save_offer_accepted, subscription_cancelled, subscription_paused, resizer_*, and server paid, subscription_renewed, renewal_failed, subscription_halted/cancel_confirmed/pause_confirmed/resumed/completed.

## Plan
- [ ] **CC-63:**
  - Measure the tap → navigation time first.
  - Make the exit instant (navigate first, track with beacon).
  - Restyle it as a text link (design change, show a screenshot).
  - Bottom sheet with 4 reasons + Skip (en/hi/mr) → Amplitude `continue_free_reason`.
  - "पेमेंट में दिक्कत" → WhatsApp.
- [ ] **CC-74:**
  - Map source → headline/sub-headline (en/hi/mr).
  - Pass the item name/count where the caller knows it (chapter/topic name, test count) as URL params from the paywall openers.
  - Fall back to today's headline.
- [!] 🛑 **D1:** making "Continue free" a small text link is a visible design change. Approve a screenshot first.
- [!] 🛑 **D2:** store the reasons in the DB or Amplitude only (v1)?
- [ ] 📞 **C1:** RD approves the headline copy per source.
- [ ] **Verify:**
  - Tap → navigation under 100 ms at 4× CPU.
  - The sheet appears, skip works, the event is captured.
  - Each source shows its headline (Playwright with each `source=`), en/hi/mr at 360px.

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| | | | |
| 2026-10-23 | D1 | Small text link | User |
| 2026-10-23 | D2 | Reasons in Amplitude only | User |
