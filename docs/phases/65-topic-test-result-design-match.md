# Phase 65 — Topic Test / Mini Test results: match the new design

**Tickets:** (new, from user)
**Repos:** CM (apps/dashboard) — frontend only
**Branch:** `feature/first-enrollment-practice-test` — not committed, not pushed
**Created / start date:** 2026-10-29
**Status:** In Review — built and checked in the browser (desktop 1440, mobile 390, en + hi); mr, reduced-motion and 4/4 tier not re-checked

> Reference: `C:\Users\Admin\Downloads\Topic Test Progress Summary.png` (1389 × 1132, screenshot of the modal over a dimmed page).
> Current implementation: `apps/dashboard/src/components/features/preparation/components/modal/MiniTestResult.tsx` (opened by `MiniTest.tsx` via `usePreparationModalStore`, mounted in `PreparationShell.tsx`).

---

## 1. Problem / objective
The Topic Test results modal is a plain white box (small tick, one line of text, bordered score box). The new design is a polished celebratory card: header tile + title, animated green badge with confetti, big headline + subtitle, a score card with a progress bar, side illustrations (checklist, books), and two pill buttons. Data, tiers and behaviour stay as they are.

## 2. Reference measurements (image px, modal ≈ 1217 × 1049; divide by ≈2 for CSS px)
| Area | Design |
|---|---|
| Overlay | grey-blue dim + blur of the page behind |
| Modal | white, ~24 px radius, soft blue-white background blobs (top-right, bottom-left, bottom-right) |
| Header | 76 px rounded-square pale-blue tile with a brand-blue document icon; "Topic Test" bold ~38 px dark; ✕ at the right |
| Badge | green scalloped (12-lobe) seal ≈ 175 px with a white check, soft circular halo; confetti: yellow dashes, blue/green/yellow squares + dashes around it |
| Headline | "Good progress!" ≈ 66 px extra-bold, dark navy, centred |
| Subtitle | "Keep practicing and improve with revision." ≈ 31 px, grey-blue |
| Score card | 360 × 220, pale-blue panel (~28 px radius, 1 px light border); "Score" grey; "2 / 4" ≈ 80 px bold — score in brand blue, "/" grey, total dark; 12 px pill progress bar, brand fill on pale track, fill = score/total |
| Side art | left: checklist card with 3 blue checked boxes + gold star + sparkles (x 125–410, y 590–840); right: two blue books with a gold bookmark + gold rays (x 1005–1260, y 575–805) |
| Buttons | "Continue Learning ›" filled brand pill 842 × 88; "Improve Score ↻" white pill with light-blue outline 842 × 86, bold dark text; both centred, 15 px gap |

## 3. Scope
- **In:** `MiniTestResult.tsx` layout/visuals, 3 WebP illustrations, the badge pop-in + confetti + score/progress animation, copy split into headline + subtitle (en/hi/mr), phone layout (BottomSheet) and desktop (Modal).
- **Out:** scoring/tier logic (`delta` rules, `shouldCelebrate`), the store, the mini test attempt screen, `Modal`/`BottomSheet` internals, backend, analytics. The dimmed/blurred page behind is the existing shared `Overlay` — not changed (shared by every modal).

