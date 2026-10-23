# Phase 33 — CC-63 + CC-74: an instant "Continue free" with a reason, and a headline that matches what the student tried to unlock

**Status:** Not Started
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
