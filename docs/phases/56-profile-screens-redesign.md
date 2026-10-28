# Phase 56 — Profile / Payments / Subscriptions redesign

**Tickets:** (new, from user)
**Repos:** CM dashboard
**Status:** Current state captured in the browser; decisions needed before coding
**Created:** 2026-10-27

---

## Goal

Rebuild the three profile screens to the mocks in `docs/screens/profile/`:

- `Clear Cutoff Profile Dashboard.png` — Personal Details
- `Clear Cutoff Payments Dashboard.png` — Payments
- `ClearCutoff Subscription Dashboard.png` — Subscriptions

Same rules as phase 55: **match the design**, **exhaust existing components first**, and
**no functionality changes** — layout and presentation only unless a decision below says otherwise.

Route: `/dashboard/profile`, with `?tab=payment` and `?tab=subscription`. All three tabs already
exist; there is no separate subscriptions route.

---

## Current state (captured at 1440px, user 16404)

### Already correct — do not rebuild
- Left sidebar (Learn / Exams / Profile, Logout, "Build V 1.0 (1)").
- Blue topbar: "Hi, {name}" + phone, Help & Support, Eng.
- The profile nav card itself: all three items with their titles, subtitles and chevrons, and the
  active item highlighted. `?tab=` routing works.

### Gaps per screen

**Personal Details**
| Design | Today |
|---|---|
| "Profile / Manage your account and preferences" above the nav card | missing |
| "Personal Details / View and manage your personal information." pane heading | missing |
| Avatar hero card: big circle, name, phone, email | missing |
| "Basic Information" heading + "This information helps us personalize…" | missing |
| Six fields as a **2-column grid of tiles**, each with an icon tile, label and value | plain vertical list |
| Buttons read "Delete Account" / "Edit Details" | read "Delete" / "Edit" |
| Right pane fills the width | narrow |
| Active nav item has a blue left bar | plain fill |

**Payments**
| Design | Today |
|---|---|
| "Payments / View your course purchases and payment history." heading | missing |
| 3 stat cards: Total Purchases, Total Spent, Last Payment | missing |
| Search box + "All Payments" + "Newest First" selects | missing |
| Columns: Date, Course, Type, Amount, **Payment Method** (icon + label), **Payment ID**, **Status** badge, kebab | has Date, Course, Type, Amount, Payment only |
| "Showing 1–4 of 4" + rows/page + prev/next | missing |

**Subscriptions**
| Design | Today |
|---|---|
| "Subscriptions / View and manage your active plans and purchased courses." | "My Subscriptions (2)" |
| Current Plan hero card (crown tile, course, Active badge, purchase date, amount paid, View Course) | missing |
| Filter chips with counts: All Plans / Active / Expired / One-time / Subscriptions | missing |
| Columns: Course + plan sub-line, Type, Purchase Date, Amount, Status, **View Course** action | PLAN, COURSE, STATUS, AMOUNT, NEXT PAYMENT, ACTIONS (Cancel) |
| Pagination | missing |

---

## Data availability (checked, not assumed)

**Payments — fully buildable from what exists.** `getPaymentHistory()` → `PaymentHistoryItem`
already carries `paid_at`, `course.short_name`, `type` (`one_time`/`autopay`), `amount`,
`method` (`upi`/`card`/`netbanking`), `payment_id` (`pay_…`). The endpoint returns successful
payments only, so the design's always-"Success" status column is accurate. The three stat cards
(count, sum, latest) are derivable client-side from that same list — **no new endpoint needed**.

**Subscriptions — a mismatch.** `getSubscriptions()` → `Subscription` is strictly *recurring
autopay* (`razorpay_subscription_id`, `next_billing_at`, `plan.interval`). It has no concept of a
one-time course purchase. But the design's Subscriptions screen lists **purchased courses**: its
rows are all "One-time", its action is "View Course", and its chips read "One-time (4) /
Subscriptions (0)". Today's screen correctly shows only recurring plans — which for this test user
is 2 monthly plans, neither of them a course purchase. **This is D1 below.**

---

## Decisions needed (🛑 stop and ask)

