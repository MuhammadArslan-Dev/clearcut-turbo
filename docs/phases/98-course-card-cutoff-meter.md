# Phase 98 — Course card: Cutoff Meter header (real data)

**Tickets:** (new, from user, 2026-11-11). Reference: `docs/design-assets/course-card-cutoff-meter.png`
**Repos:** CM (apps/dashboard) · BE (one small batch endpoint)
**Branches:** CM `feature/course-card-meter`, BE `feature/cutoff-meter-batch`. Neither is merged.
**Created / start date:** 2026-11-11
**Status:** Not Started. Plan is waiting for the user's review.

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
- [ ] BE: batch endpoint + test (ownership 404, flag off 404, ≤ 20 courses, shape)
- [ ] CM: `lib/dashboard/cutoffMeter.ts` (typed fetch) + `hooks/course/useCoursesCutoffMeter.ts` (one React Query key for the carousel, staleTime 5 min, invalidated where `courses-progress-summary` is)
- [ ] CM: `ProgressBar` gets optional `marker` / `fillClassName` (default render byte-identical; check all callers)
- [ ] CM: `MyCourseCard` header + meter panel. `MyCoursesWrapTwo` / `CourseSlideCard` pass the new props (level name, exam date, meter). Buttons block untouched.
- [ ] CM: i18n en / hi / mr; tokens if needed
- [ ] Update DEVELOPMENT_RULES §3.2 note on `MyCourseCard`
- [ ] Verify: tsc / eslint / check:colors / build. Screenshots at 390 + 1440 in en / hi / mr for all zones + locked + loading + meter-off + trial / expired badges. Request count = 1 meter request per page load. Numbers vs DB (`meter_history`)

## 4. Progress / completed changes
- 2026-11-11: screenshot saved to `docs/design-assets/course-card-cutoff-meter.png`; current card and data flow read (`MyCourseCard.tsx`, `MyCoursesWrapTwo.tsx`, `/v2/get-my-active-courses`, `/v2/interactions/progress-summary`).

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-11 | Change MyCourseCard (previously frozen)? | Yes, top part only; buttons unchanged (user) |

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
- [ ] Baseline screenshots of the current card (390 / 1440, en / hi / mr, trial / active / expired)
- [ ] Break-it pass:
  - long exam / level names at 390 px
  - meter API slow or failing → no layout shift, no dead taps
  - trial-ended pill still opens payment
  - request count
  - numbers vs DB
- [ ] **Not verified:** (fill in)

## 9. Next steps
Wait for the user on D1–D4, then implement §3 in order.