## 4. Decisions made (no user input needed — follow DEVELOPMENT_RULES §0/§4)
1. **Illustrations are WebP**, drawn as SVG sources in `docs/design-assets/` and exported with a script (same pipeline as the Practice Test trophy, phase 59): `topic-test-badge`, `topic-test-checklist`, `topic-test-books` → `apps/dashboard/public/images/*.webp`. Hex literals live only in the SVG sources (not scanned by `check:colors`), never in components.
2. **Colours in components = tokens only**: brand `--color-brand`, soft panels `--color-primary-bg-soft` / white, text via `Text` colours, success `--color-success`, warning for gold dashes. Confetti pieces use `bg-brand`, `bg-success`, `bg-[var(--color-highlight-yellow-border)]`-style token classes (no literals).
3. **Animation: framer-motion** (already used by this file; no new dependency). Badge: scale 0 → 1.12 → 1 spring with slight rotation (-12° → 0), halo ring pulse once; check mark inside the WebP is static. Confetti: ~12 small `motion.span`s burst from the badge centre to fixed positions (transform + opacity only, no layout), 0.9 s, once. Score counts up (existing spring) and the progress bar width animates with it. Everything respects `useReducedMotion()` (final state rendered immediately). Confetti positions are fixed constants (the old `Math.random()` in render caused different output per render).
4. **Copy:** headline + subtitle per tier. `messages.{perfect,almostPerfect,goodProgress,needsPractice}` change from a string to `{ title, subtitle }`. Only this component reads them.
5. **Icons:** header document icon and refresh icon are reused/inlined from the existing icon set (`CrossIcon`, `ChevronIcon`, `CircleIcon variant="repeat"`); a document icon is added only if none exists.
6. **Responsive:** desktop `md:max-w-[608px]` Modal; phones keep the BottomSheet with the same card, side art hidden below `sm` (they would collide with the score card), badge/typography scaled down.

## 5. Implementation plan
- [x] 3 SVG sources + `docs/design-assets/build-topic-test-art.js`; WebPs in `apps/dashboard/public/images/topic-test-{badge,checklist,books}.webp` (33/47/39 KB at 2x; the badge is served through next/image at 128 px, the side art is `hidden sm:block` + lazy so phones never download it)
- [x] i18n: `modals.miniTestResult.messages.<tier>.{title,subtitle}` + `closeLabel` in en/hi/mr (spliced, every other key verified identical)
- [x] `MiniTestResult.tsx` rebuilt (header tile, badge + confetti, headline/subtitle, score card with progress bar, side art, two pill buttons)
- [x] tsc (no errors in touched files), eslint (clean), `check:colors` (no new literals)
- [x] Browser check, foreground, on a temporary preview page (deleted afterwards)
- [ ] mr visual pass, reduced-motion screenshot, 4/4 and 3/4 tiers, side-by-side diff against the reference

## 6. Progress / completed changes
- 2026-10-29: files: `MiniTestResult.tsx`, `messages/{en,hi,mr}/modals.json`, 3 WebPs, `docs/design-assets/{build-topic-test-art.js,topic-test-*.svg}`.
- Badge: scale 0 -> past 1 -> 1 spring with a slight turn; 8 confetti pieces burst out (transform/opacity only); score counts up and the bar follows; `useReducedMotion` renders the final state at once.
- Behaviour unchanged: tier by `total - correct`, Continue closes, Improve Score reopens the test.
- Modal 608 px wide on desktop (measured), buttons 421 x 44, no horizontal scroll at 390.
- The old exported `ConfettiBurst` (random positions) is gone; nothing else imported it.
- An autofocus on Continue showed a focus ring; removed, to match the design.

## 7. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-10-29 | Illustration source | Drawn SVG → WebP, same as phase 59 trophy (Claude, per brief "optimized WebP") |

## 8. Blockers / risks
- Illustrations are hand-drawn SVG approximations of the reference's 3D-style art; fidelity of shading will be close, not pixel-identical.
- Overlay blur/dim is shared by all modals; left untouched.

## 9. Dependencies / packages added
None (framer-motion, next/image already present). No env vars, no migrations.

## 10. Tests and verification
- [x] tsc · [x] eslint · [x] check:colors (blog 216, dashboard 426, landing 108, all at or below baseline)
- [x] Desktop 1440 (2/4) and mobile 390 (0/4; hi 3/4): layout matches the reference structure; hi text does not overflow
- [x] Assets: badge loads (200, served 128 px via next/image); side art not requested on phones (hidden + lazy); no console errors
- [x] Esc closes the modal; close button has a translated aria-label; progress bar has role=progressbar with values
- [!] Animation frames could not be sampled reliably (the automation tab is not focused, so requestAnimationFrame is throttled); only settled states and one mid-count frame (digit lagging the bar by a frame) were seen. Watch it once by eye.
- [ ] mr, reduced motion, 4/4 and 3/4 tiers, pixel overlay vs the reference

## 11. Next steps
Look at the animation once in a real window, then mr + reduced-motion + 4/4, then review.
