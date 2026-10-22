# Phase 12 — CC-67: make the trial copy match what trial users actually get

**Status:** In Review (CM + ASTRO branches cc-67-trial-copy; not merged)
**Jira:** https://clear-cutoff.atlassian.net/browse/CC-67
**Repos:** ASTRO, CM `apps/landing`, CM `apps/dashboard`, CMS admin (content, not code)
**RD decision (Oct 21):** keep the locks; change the copy. Remove "सभी फीचर्स" / "all features" everywhere.
**RD (Oct 22):** approved that Claude writes the copy (as a copywriter).

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

## Copy deck (2026-10-22, written by Claude, RD approved Claude writing it)
Rule: say exactly what the trial opens (backend: `chapter_order == 1` per section, first test per chapter/section/paper, today's daily test), never "all features". Same lines on every surface: ad page (ASTRO) → site (landing) → app (dashboard).

| Where | en | hi | mr |
|---|---|---|---|
| Trial card title (ASTRO exam pages + /go landing + landing FeaturesSection) | Try it free for 3 days | 3 दिन फ्री में आज़माएं | 3 दिवस मोफत वापरून पाहा |
| Trial card text (same places; replaced the "all features" line) | The first chapter of every subject, the first test of every chapter and today's daily test — all free. Like it? Unlock the full course. | हर विषय का पहला चैप्टर, हर चैप्टर का पहला टेस्ट और आज का डेली टेस्ट — सब फ्री। पसंद आए तो पूरा कोर्स अनलॉक करें। | प्रत्येक विषयाचा पहिला चॅप्टर, प्रत्येक चॅप्टरची पहिली टेस्ट आणि आजची डेली टेस्ट — सगळं मोफत. आवडलं तर पूर्ण कोर्स अनलॉक करा. |
| Pricing point "3-day free trial before paying" | Try the first chapter of every subject and a test from every chapter. No payment needed. | हर विषय का पहला चैप्टर और हर चैप्टर का एक टेस्ट आज़माएं। कोई भुगतान नहीं। | प्रत्येक विषयाचा पहिला चॅप्टर आणि प्रत्येक चॅप्टरची एक टेस्ट वापरून पाहा. पेमेंटची गरज नाही. |
| FAQ "Is a trial available?" (ASTRO, landing FAQ, landing JSON-LD) | Yes. For 3 days you get **the first chapter of every subject** (videos and notes), the first test of every chapter, section and paper, and today's daily test — free, no card needed. Everything else unlocks when you choose a plan. | हाँ। 3 दिन तक आपको **हर विषय का पहला चैप्टर** (वीडियो और नोट्स), हर चैप्टर, सेक्शन और पेपर का पहला टेस्ट, और आज का डेली टेस्ट फ्री मिलता है — कोई कार्ड नहीं चाहिए। बाकी सब प्लान लेने पर खुलता है। | हो. 3 दिवस तुम्हाला **प्रत्येक विषयाचा पहिला चॅप्टर** (व्हिडिओ आणि नोट्स), प्रत्येक चॅप्टर, सेक्शन आणि पेपरची पहिली टेस्ट आणि आजची डेली टेस्ट मोफत मिळते — कार्डची गरज नाही. बाकी सगळं प्लान घेतल्यावर उघडतं. |
| Hero bullet (was "Free demo classes") | First chapter of every subject free | हर विषय का पहला चैप्टर फ्री | प्रत्येक विषयाचा पहिला चॅप्टर मोफत |
| Dashboard trial badge (was "3 days left" every day) | 3 / 2 days left in FREE trial · Last day of FREE trial | FREE ट्रायल के 3 / 2 दिन बचे हैं · FREE ट्रायल का आखिरी दिन | मोफत ट्रायलचे 3 / 2 दिवस शिल्लक · मोफत ट्रायलचा शेवटचा दिवस |
| Locked topic popup subtitle | Your free trial includes the first chapter of every subject. Unlock the full course to keep going. | फ्री ट्रायल में हर विषय का पहला चैप्टर मिलता है। आगे पढ़ने के लिए पूरा कोर्स अनलॉक करें। | मोफत ट्रायलमध्ये प्रत्येक विषयाचा पहिला चॅप्टर मिळतो. पुढे शिकण्यासाठी पूर्ण कोर्स अनलॉक करा. |
| Locked test popup subtitle | Your free trial includes the first test of every chapter, section and paper. Unlock the full course to take this one. | फ्री ट्रायल में हर चैप्टर, सेक्शन और पेपर का पहला टेस्ट मिलता है। यह टेस्ट देने के लिए पूरा कोर्स अनलॉक करें। | मोफत ट्रायलमध्ये प्रत्येक चॅप्टर, सेक्शन आणि पेपरची पहिली टेस्ट मिळते. ही टेस्ट देण्यासाठी पूर्ण कोर्स अनलॉक करा. |

**Other untrue lines fixed on the way (pricing, next to the trial copy):**
| Was | Now (en / hi / mr) |
|---|---|
| "Unlimited access for 6 or 15 months" (ASTRO + landing pricing) — real plans are 1 month and 12 months | Pick 1 month or 12 months. Study at your own pace. / 1 महीने या 12 महीने का प्लान चुनें। अपनी गति से पढ़ें। / 1 महिना किंवा 12 महिन्यांचा प्लान निवडा. तुमच्या गतीने अभ्यास करा. |
| "Pay once. 6 months of access" + price card "₹99 — 6-month subscription" (₹99 is the monthly autopay plan) | Plans from 1 month. … / 1 महीने से शुरू होने वाले प्लान। … / 1 महिन्यापासून सुरू होणारे प्लान. … ; price card: per month / प्रति महीना / प्रति महिना |
| "<b>Free notes</b> and study material!" (coaching vs app row; notes come with the paid plan) | Notes and study material **included** / नोट्स और स्टडी मटेरियल **शामिल** / नोट्स आणि अभ्यास साहित्य **समाविष्ट** |

**Translated (were English on hi/mr pages, D1):** landing floating CTA ("Start 3-day FREE trial" → `common.startTrial`), dashboard PaywallFloatingWidget ("Unlock {exam} course" → `myCourses.unlockCourse`).

**Not changed:** CTAs "Start 3-day free trial" (true); /start "3-day FREE Trial • No card or payment required" (true); paid-plan "Unlock Full Access" modal (describes the paid plan, true).

## Plan
- [ ] Send the Step 1 table to RD. Confirm the free scope first (first chapter per section, or one chapter in total?).
- [x] 📞 **C1:** RD approved Claude writing the copy (deck above).
- [x] **C2:** real days left, computed in the dashboard from the enrollment date with the backend's own rule (ExpireTrials: trial_end once created DATE <= today - 3) — no backend field needed (`lib/status/trialDaysLeft.ts`).
- [ ] 📞 **C3:** RD/owner: someone searches the live CMS admin for "सभी फीचर्स" / "all features".
- [x] **D1:** translated (DEVELOPMENT_RULES §2.4).
- [!] 🛑 **D2:** fix the PYQ frontend-only lock (BE must stop returning locked file URLs)? This is a security/entitlement change, outside the copy scope.
- [!] ⚠️ **System impact:**
  - Copy spans 3 deploys: ASTRO, landing, dashboard. Release them together, so ad → landing → app say the same thing.
  - The RN app picks up dashboard copy automatically.
  - Ad copy is Ganesh's job (outside this ticket).
- [x] Applied in ASTRO (`i18n/copy.ts`), landing (Features, Pricing, FAQ, JSON-LD, marketing page, floating CTA) and dashboard (badge, lock popups, widget). Screenshots (390px): /go hi + mr exam pages (trial card, hero bullet), /go hi landing (pricing card + points), landing /hi features card — text fits.
- [ ] 📞 **C3 still open:** someone searches the live Payload CMS admin for "सभी फीचर्स" / "all features" / "6 महीने".
- [ ] D2 (PYQ frontend-only lock) still open — separate security task.

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| 2026-10-21 | Locks vs copy | Keep locks, change copy | RD (from the ticket) |
| 2026-10-22 | Copy | Claude writes it (copywriter); deck above | RD via user |
| 2026-10-22 | Tests | ICU badge strings render in en/hi/mr for 3/2/1 days (Latin digits in mr); trialDaysLeft edge cases (same day 3, next day 2, 2+ days 1, missing date 3); ASTRO build OK; tsc no new errors; ESLint no new problems; check:colors OK | Claude |
