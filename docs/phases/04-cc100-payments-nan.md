# Phase 04 — CC-100: "₹NaN" in Profile → Payments, plus subscription page labels

**Status:** Not Started
**Jira:** https://clear-cutoff.atlassian.net/browse/CC-100
**Repos:** CM `apps/dashboard`, BE

## What the code shows (2026-10-21)
- Flow: `ProfilePage.tsx:18-23` → `features/payment/PaymentHistoryWrap.tsx` → `PaymentHistoryTable.tsx`.
- The rows are **enrollments** (`useMyActiveCourses`). There is no payment-history API.
- **₹NaN:** the amount used to be `Number(item.exam?.price)`, and `exam.price` is a JSON string. This was fixed in `f572adf` (2026-09-19).
  - Remaining reports are probably an older deploy. **Check prod has `f572adf`.**
- **₹0.00:** the amount is forced to 0 for non-active rows. It is also 0 for autopay users between `subscription.authenticated` and the first charge, because `SubscriptionService::handleAuthenticated` (`:408-419`) never sets `price`.
- **"Payment-":** `paymentMethod` is hardcoded to `"-"` (`Wrap:62`, `Table:170-173`). `invoiceUrl` is always null.
- **Pagination bug:** the table never slices data; only the "Showing x–y" label changes.
- **"Active" badge:** a `StatusChip` soft pill next to soft action buttons, so it looks tappable.
- **Subscriptions tab** (`subscription/SubscriptionWrap.tsx`): the amount is correct (paise ÷ 100), but the labels are confusing.
  - The raw status "Authenticated" is shown as-is.
  - "Pending" is shown for an abandoned subscription.
  - The "Course" column shows the uppercase `group_code`.
  - HTET and MAHATET users see "HPTET Monthly" (shared plan 2).
- **Mixed units in the DB:** `transactions.amount` and enrollment `price` are rupees; `subscription_billing_history.amount` and `subscription_plans.amount` are paise.

## Plan
- [ ] Confirm whether prod dashboard contains `f572adf`. Ask the user to check the deployed commit.
- [!] 🛑 **D1:** build a real `GET /v2/payments/history` (successful `transactions` + `subscription_billing_history`, normalised to paise, with method, Razorpay id, date and plan)? Or just patch the enrollment-based view?
- [!] 🛑 **D2:** should non-active and trial rows appear under "Payments" at all?
- [ ] FE: hide the amount or method when unknown (never show ₹0.00 or "-"); show "Autopay setup" for mandate rows; make the status a plain label, not a pill; fix pagination slicing; translate status labels via i18n (en/hi/mr).
- [ ] FE subscription tab: plain line "अगला भुगतान: ₹99, 12 नवंबर" (`Intl` dates per locale), human status labels, course name instead of `group_code`.
- [!] ⚠️ **System impact:** a new BE endpoint (read-only, no migration). Ship the FE types with it. The RN app shows the same pages.
- [ ] 📞 **C1:** RD: which columns are wanted (invoice? method? Razorpay ID?), the status wording, whether trials are listed, and the display name for shared plan 2 (HTET/MAHATET seeing "HPTET Monthly").
- [ ] Verify: a test user with one-time + autopay + trial rows. Screenshots in en and hi, mobile and desktop. Run tsc, eslint and check:colors.

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| | | | |
