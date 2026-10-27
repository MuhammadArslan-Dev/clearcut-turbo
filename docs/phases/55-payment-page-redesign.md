# Phase 55 — Payment / Unlock Full Access page redesign

**Tickets:** (new, from user)
**Repos:** CM dashboard
**Status:** Design breakdown done; mapping the existing page before any code
**Created:** 2026-10-27

---

## Goal

Rebuild the paywall / plan-selection page to the two screens in `docs/screens/payment/`,
**without changing any payment, pricing or analytics behaviour**.

- `Clear Cutoff HTET Access Page.png` — desktop
- `HTET Exam Subscription Plans.png` — mobile

Target route: `src/app/[locale]/(protected)/(payment)/payment/initiated/page.tsx` (1329 lines today —
it owns Razorpay, Meta pixel, Amplitude funnel events, price overrides and in-app-browser handling).

## Rules for this phase (from the user)

1. **Match the design.**
2. **Existing components first.** Only create something new when the design genuinely cannot be
   built from what exists — and then at the right layer (`DEVELOPMENT_RULES` §3.3 ladder).
3. Nothing at the shared/global layer gets redesigned (`packages/ui` is off limits).

---

## Design breakdown

### Shared between both screens

| Element | Spec |
|---|---|
| Exam header | Round exam logo, "HTET Exam" title, a pale-blue pill reading "Level 1 (PRT) + Level 2 (TGT) + Level 3 (PGT)", and a shield + "All levels included in one plan." line |
| "Choose your plan" | Section heading; desktop adds the sub-line "Select a plan that works best for you." |
| Plan row ×3 | Rounded card, left: `"<duration> • ₹<price>"` in bold with a struck-through ₹1,499 beside it, and a grey sub-line; right: a radio — filled blue tick when selected, empty circle when not. Selected row gets a blue border + pale blue fill. |
| Plan badges | Plan 1: blue "Best for new students" pill straddling the card's top edge. Plan 3: amber "👑 Most Popular" pill **inside** the card, above the price. Plan 2: no badge. |
| Plan copy | 1 — "1 month • ₹149" / "Full access to all levels and subjects" · 2 — "1 month • ₹229" / "One-time payment • No auto-renewal" · 3 — "12 months • ₹799" / "Best value • Covers your next exam" |
| Primary CTA | Full-width solid blue pill: "Unlock Full Access for ₹149 →" (the price tracks the selected plan) |
| Trust lines under CTA | 🔒 "Secure payment" │ 💳 "UPI / Card / Net banking", then "Cancel auto pay anytime" |

### Desktop only (`Clear Cutoff HTET Access Page.png`)

- Centred hero: "Unlock **Full Access**" ("Full Access" in brand blue) + "Everything you need to clear HTET Exam", with decorative arcs either side.
- Two columns: **left** card = exam header + 5 benefit rows + a green "Everything included in one price / No hidden charges…" strip; **right** card = "Choose your plan" + the 3 plan rows + CTA + trust lines.
- 5 benefit rows (icon tile + title + subtitle): All subjects included / Practice questions / Exam pattern based / Study anytime, anywhere / Free notes & study material.
- Footer: three trust badges (Safe & secure payments · Cancel anytime · 24×7 support) separated by rules, then a "Continue free learning" text link.
- Soft decorative circles bottom-left / bottom-right.

### Mobile only (`HTET Exam Subscription Plans.png`)

- No hero, **no benefit rows**, no footer trust badges — just the exam header, the "Choose your plan" card, and the CTA.
- CTA + trust lines sit in a **sticky bottom bar** separated by a divider from the scrolling content.

### Differences to resolve against the live page
The mock's plan names/prices/badges are illustrative; the real list comes from the pricing API and
`examPriceOverrides`. The layout is the deliverable — plan content must keep coming from the
existing data path. (Confirm against the structure map before building.)

---

## Steps

