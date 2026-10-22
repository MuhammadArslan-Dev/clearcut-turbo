# Phase 22 — CC-109: landing feature cards and testimonials look tappable

**Status:** Built + verified locally (2026-10-22) — ASTRO branch `phase-22-landing-cards` (8c663be), not merged, not deployed
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

## What was found (2026-10-22)
- **Already links (CC-106/107):**
  - On exam pages: hero feature list, testimonials, guarantee banner, sticky-bar price, sticky-bar unlock badge.
  - On landing: header, hero, how-it-works, guarantee, pricing, floating CTA.
- **Not links:** the three **feature rows** ("PYQ, नोट्स और वीडियो से अभ्यास करें", "YouTube के पसंदीदा शिक्षक", "3 दिन फ्री में आज़माएं") on every `/go/exam/*` page and on `/go/landing`. These carry most of the ticket's dead taps (their titles and descriptions are the rows in the table).
- **"ट्रायल अवधि में सभी फीचर्स…"** no longer exists (rewritten in CC-67). **"हमारे विद्यार्थियों की सफ…"** isn't in the current copy either (old heading).
- **htet.astro** has no such cards (hero, logos, pricing only).

## What was built (Option A, the ticket's preferred rule)
- Each feature row is an `<a href="/start?...&element_location=feature_card&element_type=card" data-start-link>` with the same classes (+ `cursor-pointer`). `StartLinkEnhancer` adds UTM/fbclid and the pressed state like every other `/start` link.
- Exam pages: `course=<code>` and the locale's `/start`. Landing: the locale's `/start`, same as its guarantee banner.
- Testimonials were already `/start` links. No video testimonials exist, so no ▶.

## Verification
- [x] `astro build` (27 pages): 3 feature-card links on each of the 9 en, 9 hi and 2 mr exam pages and on landing en/hi/mr.
- [x] Playwright 390px on `astro preview`, `/start` stubbed:
  - `/go/hi/exam/htet-preparation?utm_source=facebook&utm_campaign=p22test`: tap → `https://clearcutoff.in/hi/start?course=htet&element_location=feature_card&element_type=card&utm_source=facebook&utm_campaign=p22test`.
  - `/go/landing?utm_source=google` → `/start?element_location=feature_card&element_type=card&utm_source=google`.
  - Text colour unchanged (rgb(25,40,57)), no underline; screenshot same as before.
- [x] Only this phase's hunks committed. The user's uncommitted WIP (academy files, mahatet ₹149 in exam/[slug].astro, htet.astro, pnpm-lock) is untouched in the working tree (backup: scratchpad `astro-wip-backup-p22.patch`).

## Plan
- [ ] List every card/testimonial block on exam, htet and landing pages (and landing app's FeaturesSection/testimonials).
- [ ] Apply the chosen rule everywhere; testimonials as quotes unless there's a video.
- [!] 🛑 **D1:** Option A (cards link to `/start` with `element_location=feature_card`) or Option B (make them look like plain text)? Option A adds entry points; Option B changes the look.
- [!] ⚠️ ASTRO has the user's uncommitted WIP on main: stash around merges; stage only this phase's hunks.
- [ ] Verify: build; Playwright at 390px; card taps go to `/start` with params (A), or nothing looks tappable (B); screenshots hi/mr.

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| 2026-10-22 | D1 link vs plain | Option A (ticket's preferred): feature rows link to /start; look unchanged | Claude per ticket; user asked to continue without stopping |
