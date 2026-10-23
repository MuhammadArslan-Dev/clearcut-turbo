# Phase 33 — CC-63 + CC-74: an instant "Continue free" with a reason, and a headline that matches what the student tried to unlock

**Status:** Partly built (2026-10-23), CM `phase-33-continue-free`: the instant exit only. Bottom sheet (D1/D2) and headlines (C1) wait for decisions.
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
