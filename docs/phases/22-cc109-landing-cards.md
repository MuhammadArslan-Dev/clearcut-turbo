# Phase 22 — CC-109: landing feature cards and testimonials look tappable

**Status:** Not Started
**Jira:** [CC-109](https://clear-cutoff.atlassian.net/browse/CC-109)
**Repos:** ASTRO `apps/go-marketing` (the data is from `/go/exam/*`); check CM `apps/landing` for the same cards
**Size:** small

## What the ticket says (Clarity, /go/exam/ pages, 90 days)
| Text tapped | Dead taps | Sessions |
|---|---|---|
| "नए सिलेबस के अनुसार PYQ ह…" | 591 | 156 |
| "ट्रायल अवधि में सभी फीचर्स…" (rewritten in CC-67) | 851 | 153 |
| "अपने पसंदीदा और भरोसेमंद…" | 337 | 94 |
| "PYQ, नोट्स और वीडियो से अ…" | 344 | 80 |
| "YouTube के पसंदीदा शिक्षक…" | 271 | 70 |
| "हमारे विद्यार्थियों की सफ…" | 664 | 33 |
| "परीक्षा क्लियर करने के लि…" | 737 | 27 |
| Marathi trial line | 127 | 26 |

Pick one rule for every card:
- **Option A (preferred):** each card taps through to its preview tab, or to signup.
- **Option B:** remove the shadow, border and hover so cards read as plain text.
- **Testimonials:** a "▶" when there's a video, else plain quotes.

Done when: dead taps on these cards drop by 80%+.

## What the code shows (2026-10-22, first pass)
- **Cards are in** `apps/go-marketing/src/pages/[...locale]/exam/[slug].astro` (whyChoose / features block) and `landing.astro`. Copy is in `src/i18n/copy.ts`.
- **Since CC-106,** every `/start` link gets UTM/fbclid and a pressed state from `StartLinkEnhancer.astro`. A card turned into a link gets that for free.
- **"Preview tabs" ticket (CC-108)** isn't done. Option A's "to the matching preview tab" depends on it, so for now Option A means "to signup".

## Plan
- [ ] List every card/testimonial block on exam, htet and landing pages (and landing app's FeaturesSection/testimonials).
- [ ] Apply the chosen rule everywhere; testimonials as quotes unless there's a video.
- [!] 🛑 **D1:** Option A (cards link to `/start` with `element_location=feature_card`) or Option B (make them look like plain text)? Option A adds entry points; Option B changes the look.
- [!] ⚠️ ASTRO has the user's uncommitted WIP on main: stash around merges; stage only this phase's hunks.
- [ ] Verify: build; Playwright at 390px; card taps go to `/start` with params (A), or nothing looks tappable (B); screenshots hi/mr.

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| | | | |
