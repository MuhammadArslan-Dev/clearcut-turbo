# Phase 98 — Course card: Cutoff Meter header (real data)

**Tickets:** (new, from user, 2026-11-11). Reference: `docs/design-assets/course-card-cutoff-meter.png`
**Repos:** CM (apps/dashboard) · BE (one small batch endpoint)
**Branches:** CM `feature/course-card-meter`, BE `feature/cutoff-meter-batch`. Neither is merged.
**Created / start date:** 2026-11-11
**Status:** In Review. Built and verified locally (2026-11-11); not merged.

## 1. Problem / objective
Redesign the **top part** of the My Courses card (`MyCourseCard`) to match the screenshot. Everything shown must be real data:
- exam logo
- "HTET Level 1 (PRT)"
- "📅 41 days to exam"
- plan pill "✓ Full plan"
- a meter panel: **82 / 150**, zone pill "Almost there", a bar with the pass-mark line, "Cutoff Meter", "8 marks to Clear Zone"

**The buttons below stay exactly as they are:** Continue / Add subjects / Buy full course / Renew, the price note and the trial note.

> `MyCourseCard` was marked "client-approved, do not restyle" in DEVELOPMENT_RULES §3.2. This phase changes its header at the user's explicit request (2026-11-11), and the rule will be updated to say so.

## 2. Scope
- **In:**
  1. **Header row:** exam logo (the existing `logo_url`; fallback a letter avatar, e.g. "H" on green, as in the screenshot) · title `{short_name} {level name}` · "📅 {n} days to exam" · plan pill.
  2. **Meter panel** (soft background box):
     - big number `meter` / `max_marks`
     - zone pill
     - bar filled to meter/max with a dark tick at the pass mark
     - left label "Cutoff Meter"
     - right label = gap text
  3. **Real data sources:**

     | Element | Source |
     |---|---|
     | Title level | enrollment `metadata.stagesNames[0]`, the paper / level the student picked (HTET → "Level 1 (PRT)", CTET → "Paper 2") |
     | Days to exam | `exam.metadata.exam_date` (already in the courses payload). Past, missing or "Upcoming" → the line is hidden (🛑 D3) |
     | Plan pill | the same status logic as today (`getCourseStatus`: Full plan / Trial · n days left / Trial ended / Expired). Same click behaviour on "Trial ended" (`statusClick`) |
     | Meter, max, pass mark, gap, zone | Cutoff Meter API (phase 97): new batch `GET /v2/cutoff-meter?courses[]=…`, one request for the whole carousel (no N+1, like progress-summary) |
  4. **Zone pill and colours** from the meter's spec colour (§1.4):

     | Spec colour | Pill | Gap text |
     |---|---|---|
     | 🔴 red (meter < pass − 15) | "Needs work" | "{gap} marks to Clear Zone" |
     | 🟡 yellow (within 15 below pass) | "Almost there" | "{gap} marks to Clear Zone" |
     | 🟢 green (meter ≥ pass) | "Clear Zone" | "+{n} above pass mark" |
     | locked (< 5 answers) | "Locked" | "Answer 5 questions to unlock" (bar empty, "?" instead of a number) |

     Colours come from existing design tokens only (`check:colors`). Any amber / red / green soft token that is missing gets added to `tokens.css`, not hard-coded.
  5. **Bar:** extend the existing `ui/ProgressBar` with an optional `marker` (pass-mark tick) and colour prop, default unchanged, rather than a new component (DEVELOPMENT_RULES §3.3 ladder).
  6. **i18n:** every new string in en / hi / mr (`messages/{en,hi,mr}` "myCourses" namespace).
  7. **States:** loading skeleton (same layout, no shift), meter unavailable (see §6), locked, all three zones, long names at 390 px.
- **BE (small):** `GET /v2/cutoff-meter?courses[]=a&courses[]=b` (≤ 20, same ownership rule) returning `{group_code: meterSummary}`. It reads the latest `meter_history` row or computes it, and returns 404 while `CUTOFF_METER_ENABLED=false`.
- **Out:**
  - Buttons, price and trial notes, card size outside the header, other screens.
  - The Next Best Action list (not on this card).
  - The motion gallery's animated meter (phase 96). This card uses a static bar with a simple fill transition, as in the screenshot.

