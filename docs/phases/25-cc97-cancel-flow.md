# Phase 25 — CC-97: ask why before cancelling, offer a way to stay, confirm clearly

**Status:** Built + verified locally with stubbed backend (2026-10-22) — branch `phase-25-cancel-flow` (6723be8), not merged, not deployed. "Too expensive" offer still waits for RD.
**Jira:** [CC-97](https://clear-cutoff.atlassian.net/browse/CC-97)
**Repos:** CM `apps/dashboard` only (reasons go to Amplitude for v1; no BE change)
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

## What was built
- **`CancelFlowContent.tsx`**, inside the existing `ConfirmSheet` (bottom sheet on mobile, dialog on desktop). Steps: **reason → offer (if any) → confirm → done**. Pause and resume keep the old one-step confirm.
- **Reasons (required, en/hi/mr):** exam over, too expensive, no time, didn't like content, no autopay, something else (+ optional note, 300 chars).
- **Offers, only where an action already exists:**

  | Reason | What happens |
  |---|---|
  | No time | "Pause instead" (pause API), only if the plan can be paused (active/authenticated) |
  | Content | "Talk on WhatsApp" (`lib/support.ts`, prefilled "Cancelling my plan – {course} – {phone}") |
  | No autopay | Explains that cancelling stops autopay, access stays till period end, and a one-time plan can be bought later |
  | Exam over | "Congratulations! 🎉" on the confirm step |
  | Too expensive / other | Straight to confirm, **no offer until RD decides** |
- **Done screen:** "Your plan is cancelled / paused" + the backend's own message (it carries the access end date: "Access continues until …"). No dates are invented on the frontend. The list refreshes.
- **Amplitude (typed):**
  - `cancel_started`
  - `cancel_reason_selected {reason}`
  - `save_offer_shown {reason, offer}`
  - `save_offer_accepted {reason, offer}`
  - `subscription_cancelled {reason, note?}`
  - `subscription_paused {reason?}`

## Verification (Playwright 390px; `/v2/subscription` GET/cancel/pause stubbed, no real subscription touched)
- [x] Continue disabled until a reason is picked.
- [x] No time on an active plan → pause offer → only `POST /v2/subscription/101/pause` → "Your plan is paused".
- [x] Too expensive → straight to confirm → only `POST .../101/cancel` → "Your plan is cancelled" + "Access continues until 31 Oct 2026" (backend message).
- [x] Content → WhatsApp `wa.me/917404758398?text=Cancelling my plan – HTET – +919988776655`, no API call.
- [x] No time on a `created` plan (can't pause) → no pause offer.
- [x] Hindi: "आप क्यों रद्द कर रहे हैं?" + all 6 reasons.
- [x] tsc clean for these files; eslint 0 = 0; check:colors passes.
- [ ] 📞 C1: RD decides the "too expensive" offer (next month ₹49? ₹99 without autopay?). Needs a backend price/plan path before it can be built.
- [ ] D1 (v2): store reasons in the DB if Amplitude isn't enough.
- [ ] Check pause end/restart dates in the backend message before relying on them (CC-100 note on paused counts).

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
| 2026-10-22 | D1 store reasons | Amplitude only for v1 (no migration) | Claude; user asked to continue |
| 2026-10-22 | D2 WhatsApp number | lib/support.ts (917404758398) — confirm | Claude, flagged |
| 2026-10-22 | C1 offers | Built only offers that map to existing actions; 'too expensive' waits for RD | Claude |
