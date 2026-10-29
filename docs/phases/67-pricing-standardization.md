# Phase 67 — Standardize displayed prices and payment-plan configuration (₹99 / ₹139 / ₹699)

**Repos:** CM (`apps/dashboard`, `apps/landing`), Astro marketing repo (`/go`, separate repo), backend (read-only audit)
**Status:** **Plan / audit only — waiting for answers in §6.** No code, backend, Razorpay or production data has been changed.
**Created:** 2026-10-29 · **Worktree:** `clearcut-master-exp` (branch from `main`), the main worktree's uncommitted work is untouched.

## 1. Request (from the user)
- One Month Auto Pay → Subscription/Plan ID **1** (₹99).
- One Month (one-time) → **₹139**.
- One Year → **₹699** (the first message said "₹69 and ₹99"; the user then wrote "One Year: ₹699").
- Make every displayed price consistent (₹149 / ₹249 / similar → ₹99 where it means the monthly autopay price), keep unrelated prices, tell promotional (strike-through) prices from payable ones.
- Do not guess mappings, silently change backend plan ids, Razorpay config or real charge amounts; no real charges, no production data changes, no deploy without approval.

## 2. How a price becomes a charge today (traced)
Single source in the dashboard: `lib/payment/examPriceOverrides.ts` (`getPriceForVariant`, `getSubscriptionPlanId`), used by the payment page, `MainPaywall`, `PreparationPaywall`, `PaywallFloatingWidget`, `MyCourseCard`, test cards.

| Card (variant) | What the UI shows | What is actually charged | Where the amount comes from |
|---|---|---|---|
| One Month Auto Pay (`1month`) | `recurringMonthly` of the exam override, else ₹99 | The **Razorpay Plan** behind `plan_id` (`subscription_plans.amount`, paise). The UI number is display/tracking only | `createSubscription({ plan_id: getSubscriptionPlanId(exam) })` → backend only validates `exists:subscription_plans,id` → Razorpay subscription for that plan |
| One Month one-time (`1month-onetime`) | override `onetime1Month`, else `GET /v2/payment/pricing` → `onetime_1month_price`, else 139 | **The amount the browser sends** (`createPayment.amount`; backend only subtracts a pending referral discount) | frontend |
| One Year (`1year`) | override `oneYear`, else `pricing.onetime_1year_price`, else 599 | same: the amount the browser sends | frontend; default comes from the backend `settings` row `payment.onetime_1year_price` |

Current values (dashboard `EXAM_PRICE_OVERRIDES` + defaults):

| Exam | Autopay (plan id → ₹) | One-time 1 month | One year |
|---|---|---|---|
| default (CTET etc.) | 1 → ₹99 | ₹139 (setting) | ₹599 (setting) |
| HTET, HPTET, MAHATET | 2 → ₹149 | ₹229 | ₹799 |
| UGC | 3 → ₹249 | ₹449 | ₹1999 |

Local DB: `subscription_plans` id 1 = 9900 paise (₹99, Razorpay `plan_SolYoYK3ICtmrp`), id 2 = 14900 (₹149). Plan 3 is not in the local DB (production only). `settings`: `payment.onetime_1month_price = 139`, `payment.onetime_1year_price = 599`. **Production values were not read** and must be confirmed by the owner.

## 3. Every price found (audit)
Payable (drives a charge):
- `dashboard/lib/payment/examPriceOverrides.ts` — the table above, defaults 99 / 139 / 599.
- `dashboard/.../payment/initiated/page.tsx` — three `PlanCard`s all read `getPriceForVariant`; `plan_id` from `getSubscriptionPlanId`.
- Backend `PaymentController::pricing()` fallbacks 139 / 599, `PricingSettingsSeeder` 139 / 599; `SubscriptionController::create` (plan must exist).

