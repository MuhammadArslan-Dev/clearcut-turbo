# Phase 06 — CC-84 + CC-85: signup form fixes and the T&C link (/start)

**Status:** In Review (branch cc-84-85-signup-form; not merged)
**Jira:** [CC-84](https://clear-cutoff.atlassian.net/browse/CC-84), [CC-85](https://clear-cutoff.atlassian.net/browse/CC-85)
**Repos:** CM `apps/landing` (maybe `packages/ui/main-input`, `packages/auth/validators`), optionally ASTRO

## What the code shows (2026-10-21)

`/start` is landing only: `app/[locale]/start/page.tsx` → `StartPage.tsx` → `StartAuthForm.tsx`.
- `/mr` is real: landing has its own routing with en/hi/mr.
- The copy is inline in `CONTENT` (`StartAuthForm.tsx:73-244`), not in messages JSON.

**CC-84: why taps are dead**
- The button is `disabled={!isValidPhone || loading}` (`:765`). The shared Button has `disabled:pointer-events-none`, so taps fall through to the card and nothing happens. No error is shown.
- "+91 -" is a plain `<span>` prefix (`main-input.tsx:121-125`). The label is a `<p>`, not a `<label htmlFor>`, and the wrapper padding is not clickable. None of these focus the input.
- `type="tel"` and `inputMode="numeric"` already exist.
- Autofocus is **desktop-only on purpose** (`:323-330`): on mobile, the back gesture that closed the keyboard navigated the page back.
- **Cleaning is broken:** the input strips non-digits, then cuts to 10. Pasting "+91 98765 43210" gives "9198765432" → error. "098…" also errors.
- An **uncommitted** `useHydrated` fix (Android hydration mismatch that made taps dead until re-render) is in the working tree. Not deployed yet.
- "कोई कार्ड या भुगतान आवश्यक नहीं" is inside a card with a ShieldCheck icon, so it looks tappable.
- Possible: `crypto.randomUUID()` (`:556`) throws on old WebViews (Chrome <92) after verify.

**CC-85: T&C / Privacy**
- Both are real `<Link>` hrefs (`:881-893`). The pages exist for all 3 locales. No overlay or `preventDefault` was found.
- Probable cause (guess): tiny inline tap targets, and client navigation with no feedback on slow networks.
- Navigating away **loses the typed phone number** (local state only).
- The link labels are hardcoded English; the terms page is English-only.

**Side finding:** ASTRO `packages/ui/src/Button.astro:~108` only knows hi/en, so Marathi go-page CTAs open the English `/start`. Fixed in Phase 08.

## Plan
- [x] Keep the submit button enabled except while loading. On tap, validate and show a red error under the field ("10 अंकों का मोबाइल नंबर डालें" + en/mr) and focus the field.
- [x] Shared `normalizeIndianMobileInput()` in `@clearcut/auth/validators`: digits only, leading 0s off, "91" off when longer than 10 digits, **then** cut to 10. On type and paste (the HTML maxLength is dropped for these fields, it cut pastes first).
- [x] "+91" stays plain text inside the field; the whole field box is a `<label>` (`MainInput focusOnTap`), caption is `<label htmlFor>`, `autoComplete="tel-national"`.
- [x] "No card needed" is a plain small line (no box/icon) on /start and in the modal.
- [x] T&C/Privacy on /start: new tab, ~44px tap targets (padding + negative margin, text doesn't move), hi/mr labels and sentence endings. Modal links (already new tab): bigger tap targets.
- [x] `createLeadId()` (`@clearcut/auth/redirect`) replaces `crypto.randomUUID()` in /start, otp-screen and inline flow.
- [x] Found while doing D4: the onboarding inline flow's "Get my selection plan" button was `onClick={() => {}}` and disabled — only the 10-digit auto-submit ever sent the OTP. Now it submits, with the same empty/wrong-number message.
- [!] 🛑 **D1:** mobile autofocus: re-enable it (brings back the back-gesture problem), only outside FB/IG in-app browsers, or keep it desktop-only?
- [!] 🛑 **D2:** "always responds": keep or remove the 10-digit auto-submit?
- [!] 🛑 **D3:** change shared `MainInput` (affects every input in blog, landing and tools), or add an opt-in prop used only by /start? Rule: additive change, default = old behaviour.
- [!] 🛑 **D4:** apply the same fixes to `packages/auth` login-screen and inline-auth-flow (the modal login) for consistency?
- [!] 🛑 **D5:** T&C: new tab (`target="_blank"`, keeps the form) or bottom sheet (needs the legal HTML pulled into a shared component)?
- [!] ⚠️ **System impact:** `packages/ui/main-input` and `packages/auth/validators` are shared by blog, landing and tools. Verify landing login, blog login and tools login after the change.
- [ ] 📞 **C1:** RD: final en/hi/mr copy for the phone error.
- [ ] 📞 **C2:** RD: bottom sheet or new tab? Hindi/Marathi labels for the links? Do the legal pages themselves need translation?
- [ ] 📞 **C3:** RD: the trial box under the form: remove it, or restyle it as plain text?
- [ ] Verify: Android Chrome + FB in-app browser (via the user/screenshots). Paste "+91 98765 43210" and "09876543210". Tap anywhere on the field. Tap the button with an empty number. Check en/hi/mr. Run tsc, eslint and check:colors.

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| 2026-10-22 | D1 | Autofocus on arrival everywhere except FB/IG in-app browsers (UA check, not useIsMobile — that is false during hydration, so the old "desktop-only" focus also ran on mobile) | User |
| 2026-10-22 | D2 | Keep the 10-digit auto-submit | User |
| 2026-10-22 | D3 | Additive opt-in props on shared `MainInput` (`normalizeValue`, `focusOnTap`); default unchanged | Claude (per rule §5) |
| 2026-10-22 | D4 | Same fixes in the login modal (login-screen) and the onboarding inline flow. Modal autofocus unchanged (it opens on a tap) | User |
| 2026-10-22 | D5 | New tab | User |
| 2026-10-22 | Copy | Drafted, RD to confirm: errEnter10 en "Enter your 10-digit mobile number" / hi "10 अंकों का मोबाइल नंबर डालें" / mr "10 अंकी मोबाईल नंबर टाका"; links hi "नियम और शर्तें" / "गोपनीयता नीति" (+ "से सहमत हूँ।"), mr "अटी व शर्ती" / "गोपनीयता धोरण" (+ "यांना सहमत आहे."). Modal + inline stay English (as before). Legal pages themselves still English-only | Claude |
