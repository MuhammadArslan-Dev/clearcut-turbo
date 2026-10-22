# Phase 03 — CC-107: raw code text ("var e=new IntersectionObserver…") on landing pages

**Status:** In Review (ASTRO branch cc-107-badge-link, commit pending merge)
**Jira:** https://clear-cutoff.atlassian.net/browse/CC-107
**Repos:** ASTRO only

## What the code shows (2026-10-21)
- **Verified:** the text is the inline `<script>` from `ASTRO/apps/go-marketing/src/components/LottieAnimation.astro:35-48`.
  - Astro outputs it where the component sits, inside the guarantee-badge block (`exam/[slug].astro:337-348`).
  - Confirmed in the live HTML of `/hi/go/exam/ctet-preparation`.
  - The same component is used in `htet.astro` and `landing.astro`.
- **Verified:** the script parses fine (all 10 inline scripts pass `node --check`), and it isn't escaped or `set:html`.
- **Guess:** visitors probably don't actually *see* the code. The 151 "dead taps" are taps on the guarantee badge, which is not a link. Clarity labels the tap with the container's text, and that text includes the script body.
- **"Unexpected end of input":** Sentry is **off** on go pages (no `PUBLIC_SENTRY_DSN`). The only Sentry issue with that message is in the dashboard on `/payment/initiated` (CLEARCUTOFF-NEXTJS-APP-7K). The cause on go pages is unknown: possibly a truncated response, the Cloudflare challenge script, or in-app-browser injection.

## Plan
- [ ] Open one Clarity dead-tap event and check its element selector, to confirm the "tap on badge" theory.
- [ ] Move the Lottie init script out of the content container: one script at the end of `<body>`, or an external module.
- [ ] Make the guarantee/price block a real `/start` link. This overlaps CC-106, so agree the link target with Phase 08.
- [ ] Check every go-page template (hi/en/mr, all exams, `htet.astro`, `landing.astro`).
- [!] 🛑 **D1:** turn on `PUBLIC_SENTRY_DSN` for go-marketing so these errors are captured? It adds the Sentry SDK weight to ad pages.
- [!] ⚠️ **System impact:** `LottieAnimation` is shared by all go pages. ASTRO is a separate Cloudflare Pages deploy (`dist/` is stale from Oct 3); the user deploys it.
- [ ] 📞 **C1:** RD: which tool showed the code text and the error? A screenshot or session link if possible.
- [ ] Verify: view the page on mobile and in the FB in-app browser. No visible code, and the badge tap goes to /start.

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| 2026-10-22 | D1 | (b) keep Sentry off on go pages for now; revisit if errors persist after this fix | User |
| 2026-10-22 | Link target | Guarantee badge -> /start (course + locale, element_location=guarantee_banner), same as landing.astro | User |
| 2026-10-22 | Done | Lottie script moved to public/lottie-lazy.js (Astro inlined the component script inside the badge); badge is a /start link on exam/[slug] + htet. Build: 0 pages with inline Lottie code; local preview: badge unchanged visually, animation lazy-loads. | Claude |