**D1 — what feeds the Subscriptions screen?** The design wants one-time course purchases *and*
subscriptions in one list; the current endpoint only returns subscriptions.
- (a) Merge: one-time rows from `getPaymentHistory()` (it has course, amount, date, type) + recurring rows from `getSubscriptions()`. No backend change. Status per row would come from the matching enrolment.
- (b) Drive it off enrolments (`useMyActiveCourses`, which already has per-course `status` active/trial_end/expired) and merge subscriptions in for the recurring rows.
- (c) Keep it subscriptions-only and drop the one-time rows + chips from the design.

**D2 — the Cancel action.** Today each active subscription row has a working **Cancel** button
(`cancelSubscription`). The design's action column shows only "View Course" — no Cancel anywhere.
Dropping it removes a live capability, which is a functionality change.
- (a) Keep Cancel alongside View Course (design plus the existing control).
- (b) Move Cancel into the row's kebab menu.
- (c) Drop Cancel as the design shows.

**D3 — the blue footer card** (Terms / Privacy / Refund / Contact, currently under the nav card) is
absent from all three mocks. Remove it, or keep it?

---

## Steps

1. [x] Shell: "Profile / Manage your account and preferences" heading, nav-card active left bar, blue footer card removed.
2. [x] Personal Details: avatar hero + "Basic Information" tile grid.
3. [x] Payments: 3 stat cards, search + filters + sort, Payment Method / Payment ID / Status columns.
4. [x] Subscriptions: per D1-a / D2-b.
5. [x] i18n for all three screens in en / hi / mr.
6. [ ] Remaining verification: hi locale and 390 px across all three tabs.

---

## Built (2026-10-27) — steps 1–3

| File | Change |
|---|---|
| `setting-sidebar/SettingNav.tsx` | Dropped `SettingsSidebarFooter` (D3). The links stay reachable — `ProfilePage` still renders it for the `privacy` tab. |
| `setting-sidebar/SettingsSidebarNav.tsx` | Desktop-only "Profile" heading + subtitle; active item gains a brand-blue left bar. `border-l-4` is always present (transparent when inactive) so selecting never shifts the row sideways. |
| `profile/ProfileCard.tsx` | **Read-only view redesigned**; the edit form is untouched. Pane heading + the two actions moved into it, avatar hero, "Basic Information" tile grid (icon tile, label, value, inline Add for empty fields, phone spanning both columns). Labels now "Delete Account" / "Edit Details" — same handlers, same `Profile Edit Started` event, same `account-delete` modal. |
| `profile/ProfileWrap.tsx` | `max-w-[500px]` → `w-full`; the pane was a narrow column and the tiles need the width. |
| `payment/PaymentHistoryWrap.tsx` | Pane heading, 3 stat cards (count / sum / newest — all derived from the list already fetched, **no new request**), search box, type filter and sort. |
| `payment/PaymentHistoryTable.tsx` | The single "Payment" column split into **Payment Method** (icon + label) and **Payment ID**, plus a **Status** chip. Empty-state `colSpan` 5 → 7. |
| `messages/{en,hi,mr}.json` | +2 `profileMenu.heading`, +4 `profile.personalDetails.*`, +2 `actions.*`, +13 `paymentHistory.*`. Additions only. |

### Dropdowns (user request, 2026-10-27)
All three native `<select>`s (type filter, sort, rows-per-page) replaced with the shared
`@clearcut/ui/select` — the repo's existing replacement for the old Joy select, which already
carries `cursor-pointer`. Zero native selects remain on the pane. The pagination arrows got
`cursor-pointer` / `disabled:cursor-not-allowed`.

### Verified in the browser (real data, user 10158 — 8 successful payments)
Stats read Total Purchases 8 / Total Spent ₹792 / Last Payment ₹99, 25 Aug 2026. Table shows
Date, Course, Type, Amount, Payment Method (UPI + icon), Payment ID, Status chip, with
"Showing 1–5 of 8" + rows-per-page + arrows. Search "CTET" → 4 of 4; "zzzz" → empty state;
type filter and sort both change the rows (oldest 24 May 2026 ↔ newest 25 Aug 2026). The shared
Select opens, lists its options and applies the choice. Profile edit mode still opens with its
inputs, gender select and Save/Cancel intact.

## Built (2026-10-27) — step 4, Subscriptions

