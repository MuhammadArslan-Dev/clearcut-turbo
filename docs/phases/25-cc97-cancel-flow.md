# Phase 25 — CC-97: ask why before cancelling, offer a way to stay, confirm clearly

**Status:** Not Started — offers need RD's confirmation before build
**Jira:** [CC-97](https://clear-cutoff.atlassian.net/browse/CC-97)
**Repos:** CM `apps/dashboard`; BE (store the reason; plan switch autopay → one-time; maybe a discount)
**Size:** large, new flow

## What the ticket says
- **Today:** cancel is 2 taps ("Cancel" → "Yes, Cancel"), with no reason asked and no offer.
- **Clarity (Jul 23 – Oct 21):** 13 sessions tapped "Yes, Cancel" and 10 tapped "Yes, Pause", about 10% of ~220 paying students in 90 days.
- **No clear confirmation:**
  - One student tapped cancel 4 times.
  - A paused student kept tapping "Paused" and the dates.

**Build**
1. **Required one-tap reason:** "आप क्यों रद्द कर रहे हैं?"
   - परीक्षा खत्म / पास हो गया
   - महँगा लगा
   - समय नहीं मिल रहा
   - कंटेंट पसंद नहीं आया
   - Autopay नहीं चाहिए
   - कुछ और (text box)
2. **One offer, by reason.** RD confirms these:

   | Reason | Offer |
   |---|---|
   | No time | "1 महीने के लिए रोकें" (pause, no charge) |
   | No autopay | Switch to one-time monthly |
   | Too expensive | **RD decides** (e.g. next month ₹49, or ₹99 without autopay) |
   | Didn't like content | "WhatsApp पर बात करें" (Ganesh's support number) |
   | Exam over | Straight to cancel, with "बधाई हो! 🎉" |
3. **Clear end screen:** "आपका प्लान रद्द हो गया। {date} तक एक्सेस रहेगा।" The status changes to "Cancelled". Pause gets the same: until when it's paused, and when it restarts.

**Tracking:** `cancel_started`, `cancel_reason_selected`, `save_offer_shown`, `save_offer_accepted`, `subscription_cancelled`, `subscription_paused`.

## What the code shows (2026-10-22, first pass)
- **UI:** `components/features/subscription/SubscriptionWrap.tsx` (the Subscriptions tab; CC-100 made its labels plain).
- **BE cancel/pause/resume:** `SubscriptionController::cancel/pause/resume`.
  - The cancel message already returns "Access continues until {valid_till}".
  - Pause only works on authenticated/active subscriptions.
- **No reason is stored today.** Needs a column or table (or an Amplitude-only start).
- **"Switch autopay → one-time"** has no backend flow. It would mean cancel plus a one-time order.
- **Related open data issue (CC-100):** paused/active charge counts look off (`SubscriptionWebhookService.php:64`), so check pause dates before showing "restarts on {date}".

## Plan
- [ ] Reason sheet (BottomSheet on mobile / Modal on desktop, existing components), then an offer card, then a confirmation screen; the same end state for pause.
- [ ] BE: save the reason (+ free text) with the subscription; return the access end date and pause end.
- [ ] Offers wired to existing actions first (pause, WhatsApp, cancel); "switch to one-time" and any discount only after RD's decision.
- [ ] Amplitude events.
- [ ] 📞 **C1:** RD confirms the offers per reason (especially "too expensive").
- [!] 🛑 **D1:** store reasons in the DB (migration) or Amplitude only for a first version?
- [!] 🛑 **D2:** the support WhatsApp number.
- [!] ⚠️ Touches live subscriptions (Razorpay). Test only with the test number; no live cancels from this machine.
- [ ] Verify: Playwright through each reason path with stubbed BE; screenshots en/hi/mr; BE tinker check that the reason is saved.

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| | | | |
