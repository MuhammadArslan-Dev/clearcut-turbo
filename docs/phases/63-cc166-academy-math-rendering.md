# Phase 63 — CC-166: question pages show raw LaTeX

**Status:** Fixed on `main` (`f672a26`, 2026-10-28). Vercel project `clearcut-turbo-blog` (= `academy.clearcutoff.in`) builds it; live check recorded below.
**Jira:** [CC-166](https://clear-cutoff.atlassian.net/browse/CC-166)
**Repo:** CM `apps/blog` — **not** the Astro repo. (An earlier version of this file wrongly pointed at the uncommitted `apps/academy` work in the Astro repo; that work is Markdown formatting + analytics scripts for Astro's `/question/[id]` page and has nothing to do with this ticket.)
**Size:** small

## What was wrong (measured on the live page before the fix)
`https://academy.clearcutoff.in/htet/level-2-tgt/subject/science/structure-of-the-atom` — 0 KaTeX spans inside options, 43 raw `$...$` in options, 35–70 raw `( n = 3 )`-style fragments, ~55 raw LaTeX commands (`\frac`, `\text`, `\left`).

Three causes, all in the blog's question-bank render path:
1. **Options were rendered as plain text.** `QuestionInteraction` receives option text as plain data, so `$H>Na>K>Li$` was shown literally.
2. **`\( … \)` / `\[ … \]` delimiters were destroyed by Markdown.** The math renderer only knew `$…$`/`$$…$$`; Markdown reads `\(` as escaped punctuation and strips the backslash, so `\( n = 3 \)` reached the page as `( n = 3 )`.
3. **Multi-line `$$ … $$` blocks.** Authors put `$$` on its own line; `remark-breaks` turned every newline into a `<br>`, splitting the span across nodes so the renderer never saw a whole `$$…$$` and left the raw LaTeX.

## Fix
- `lib/math/delimiters.ts` (new, dependency-free): `normalizeMathDelimiters` rewrites `\(…\)` → `$…$` and `\[…\]` → `$$…$$` (an escaped `\\(` is left alone). Used by `escapeMathForMarkdown` (before Markdown) and by `splitMath` (plain text).
- `lib/markdown/prepare.ts`: line breaks inside a math span become spaces before Markdown runs.
- `lib/math/katex-render.ts`: `renderMathText(text)` — plain text with math typeset as HTML (plain runs escaped), `null` when there is no math.
- `components/question-bank/question-card.tsx` (server): options with math get `html`; `question-interaction.tsx` renders it with `dangerouslySetInnerHTML` (only KaTeX output is raw), otherwise the old text path.
- `components/blog/assessment-question/section-question-card.tsx` (client variant): options wrapped in the existing `Math` component.
- Tests: `lib/math/delimiters.test.ts` (8). Blog suite 238 passed; `tsc` and `eslint` clean for the touched files.

## Verification (dev server against the production API, same page)
| | live before | local after |
|---|---|---|
| KaTeX spans | 145 | 352 |
| KaTeX spans inside options | 0 | 43 |
| raw `$…$` in options | 43 | 0 |
| raw `( n … )` | 35 | 0 |
| raw LaTeX commands (annotations excluded) | 55 | 0 |

English and Hindi pages: same zeros; at 390 px no horizontal page overflow.

## Test checklist (for Ganesh)
- [ ] Structure of the Atom page: Q1, Q2, Q3, Q6, Q7, Q12, Q13, Q15 — options and (after "reveal") explanations show typeset math, in English and Hindi.
- [ ] Another science and a maths chapter; the year pages and `/question/<id>`.
- [ ] Mobile Chrome Android / Safari iOS: long formulas stay inside their card, no page-level horizontal scroll.
- [ ] An option without math renders exactly as before (plain text, search/filter still finds it).

## Not covered
- The in-app test/practice views in the dashboard use their own components (`MathRender`); not touched here.
- A list of any questions whose stored LaTeX is itself malformed was not produced (KaTeX is run with `throwOnError: false`, so such cases show a red error span rather than breaking the card).
