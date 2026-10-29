# Phase 59 — Practice Test results screen: match the new desktop design

**Tickets:** (new, from user) · **Repo:** CM dashboard (frontend only)
**Branch:** `feature/first-enrollment-practice-test` · **Status:** Desktop built and verified (1672/1440/1366, states 0/5 and 2/5, mobile unchanged); Hindi/Marathi not re-tested · **Created:** 2026-10-28
**Scope of this task:** the **desktop** results screen only. The mobile results screen is a separate follow-up (design: `Clear Cutoff Practice Results.png`).

## Reference
`docs/screens/practice test/Clear Cutoff Test Results Dashboard v2.png` (1672 × 941; the file the user supplied on 2026-10-28, newer than the older `Clear Cutoff Test Results Dashboard.png`, which this replaces for desktop).
Current implementation: `apps/dashboard/src/components/features/practice-test/PracticeTestResult.tsx` (+ `AnimatedScoreRing.tsx`, `PracticeFooter.tsx`, shared `attempt-ui/AttemptTopbar.tsx`).

Rules for this task (DEVELOPMENT_RULES §0/§4): reuse existing components and tokens, **no new colours** (gradients/tints built from existing tokens), explanations stay on the shared `QuestionExplanation`, i18n in en/hi/mr, no behaviour changes (scoring, rows, expand, retake, continue stay exactly as they are).

## Gap table (design vs today)

| # | Area | Design | Today | Change |
|---|---|---|---|---|
| 1 | Top bar | Logo, "UPTET – Practice Test", meta line, centred quote, **language toggle button (A文) at the far right** | Same, but no toggle on the result screen | Pass the existing language toggle (same icon/behaviour as the attempt screen) into `AttemptTopbar` `actions` when the questions have 2+ languages |
| 2 | Page background | Soft blue-white gradient with very faint hill/mountain silhouettes at the left and right | Flat `--background-gray-subtle` | Gradient from existing tokens (`--color-primary-bg-soft` → white) + faint inline-SVG hills (low opacity, `pointer-events-none`, behind content) |
| 3 | Hero heading | "Great Job, **Muhammad!**" at ~46 px bold, name in brand blue; two centred lines under it ("You have completed the practice test." / "Here's your performance summary.") | ~32 px, all one colour | `display-medium`/`display-small` token class, `<span className="text-brand">` for the name (keep the no-name variant) |
| 4 | Hero art | Gold trophy on a stack of books with a pale-blue leafy backdrop and coloured confetti diamonds, right of the heading | none | **Needs artwork** (see Decisions): an inline SVG built from existing token colours, hidden below `lg`, reduced-motion safe |
| 5 | Score card | White, ~16 px radius, no border. Ring ≈ 165 px, **thick (~14 px)** pale track, big "0 / 5" + "Score"; red chip "🏆 Keep Practicing!"; bold line "You answered 0 out of 5 questions correctly."; grey body text | Ring ~160 px, 9 px stroke, thin track; same blocks | Ring stroke 9 → ~14, track `--color-surface-gray-*` light; chip, heading and body sizes to the design; card padding 24 px |
| 6 | Score copy | "Every expert started here. Daily practice will build your confidence **and help you improve step by step.**" | "Every topper started here. Daily practice will build your confidence." | Update `result.perfKeepBody` (en/hi/mr); keep the Good / Nice-effort variants consistent in tone |
| 7 | Next Step card | A **white outer card containing a pale-blue inner card**; white round icon tile with an open-book icon; "Next Step" blue title; 3-line body; mountain-and-flag art at the right of the inner card; full-width blue "Continue to Preparation ›" at its bottom | Single blue card, no inner card, no art | Outer white `Card` + inner `--color-primary-bg-soft` rounded panel; reuse `MountainFlagIllustration` (already used by `TipCard`) |
| 8 | Stat cards | 5 equal white cards: icon circle left (blue document, **solid green circle with white ✓**, **solid red circle with white ✕**, blue clock, orange target), value ~22 px bold, label under it; the numbers sit left-aligned next to the icon | Soft-tinted circles with outline icons, smaller values | Filled success/danger icon circles (tokens `--icon-positive-*`, `--icon-negative-*`), value to `heading-medium`+, spacing per design |
| 9 | Table | Grey header band; rows with hairline separators; "Result" shows a grey **dot** + light grey "Not Attempted" text (green/red icon + coloured text for the others); "View Explanation ›" small outlined blue pill | Same structure; status text weight/colour slightly stronger | Match row height (~43 px), header band, text sizes and the lighter neutral status text |
| 10 | Footer | Full-width white bar; the two buttons **centred as a group** (outlined "↻ Retake Practice Test" ≈ 390 px, filled "Continue to Preparation ›" ≈ 424 px, both ≈ 48 px tall, pill) | Buttons span the 1100 px container in a 1fr / 1.4fr grid | `PracticeFooter` result variant: centred flex group with fixed pill widths, `lg:justify-center`; phones keep the current stacked layout |
| 11 | Content width | Content block ≈ 1405 px wide on a 1672 px screen (84 %) | `max-w-[1100px]` | `max-w-[1240px]` (≈ 84 % of 1440), horizontal padding to match; verify at 1440 and 1672 |
| 12 | Stat/time copy | "10 min 1 sec" | `result.timeValue` already renders this form | No change (verify only) |

