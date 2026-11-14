# Phase 112 — Target subject marks display + mobile zone legend

Date: 2026-11-13. Branches: frontend `fix/target-marks-legend`, backend `fix/section-marks-display`.

## 1. Subject marks (screenshot: "0 of 2 correct · 30%" with 9/30)
**Root cause.** Not a wrong score: it is the documented formula. Confluence "Cutoff Meter - Logic & Path to Elo" §1.1: `section_accuracy = (correct + 1.5) / (attempted + 3)`, `section_marks = section_accuracy × section_total_marks` ("every section starts at 50 %, real answers pull it up or down; after ~30 answers the adjustment barely matters"; config `PRIOR_CORRECT 1.5`, `PRIOR_ATTEMPTS 3`, `CONFIDENCE_LOW 30`). 0 of 2 → (0+1.5)/(2+3) = 0.30 → 9 of 30 (the spec's own worked example gives Maths 0/1 → 0.38 → 11.3). Hindi 1 of 2 on 120 marks → 0.5 → 60/120. What was wrong was the DISPLAY: the sub-line printed the smoothed 30 % beside the raw "0 of 2 correct", and a number with 2 answers looked as earned as one with 40. No minimum-mark rule, negative marking or normalisation exists in the model (verified in `CutoffMeterService::compute`); the marks are not forced or hidden.
**Fix.** Marks / model unchanged. Each row now shows the student's own accuracy `correct/attempted` ("0 of 2 correct · 0% accuracy"), the marks from the formula with "~" while the subject has fewer than 30 answers (`estimate_below` = `confidence_low`; an estimate), a bar = marks / total, and one footnote that states the formula with the API's own numbers (`data.scoring`: prior_correct, prior_attempts, estimate_below). Backend adds `raw_accuracy` per section and `scoring` to `GET /v2/cutoff-meter/{course}`.

## 2. Mobile zone legend
Cause: the card's icon + label sat in a `flex-wrap` row, so the icon dropped above the label when the label was long ("Needs work", "Almost there", "Clear Zone") and stayed beside it when short ("Safe Zone"). Now below `md` all four are icon-above-label with a fixed 26 px label slot (two-line Hindi / Marathi labels still line the values up); `md+` keeps icon-beside-label in the 2×2 grid.

## 3. Verification (real local backend + DB, user 16404, Playwright)
- Formula vs API: 0 mismatches over every section of ≈ 400 real (user, exam, stage) meters (read-only compute): zero-correct (0 of 2 → 9/30), partial (19 of 40 → 14.3/30), fully correct (1 of 1 → 18.75/30), no answers (0 of 0 → 15/30).
- UI, 4 courses: every row equals the API (marks, bar width, percent) in en / hi / mr at 390 px; "~" exactly below 30 answers (28 and 29 → "~", 34 and 40 → none); footnote shows 50 / 1.5 / 3 / 30.
- Legend: 4 cards icon-above-label with equal label and value tops at 320, 360, 375, 390, 414, 600 px in en / hi / mr; 768 / 1024 / 1440 unchanged (2×2, icon beside label); Learn-card sheet at 390.
- Not verified: footnote hidden when every subject has ≥ 30 answers (no such course in the data), N-of-N with N > 1, a real phone / dark mode.
- One minor spill found ("~60/120" 5.6 px past the row) → marks column widened to 3.75 rem.

## 4. Follow-up (client, 2026-11-13): show the real subject marks
The "~9/30" for "0 of 2 correct" was rejected. The Target rows now show what the student actually showed in that subject: **marks = raw accuracy × subject marks**, so 0 correct → `0/30`, nothing answered → `0/30` ("Not tested yet", grey), 1 of 2 on 120 → `60/120`; never negative; bar = the same fraction. The Cutoff Meter total/gauge is unchanged (it still uses the documented spec §1.1 smoothing); a footnote says the meter score also adds the starting estimate for subjects with fewer than 30 answers, so it can be higher than the sum of the rows. Verified on course 6a9b98cb0a1cf: 0 of 2 → 0/30 (×4), 1 of 2 → 60/120.
Also: the buy widget gap above the card is now equal to the gap below it (8 px each at 390 px; measured).
