# Phase 101 — Landing `/start`: Nibbu mascot redesign (UI only)

**Tickets:** (new, from user, 2026-11-12) — design: `clearcutoff-start-mascot.html` (user's prototype, Downloads)
**Repos:** CM `apps/landing` (+ additive `packages/motion/nibbu`, one design token)
**Branch:** `feature/start-mascot-redesign` — not merged, not live (user decides)
**Created / start date:** 2026-11-12
**Status:** In Progress

---

## 1. Problem / objective
Make `/start` (ad landing → OTP signup) match the prototype "same to same": Nibbu mascot stage with a speech bubble that reacts to every step (greeting, typing, wrong first digit, short number, sending, OTP, wrong OTP, resend, success + confetti), idle nudges, Step 1/2 stepper, phone field with +91 and 10 progress dots, 4-box OTP, benefit chips (videos / notes / PYQs), rating line, legal line; one screen tall on phones (keyboard-aware), a two-column card on desktop. **Logic stays exactly as today; only the UI changes; buttons use the existing `@clearcut/ui/button`.**

## 2. Scope
- **In:** `StartPage`, `StartAuthForm` render + a mascot controller; new presentational pieces under `components/pages/start/`; CSS module with tokens only; mascot lines en (Hinglish, as the prototype) / hi (Devanagari) / mr (Marathi).
- **Out (unchanged on purpose):** validation rules + their messages, 10th-digit auto-send, fake-number check, 91-prefix hint, `authApi` calls, pending `user_id`, Truecaller (Android, kept above the field), analytics event names/payloads, Meta Lead id, redirect builder, CC-84/CC-85 decisions (auto-focus except FB/IG, button always tappable, legal links new tab). The prototype's "Restart demo" and fake API are not shipped.

## 3. Implementation plan
- [ ] Nibbu from `@clearcut/motion/nibbu` (approved artwork, not redrawn); landing adds the workspace dependency. Prototype motion (wave, hop, jump, nope, lean, cheer + cap toss, blink, eyes follow) in a landing CSS module around it; eye-follow via an additive `--nib-look-x/y` on `.nibPupils` (default 0 = Topic Test unchanged).
- [ ] New token `--color-gold` (rating star / confetti / decor), everything else mapped to existing tokens (brand, brand-hover, primary-strong/soft/subtle, text-gray-normal/muted, border-gray-subtle, danger, success, success-soft, background-gray-subtle).
- [ ] `start/StartMascotStage.tsx`, `start/useStartMascot.ts` (say/mood/idle nudges/visibility/exit intent), `start/startCopy.ts` (bubble lines per locale), `start/PhoneDotsField.tsx`, `start/start.module.css`; `OtpBoxInput` gets an optional `variant="boxed"` (default = today's look; other callers unchanged).
- [ ] `StartPage` → prototype layout (phone: one screen, column; desktop ≥860×600: card with mascot panel left). `StartHero` no longer rendered (file kept for restore).
- [ ] Verify: tsc / eslint / check:colors, landing build, Playwright 390px + desktop, en/hi/mr, all bubble states, keyboard-open layout, request counts (one OTP send per number, auto-send once), Truecaller block still appears when available.

## 4. Progress / completed changes
- 2026-11-12: plan; decision below.
- 2026-11-12 built: `components/pages/start/{StartMascotStage.tsx,useStartMascot.ts,useOneScreen.ts,startCopy.ts,start.module.css}`, `StartAuthForm.tsx` (logic block untouched except: `showDone` + redirect through `finishThenGo`, en `terms`/`mobileLabel` copy as the prototype), `StartPage.tsx` (renders only the form; StartHero kept unrendered), `OtpBoxInput` `variant="boxed"` + `ok`, `--color-gold` token, `NibMascot.module.css` `--nib-look-x/y` (default 0), landing dep `@clearcut/motion` (lockfile +3 lines only — `pnpm install` also wanted to prune unrelated Sentry entries; not taken).
- Deliberate differences from the prototype: no benefit chips (prototype has their CSS/lines but no markup); no "Restart demo"/fake API; no cap toss on success (cap lives inside the locked artwork); partial-number error shows after blur/tap (prototype rule, `error` state unchanged); "Verify & Start" stays tappable and explains (CC-84) instead of disabled; Nibbu smaller than the prototype (user: "mascot chhota karo", phone ≤180 px, desktop ≤220 px, side layout ≤140 px).
- Fixes found by testing: greeting was replaced on load (the step effect ran on mount; focus line now needs a real tap/keypress); "Number verified!" never painted (state + `location.replace` in one tick) → flushSync + redirect after one frame (≤120 ms fallback for a hidden tab).

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-12 | Bubble language | en page = prototype Hinglish, hi page = Devanagari (user); mr = Marathi (Claude, same rule) |
| 2026-11-12 | Truecaller (not in the prototype) | kept, "logic wohi rahega" (Claude) |

## 6. Blockers / risks
- `/start` is the paid-ad signup page: any regression costs signups. Ships only after the user's go-ahead; consider a short A/B.
- `@clearcut/motion` was "Topic Test only" (DEVELOPMENT_RULES §1); the user's design now puts Nibbu here → update that line.

## 7. Dependencies / packages added
`@clearcut/motion` (workspace) in `apps/landing`. One token in `packages/design-tokens/tokens.css`.

## 8. Tests and verification
- [x] tsc (no errors in touched files), eslint (only the pre-existing unused `handleWhatsAppLogin`), `check:colors` ✓ (landing 109 → 108), `pnpm install --frozen-lockfile` ✓
- [x] Screenshots desktop 1440 vs prototype (near identical), phone 390/500, hi
- [x] Playwright (sonnet agent; login/verify stubbed, dashboard redirect intercepted, analytics blocked — no real OTP): greeting + idle nudge; wrong first digit; partial number (typing/pause/blur lines, no early red); bad tap = shake + 0 requests; 10th digit = exactly 1 login request → OTP step, countdown; wrong OTP = 1 verify, boxes cleared, bubble; empty verify tap explains, 0 requests; right OTP = "Number verified!" + Done + bubble rendered, navigation 51 ms later, exactly once; send 500 → "Try again" + bubble, retry +1; Change; mascot tap; 390×400 keyboard layout (field + button visible, no overflow); hi/mr strings; desktop eyes follow the mouse; 0 console errors, no hydration warning
- [ ] **Not verified:** a real phone (Android Chrome, FB/IG in-app browser, iOS Safari) incl. the real keyboard; Truecaller button on an Android with the app; real OTP SMS / WhatsApp; Amplitude events in a real run (analytics blocked in tests); the success screen screenshot (Playwright can't screenshot during a pending navigation — DOM observed instead); performance (Nibbu + CSS add to the client island — Lighthouse/CLS not measured)

## 9. Next steps
Build, verify, report; wait for the user before merging.