Measured positions in the design (1672 × 941): hero heading baseline ≈ y 112; score card x 135–935, y 211–408; Next Step card x 949–1540, y 211–400; stat row y 423–509 (5 cards, 135–1540); table card y 524–855; footer bar y 868–941; content left/right margin 135 px.

## Decisions needed before building
1. **Trophy + confetti art:** no asset exists in the repo. Option A (recommended): draw it as an inline SVG from existing colours (gold from the `--color-warning*` family, blues from brand tokens; confetti diamonds from the status tokens). Option B: the user supplies an SVG/PNG export of the trophy from the design. The earlier tiger image stays excluded.
2. **Background hills:** same question — inline SVG at ~6 % opacity (recommended) or an exported asset.
3. **Logo:** the design's logo is the mock's rendering; keep the existing `MainAppLogo` unless the user says the brand mark changed.

## Implementation plan
1. `AnimatedScoreRing`: stroke/track thickness + sizes as props (defaults keep the Daily/other callers unchanged — it is Practice-Test-only today, so change in place).
2. New small presentational pieces next to the result screen only if no existing one fits: `ResultHeroArt` (trophy/confetti SVG), `ResultBackdrop` (gradient + hills). Everything else reuses `Card`, `Text`, `Button`, `MountainFlagIllustration`, `StatusChip` tones.
3. Rework `PracticeTestResult` layout/classes per the table; keep all logic (rows, `openId`, `QuestionExplanation`, retake/continue) untouched.
4. `PracticeFooter`: add a `center` variant used by the result screen.
5. i18n: `result.perfKeepBody` (+ Good/Ok bodies if reworded) in `messages/{en,hi,mr}/practiceTest.json`.
6. Docs: update the Desktop section of phase 57 and the catalog entry in `DEVELOPMENT_RULES.md` if a reusable piece is added.

## Verification (must all pass before "done")
- Playwright at **1672 × 941** and **1440 × 900**: screenshot vs the reference side by side; every measured box above within **±4 px**, text sizes/weights/colours visually identical; overlay/diff attached to the report.
- States: 0/5 (as in the design), mixed score, 5/5, a not-attempted row, expanded explanation row, long question text in the table (ellipsis), `reduced-motion`.
- No regression: scoring, one `submit`, retake, Continue, reload keeps the result, fixed footer never scrolls with content, phones (≤ 768 px) render exactly as before this task.
- `tsc`, `eslint` on touched files, `pnpm check:colors` (no new literals), `check:tour`; i18n keys present in en/hi/mr.
- English only in this round; Hindi/Marathi visual pass is a follow-up.

## Out of scope
Mobile results screen (separate task), the attempt screen, backend (no API change).


## Built (2026-10-28)
- Trophy art is a WebP (`apps/dashboard/public/images/practice-test-trophy.webp`), not SVG. Source: `docs/design-assets/practice-test-trophy.svg`; re-export with `docs/design-assets/export-trophy.js`.
- Content width `lg:w-[84%]` (max 1405px, min 980px); centred footer buttons 390/424px via `PracticeFooter align="center"`.
- Language toggle shown on the result topbar only when the questions have 2+ languages.
- i18n: `result.greatJobPrefix`/`greatJobName` replace `greatJob`; `perfKeepBody` reworded (en/hi/mr).