Displayed only (marketing, no charge):
- `landing/.../coursr-marketing-page.tsx:415` — `data === 'ugcnet' || data === 'hptet' ? ₹149 : ₹99` (mahatet / htet missing: **drift**).
- `go-marketing/.../exam/[slug].astro:150` — `ugcnet || hptet || mahatet ? 149 : 99` (htet missing; also the JSON-LD `price`).
- `landing/.../PricingSection.tsx:142` `price={99}`; `landing/.../exam/[slug]/page.tsx:102` JSON-LD `price: "99"`.
- FAQ and comparison copy "₹99" (landing `FAQsSection.tsx`, `ComparisonTable.tsx`, go `i18n/copy.ts`, en/hi/mr).
- Strike-through (promotional, never charged): `₹1,499` on the payment page monthly cards, `₹1299` on landing / go sticky bars.

Unrelated, left alone: blog article marketing text (`DummyData.ts` ₹999 / ₹699 / ₹499 / "Fees ₹20,000+"), referral reward ₹200, landing `staticExams.ts` 499/900 (legacy test data, not shown to buyers as far as found), tools.
Not reachable from this repo: Payload CMS content (`CMS_URL`) may carry prices of its own.

## 4. Proposed implementation (after §6 is answered)
1. `examPriceOverrides.ts`: remove the per-exam price/plan overrides (or re-point them to the agreed values) so autopay uses plan **1** everywhere; set the agreed one-time / one-year values; keep one function as the only place that decides.
2. Landing + go: replace the per-exam ₹149 rules and static ₹99 strings with one constant (the agreed autopay price); strike-through stays promotional.
3. Tests for the price table (Vitest, new for dashboard `examPriceOverrides`), tsc / eslint / `check:colors`, Playwright pass on the payment page (payload `plan_id`, amounts) with Razorpay mocked — **no real charge**.
4. Docs: this file, `DEVELOPMENT_RULES.md` (one price source), phases README.

## 5. Risks / conflicts found
- **Autopay ₹99 for HTET / HPTET / MAHATET / UGC drops ₹149 / ₹249** — a real revenue change; plan 1 exists (₹99), so it is frontend-only, but it also re-creates what the removed phase-66 offer did, for everyone.
- **Annual ₹699 raises the default exams from ₹599 and lowers HTET/HPTET/MAHATET (₹799) and UGC (₹1999).**
- The default one-time and annual prices live in the backend `settings` table. The frontend cannot change them without either ignoring the setting (hardcoding) or someone changing the production row (a live payment-config change that needs explicit approval).
- The backend trusts the browser's one-time `amount` and `plan_id` (pre-existing gap, see `DEVELOPMENT_RULES §10`). Displayed = charged therefore holds only as long as the frontend is the only caller; not changed here.
- `/go` lives in another repo and deploys separately.

## 6. Open questions (blocking)
1. Does ₹99 / ₹139 / ₹699 apply to **all exams** (including HTET, HPTET, MAHATET, UGC), or only some?
2. How should the default annual price become ₹699: hardcode in the frontend (admin setting ignored), or the owner updates `payment.onetime_1year_price` in production and the frontend follows the API?
3. Include the `/go` Astro repo and the landing app in this change, and is the CMS content checked by the owner?

## 8. Decisions and follow-up (2026-10-29)
- Answers: ₹99 / ₹139 / ₹699 apply to **all exams**; the annual default is a frontend constant **and** the owner sets production `payment.onetime_1year_price` = 699; landing and `/go` change too (separate commits).
- Page feedback on `/payment/initiated`: the struck-through "original" prices are **₹299** beside the autopay card, **₹499** beside the one-time 1-month card and **₹999** beside the 1-year card (was ₹1,499 on both monthly cards and none on the year). They live as `ORIGINAL_AUTOPAY_PRICE` / `ORIGINAL_1MONTH_PRICE` / `ORIGINAL_1YEAR_PRICE` in `examPriceOverrides.ts`, are promotional only and never sent to the backend. Landing / `/go` keep their own ₹1299 strike-through (not requested).

## 7. Verification log
(empty — nothing implemented yet)