| File | Change |
|---|---|
| `subscription/SubscriptionWrap.tsx` | New `PlanRow` model merging **recurring plans** (`getSubscriptions`) with **one-time purchases** (`getPaymentHistory`, `type === "one_time"`), each row's Active/Expired taken from the student's enrolments — the only source that knows whether access is live (D1-a — since revised, see below). Pane heading, Current Plan hero, five counting filter chips, and the table recut to Course/Plan · Type · Purchase Date · Amount · Status · Action. New local `RowMenu` kebab holds pause/resume/cancel (D2-b); "View Course" routes to `/preparation/{group_code}`. Mobile cards rebuilt on the same row model. `STATUS_TEXT_CLASS` removed — dead once the plain-text status became a chip. |

Both extra queries (`payment-history`, `my-courses`) are already cached by the Payments tab and the
dashboard, so in practice this adds no request. `RowMenu` is local to the file and modelled on the
existing `ProfileDropdown` pattern — the repo has no generic menu primitive and no Radix.

### Behaviour: unchanged
`cancelSubscription` / `pauseSubscription` / `resumeSubscription`, `CancelFlowContent` (the CC-97
reason flow with its "pause instead" offer), `ConfirmSheet`, the toast, and the
`Subscription Status Updated` event are all still wired. Cancel was **moved, not dropped**.

### Verified in the browser
- **Subscriptions user (10158):** Current Plan hero (trophy, course, Active, purchase date, amount paid, View Course); chips All Plans (2) / Active (2) / Expired (0) / One-time (0) / Subscriptions (2); kebab opens with **Pause + Cancel**, closes on Escape; every chip filters and is `cursor: pointer`.
- **One-time user (393):** a one-time row now appears — chips All (1) / Active (0) / Expired (1) / One-time (1) / Subscriptions (0), row reads One-time · 20 Jul 2025 · ₹199 · Expired. **Before this change that student saw an empty state**, since the old screen only knew about recurring plans. No kebab on the row (nothing to cancel) and no View Course (that payment has no linked course) — both correct.

### D1 revised — split by kind (2026-10-27, user)

D1-a merged one-time purchases into the Subscriptions tab. Because the Payments tab already listed
the same one-time purchase, a one-time student saw the same row twice. **Replaced**: the two tabs
now split by kind and no longer overlap.

| Tab | Shows | Does not show |
|---|---|---|
| Payments | **one-time** payments only (stats, search, sort, table all computed over those) | autopay charges |
| Subscriptions | **autopay (recurring) plans** only | one-time purchases |

- Each tab links to the other (`features/profile/SwitchTabLink`): Payments → "Looking for your
  autopay plans? View Subscriptions", Subscriptions → "Bought a course with a one-time payment?
  View Payments" (also inside Subscriptions' empty state). It is a `<button>` calling the page's
  `onTabChange`, **not** a `<Link>`: the active tab is read from `?tab=` only once on mount
  (`useResponsiveTabs`), so a plain link would change the URL and leave the old tab showing.
  `handleTabChange` is threaded `profile/page → ProfilePage → both Wraps`.
- Removed because the split made them meaningless: the Payments type dropdown ("All Payments"),
  the Subscriptions "One-time" and "Subscriptions" chips, and the one-time branch of the row model
  (`kind`, the `"unknown"` access state). Four dead i18n keys deleted from en/hi/mr.
- **Consequence, and the fix (user approved 2026-10-27):** with the split, an autopay student's
  individual charges (date, method, Razorpay payment ID) were listed nowhere. Each plan row on
  Subscriptions now **expands** (chevron on desktop, "Show payments (n)" on mobile) to its own
  charges: date, amount, method, payment ID, status. New `PlanCharges` component, local to
  `SubscriptionWrap`; its headings and method labels reuse the `paymentHistory` messages.
  - A charge is attached to the **newest plan for its course that already existed when it was
    paid** (the history carries the course but not the subscription), so a student who cancels and
    re-subscribes does not see the same charge under both plans.
  - "Amount Paid" is now the sum of exactly the charges listed under the plan, and is **hidden**
    rather than shown as ₹0 or the cycle price while the history is unavailable.
- Verified in the browser on real data: user 10158 (2 autopay plans, 8 charges) → Payments empty +
  link, Subscriptions 2 rows, chips All 2 / Active 2 / Expired 0, link switches the tab both ways;
  user 393 (1 one-time) → Payments 1 row ₹199, Subscriptions empty state + link.

### Logic audit against the database (2026-10-27)