## 3. Implementation plan
- [x] BE `feature/cutoff-meter-batch`:
  - `GET /v2/cutoff-meter?courses[]=` (≤ 20, own courses only, 404 when off)
  - `capabilities.cutoff_meter`
  - my-courses now returns enrollment `metadata` (level name)
  - enrollments whose level belongs to another exam are skipped (bad fixture data showed CTET's meter on HPTET / MAHATET / UGC)
- [x] CM:
  - `lib/dashboard/cutoffMeter.ts`
  - `hooks/course/useCoursesCutoffMeter.ts` (one request; none while the capability is off)
  - `lib/dashboard/courseCardMeta.ts` (`levelName`, `daysToExam` in IST, hidden when past)
- [x] CM: `ProgressBar` gains optional `marker` and `animate` (the design's spring, `cubic-bezier(.34,1.56,.64,1)` 1150 ms after 250 ms; reduced motion = instant). Without `marker` the DOM is identical.
- [x] CM: `MyCourseCard` header and `CutoffMeterPanel` (+ skeleton, locked state, count-up via `@clearcut/motion/core` `useCountUp`). `MyCoursesWrapTwo` passes level, days and meter. Buttons block untouched.
- [x] CM: i18n en / hi / mr (10 keys each, appended). Only existing tokens; no new colours.
- [x] DEVELOPMENT_RULES §0 / §3.2 updated
- [ ] Verify: tsc / eslint / check:colors / build. Screenshots at 390 + 1440 in en / hi / mr for all zones + locked + loading + meter-off + trial / expired badges. Request count = 1 meter request per page load. Numbers vs DB (`meter_history`)

## 4. Progress / completed changes
- 2026-11-11: screenshot saved to `docs/design-assets/course-card-cutoff-meter.png`; current card and data flow read (`MyCourseCard.tsx`, `MyCoursesWrapTwo.tsx`, `/v2/get-my-active-courses`, `/v2/interactions/progress-summary`).

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-11 | Change MyCourseCard (previously frozen)? | Yes, top part only; buttons unchanged (user) |
| 2026-11-11 | D1 meter off in prod | Keep today's Chapters / Tests bars as fallback; switch to the meter panel automatically when the API answers (user) |
| 2026-11-11 | D2 bars once the meter is live | Remove them; fallback only (user) |
| 2026-11-11 | D3 past / "Upcoming" exam date | Hide the days-to-exam line (user) |
| 2026-11-11 | D4 zone names | 3 names: Needs work / Almost there / Clear Zone (user) |

## 6. Blockers / risks — 🛑 needs the user before implementation
- 🛑 **D1: The meter is OFF in production** (`CUTOFF_METER_ENABLED=false`, migration not run, no backfill). Until it is turned on, the card has no real meter number. What should it show meanwhile?
  - **(a) Recommended:** keep today's two bars (Chapters / Tests) as the fallback, and switch to the meter panel automatically once the API answers. Nothing regresses.
  - **(b)** Show the "Locked: answer 5 questions" panel to everyone.
  - **(c)** Turn the meter on first (migration → backfill → recompute → flag), then ship the card.
- 🛑 **D2: Chapters / Tests bars.** The screenshot shows only the meter panel above the buttons. Remove the two bars once the meter is live?
  - Recommended: yes. They stay only as the D1 fallback.
- 🛑 **D3: Exam date** is in the past for HTET (04 Jul 2026) and CTET (06 Sep 2026), and "Upcoming" for HPTET. What should show then?
  - **(a) Recommended:** hide the line until content sets a future date.
  - **(b)** Show "Exam date soon".
- 🛑 **D4: Zone names.** The screenshot uses the studio's words ("Almost there", "Clear Zone"). The spec has 3 colours, so there are 3 names: Needs work / Almost there / Clear Zone. The studio's 4th "Safe Zone" isn't in the spec. Use the 3 names?
- **D5: Edit (gear) button.** The current header has an Edit button; the screenshot has none. "Buttons don't change", so the Edit button stays: same button, placed at the right of the title row next to the plan pill, unless the user wants it moved.
- **Data caveats** (from phase 97 `check-data`):
  - some levels' max is not 150 (e.g. CTET Maths & Science shows "/ 180") until content fixes the section marks
  - pass mark is the General value (category not collected)

## 7. Dependencies / packages added
- No packages.
- BE: one route.
- CM: maybe new soft colour tokens in `packages/design-tokens/tokens.css`.

## 8. Tests and verification
- [x] Copy DB `clearcut_pt` with the meter on. Fixture user 19392:
  - HTET L1: 82 / 150, yellow "Almost there", "8 marks to Clear Zone", 41 days to exam. Matches the reference.
  - UTET 117 / 150 green; CTET 93 / 180 green (180 = content data issue); REET 47 / 150 red; others locked.
- [x] Playwright (Sonnet):
  - 1440 + 390 en, 390 hi + mr: layout matches the reference
  - no horizontal overflow
  - titles wrap beside the pill
  - **1 meter request** for 10 cards, 1 capabilities request, no per-card call
  - Continue still navigates; no console errors from the card
  - Bar animates (mid 75 → final 82, fill overshoots then settles)
  - Screenshots: scratchpad `phase98/`
- [x] tsc: 111 errors with and without this change (the count depends on the dev-server-generated types). Lint: same counts before and after (10). `check:colors`: no new colours.
- [x] Backend: `CutoffMeterTest` 9/9 + flags-off suite
- [ ] Break-it pass:
  - long exam / level names at 390 px
  - meter API slow or failing → no layout shift, no dead taps
  - trial-ended pill still opens payment
  - request count
  - numbers vs DB
- [ ] **Not verified:**
  - production (meter is off there, so the cards keep the legacy bars until it is enabled)
  - dark mode
  - real-device swipe
  - the animation replaying on swipe-back
  - hi / mr screenshots after the animation was added (taken before; the layout is unchanged)
  - retry or failing-network for the meter request (falls back to the bars)
- Data findings:
  - UP PGT and UP TGT have no pass mark, so the generic `exams.metadata.cutoff` "90+ / 150" is used against max 425 / 500 (content)
  - CTET section sums are 180

## 9. Next steps
Wait for the user on D1–D4, then implement §3 in order.

## 9. Follow-ups (2026-11-11, same branch)

- **All 9 Cutoff Meter Studio states** ("sab kro"):
  - BE `CutoffMeterService::presentation()` adds `zone` (incl. `safe_zone`, pass + 10), `early`, display-only `cooling` and `display_meter`/`display_gap` to the summary.
  - Cooling: after 3 idle days, −(days − 1), max −5; the stored meter is never changed. Off: `CUTOFF_METER_COOLING_ENABLED=false`. **Client to confirm** (the spec says the meter changes only on answers).
  - Card:
    - Early estimate / Cooling pill (❄)
    - Safe Zone ★
    - ± change chip, plus a wobble when the score drops
    - Desaturated bar while cooling
    - Final-week 🔥 chip (≤ 7 days)
- **Header (user page feedback):**
  - Status pill back on the card's top edge, in the old style. "Trial Ended" is still a button.
  - Title on one line with an ellipsis.
  - Edit sits at the right of the title.
- **Bar (`CutoffMeterBar`, studio bar meter 1:1):**
  - 18px track, tinted by zone (need / almost / clear / safe vs the pass mark)
  - Confidence band around the score (opacity .16, ±5px; ±15 marks when early → ±4 when settled)
  - Zone fill and a dark 3px pass tick (±8px)
  - Nibbu (`@clearcut/motion/meters/nib`) riding 30px above the fill end, posed per state as in the studio table. Hidden when locked.
  - Colours from `@clearcut/motion/meters/zones` (approved artwork)
  - `ProgressBar` is back to its original code
- **Verified (Playwright, 390 en/hi/mr + 1440):**
  - Every state matches its fixture.
  - Nib and knob x-diff is 0 px.
  - Nothing is clipped at 12.7 % or 78 % fill.
  - No page overflow.
- **Not verified:**
  - The slide-on-load frame for the nib and knob, and the cooling bob (position checked only).
  - The drop wobble.
  - The trial-ended pill (no fixture has it).
  - Real devices.
