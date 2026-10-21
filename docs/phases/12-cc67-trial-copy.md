# Phase 12 — CC-67: make the trial copy match what trial users actually get

**Status:** Not Started — Step 1 can be sent to RD now; the rest is blocked on RD's copy
**Jira:** https://clear-cutoff.atlassian.net/browse/CC-67
**Repos:** ASTRO, CM `apps/landing`, CM `apps/dashboard`, CMS admin (content, not code)
**RD decision (Oct 21):** keep the locks; change the copy. Remove "सभी फीचर्स" / "all features" everywhere.

## Step 1 — what a CTET trial user can open today (from code; for RD)
The backend treats `trial` the same as `trial_end`: `hasAccess = !(status in [trial, trial_end])`.

| Content | Open during the trial | Source |
|---|---|---|
| Videos / topic content / notes | Only chapters with `chapter_order == 1` (first chapter of each section). ⚠️ An FE comment says "only one chapter in total is free"; confirm with real data. | `BE ChapterResource.php:19-21` |
| Chapter tests | First test of each chapter | `SectionalTestService.php:336-351` |
| Sectional tests | First test of each section | same |
| Full-length papers | First test per paper | `FullLengthExam.php:69` |
| Daily tests | Today's test only | `DailyTestController.php:303,483` |
| PYQs (`content/pyqs`) | First PDF of each list. ⚠️ The lock is **frontend-only**; the file URLs still come back in the API. | dashboard `paper-page.tsx:159` |

## Step 3 — where trial copy lives

**"All features" lines (must change)**
- ASTRO `apps/go-marketing/src/i18n/copy.ts`:
  - features[2].description: hi :676, en :721, mr :790
  - landing features `desc`: en :142, hi :379, mr :888
- CM `apps/landing/src/components/sections/FeaturesSection.tsx`: en :57, hi :87, mr :117 (hardcoded in code)

**Other trial copy to review**
- ASTRO `copy.ts`:
  - trial CTA :644/:689/:747
  - floatingCta :341/:578/:1087
  - pricingPoints :78/:94/:840
  - htetCopy :596/:616/:1104
  - FAQ :333/:570/:1079
  - sticky bar rotating "Videos/Notes/PDFs/Tests" (`[slug].astro:426`)
- CM landing:
  - `FloatingButton.tsx:8` (hardcoded English on hi/mr too)
  - `HeroActions.tsx:11/16/21`
  - `PricingSection.tsx:38/55/72`
  - `FAQsSection.tsx` fallback
  - `app/[locale]/page.tsx:93-96` (JSON-LD FAQ)
  - `coursr-marketing-page.tsx:59/133/206`
  - `FreeTrialBadge.tsx:6`
  - `/start` `StartAuthForm.tsx` trialTitle/trialSubtitle (no "all features")
- CM dashboard:
  - `messages/*.json`: `course.courseStatus.trial` ("FREE ट्रायल के 3 दिन बचे हैं"; **the "3" is hardcoded**), `examCard.ctaTrial`, `myCourses.*`
  - `modals.json`: topic/test/dailyTest locked modals ("अभी अनलॉक करें")
  - `payment.json` `unlockNow`
  - `dailyTests.json`
  - `PaywallFloatingWidget.tsx:128`: "Unlock {examTitle} course" hardcoded in English
- CMS: no "all features" string in the repo. **The live CMS DB (FAQ answers, comparison pages) must be searched in the admin.**

## Plan
- [ ] Send the Step 1 table to RD. Confirm the free scope first (first chapter per section, or one chapter in total?).
- [ ] 📞 **C1:** RD: final en/hi/mr wording for the trial line, the dashboard banner, and the "यह ₹99 प्लान में शामिल है" lock line. **Blocks all copy work.**
- [ ] 📞 **C2:** RD: should the banner show the **real** days left (needs a backend field), or stay generic?
- [ ] 📞 **C3:** RD/owner: someone searches the live CMS admin for "सभी फीचर्स" / "all features".
- [!] 🛑 **D1:** translate the hardcoded English strings (`FloatingButton`, `PaywallFloatingWidget`) while touching them? Yes per DEVELOPMENT_RULES §2.4. Confirm.
- [!] 🛑 **D2:** fix the PYQ frontend-only lock (BE must stop returning locked file URLs)? This is a security/entitlement change, outside the copy scope.
- [!] ⚠️ **System impact:**
  - Copy spans 3 deploys: ASTRO, landing, dashboard. Release them together, so ad → landing → app say the same thing.
  - The RN app picks up dashboard copy automatically.
  - Ad copy is Ganesh's job (outside this ticket).
- [ ] Apply the copy in all places above (en/hi/mr). Screenshots of each page in hi and mr.

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| 2026-10-21 | Locks vs copy | Keep locks, change copy | RD (from the ticket) |