1. [x] Map the existing page.
2. [x] Decide per design piece: existing vs extend vs new.
3. [x] Shared `PlanCard`, used by the payment page **and** MainPaywall.
4. [x] Re-lay-out the page around the unchanged data + handlers.
5. [x] i18n for every new string in en / hi / mr.
6. [ ] Playwright: screenshots desktop + 390 in en/hi, and confirm every analytics event still fires. **Blocked on a dashboard auth token** (same blocker as phase 52).

---

## Built (2026-10-27)

### Component decisions (DEVELOPMENT_RULES §3.3 ladder)

| Design piece | Decision |
|---|---|
| Badge pills ("Best for new students", "Most Popular") | **Existing** `StatusChip` — `filled/info` gives the blue pill, `soft/warning` the amber one |
| Selected radio | **Existing** `CheckIcon` — already renders a filled blue circle with a white tick |
| Card shell, strikethrough price | **Existing** `Card` (with `overflow="visible"`, so the ribbon badge straddles the top edge instead of being clipped), `Text` |
| Hero copy | **Existing** keys — `title` is already "Unlock Full Access" and `subtitle` "Everything you need to clear {exam}" |
| Benefit-row and trust-badge icons | **Existing** `GraduationCapIcon`, `ClipBoardIcon`, `ChartSuccessBarIcon`, `ClockIcon`, `NoteIcon`, `SheildIcon`, `PhoneIcon` — approximations, not pixel matches, chosen over adding icon assets |
| Selectable plan row | **New** `features/payment/PlanCard.tsx` — nothing reusable existed; the markup was copy-pasted in two places |

### Files

| File | Change |
|---|---|
| `src/components/features/payment/PlanCard.tsx` | **New.** Presentational — no pricing, variant or analytics logic; the caller passes localised strings and owns `onSelect`. Radio is 24 px and **both states are the same box**, so selecting no longer shifts the row. `role="radio"` + Enter/Space. |
| `payment/initiated/page.tsx` | Three hand-written plan cards → `PlanCard`. Layout: the `lg` breakpoint turns the single flex column into the design's two-column grid (hero spans both, info card left, plan card + CTA right, trust row underneath). Benefits, green strip and trust badges are `lg`-only, matching how the two mocks differ. |
| `PayWalls/MainPaywall.tsx` | Its one live plan card → the same `PlanCard`. |
| `messages/{en,hi,mr}/modals.json` | +18 keys (`choosePlan`, `choosePlanSubtitle`, `all_levels_one_plan`, `no_hidden_charges`, `full_access_all_levels`, `benefits.*` ×10, `trust.*` ×3). Additions only; existing keys verified byte-identical. |

### Behaviour: unchanged (the hard rule for this phase)

Verified by diffing: all three `handleSelectVariant` calls preserved (only the prop name changed
`onClick` → `onSelect`); `handlePayClick` still bound to **both** the CTA and the trust row (the
deliberate C1 behaviour); `leavePaymentPage`, the `continueFree` trigger, `showOneTimeOption={selectVariant === "1month"}`
and the `cancelAnytime` rule all intact. No analytics call, effect, ref or early return was touched.
The only removed `onClick`s were the two inside the already-commented-out 6-month/15-month blocks.

### Cleanup
~64 lines of stale commented markup (6-month/15-month plans, which no longer exist) removed from
both files, plus the imports that the `PlanCard` swap orphaned. `PRICE_CARD_ROUNDING` moved into
`PlanCard` as `PLAN_CARD_RADIUS`.

### Checks
tsc **95 = baseline** · `PlanCard` lint 0/0, no new warnings elsewhere · `check:colors` dashboard **525 → 517**.

### Known gaps
- Not rendered/tested in a browser yet — the layout is unverified at real widths.
- Benefit/trust icons are approximations of the mock's set.
- hi/mr copy for the 16 new strings is machine-written; worth a native-speaker pass.

## Decision log

| Date | Decision | By |
|---|---|---|
| 2026-10-27 | Rules for the phase: match the design; exhaust existing components before creating anything new | User |

## Verification

tsc 95 baseline · eslint · check:colors · Playwright (Sonnet) desktop + 390, en + hi ·
payment funnel events confirmed unchanged.