Wiring was verified first — Pause confirm sheet and the CC-97 cancel-reason flow both open
(neither confirmed: that would hit Razorpay), "View Course" routes to the right course
(CTET row → CTET's group code, checked in the DB), filters, search, sort, edit mode.

Then every number on screen was compared with the database for user 10158 (2 subscriptions, 8
successful transactions, 4 per course at ₹99). Three disagreed, all introduced by this phase:

| Where | Screen said | Truth | Cause → fix |
|---|---|---|---|
| Payments → "Total Purchases / Courses bought" | 8 | 2 courses | Counted payments, not courses; an autopay plan charged four times is one course. Now counts distinct courses. |
| Subscriptions hero → "Amount Paid" | ₹99 | ₹396 | Showed the plan's one-cycle price. Now sums every payment for that course (`paidByGroup`). |
| Subscriptions → Amount column | ₹99 | ambiguous | A recurring plan now reads "₹99 / month"; a one-time purchase keeps its single sum. |

And two logic fixes in how "Active / Expired" is decided: subscription rows used the plan's own
status while one-time rows used the enrolment — **two sources for one answer**. Both now read the
enrolment first (the plan status is only a fallback when no enrolment exists), and a payment with
**no linked course** shows no chip at all instead of a guessed "Expired".

Cross-tab invariant, now true: Payments "Total Spent" (₹792) = the sum of each Subscriptions row's
total paid (₹396 + ₹396). The two tabs share one `["payment-history"]` query key, so they read one
cache rather than two fetches.

**Query duplication removed:** the `payment-history` query was declared twice, with its options
(`staleTime`, `retry`, `refetchOnWindowFocus`) copied by hand. It now lives once, in
`hooks/payment/usePaymentHistory.ts` (exporting `PAYMENT_HISTORY_KEY`), and both tabs call it.
Verified in the browser: loading Payments and then switching to Subscriptions sent **one**
`/payment/history` request in total, and both tabs read the same cache (₹792 and ₹396).

**Still duplicated, not a bug:** the rupee/date formatters — `PaymentHistoryWrap`,
`PaymentHistoryTable` and `SubscriptionWrap` (`useFormatters`) each carry their own. They are
presentation only and cannot make the tabs disagree, so they were left alone.

### Checks
tsc **95 = baseline** · eslint: no new errors (one pre-existing `prefer-const` in `formatDOBInput`,
untouched) · `check:colors` dashboard **525 → 513**, no new literals. All local test tokens deleted.

### Known gaps
- hi/mr not yet viewed in the browser; 390 px not yet checked on any of the three tabs.
- The design shows a kebab on the Payments table too; it was **not** added — its menu has no defined action, and a dead control is worse than none. Say what it should do and it's a small addition.
- hi/mr copy for the ~40 new strings is machine-written; worth a native-speaker pass.

## Decision log

| Date | Decision | By |
|---|---|---|
| 2026-10-27 | Phase opened; current state captured; D1–D3 raised | — |
| 2026-10-27 | **D1-a** merge one-time rows from `getPaymentHistory()` with recurring rows from `getSubscriptions()` — no backend change; **D2-b** Cancel moves into the row's kebab menu (kept, not dropped); **D3** remove the blue footer card. Standing rules restated: match the design, and exhaust existing components before creating anything new. | User |

## Verification

tsc 95 baseline · eslint · check:colors · Playwright screenshots of all three tabs at 1440 and 390,
en + hi · existing actions (Edit, Delete Account, Cancel, tab routing) still working.

### Colour tokens (2026-10-27)
`check:colors` flagged the new charge list (+22). SubscriptionWrap's hex literals were replaced by
the tokens holding the same value (`#192839` text-gray-normal, `#40566d` text-gray-subtle, `#768ea7`
surface-gray-muted, `#f1f5fa` background-gray-subtle, `#cbd5e2` border-gray-subtle); verified the
rendered colours are unchanged. Dashboard went **525 → 427**.

- 2026-10-28: Mobile Logout row restored on the Profile page: dropping `SettingsSidebarFooter` (D3) had also removed the only mobile Logout (the sidebar is `hidden md:flex`). Extracted `MobileLogoutRow` in `SettingsSidebarFooter.tsx` and render it from `SettingNav.tsx` (`md:hidden`). Terms/Privacy card stays removed.
