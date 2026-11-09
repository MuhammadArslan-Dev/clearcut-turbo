# Phase 76 — Rich text (bold, blue, links) for FAQ questions and answers

**Tickets:** (new, from user)
**Repos:** CMS (`D:\clearcutoff-projects\clearcut-cms`) · CM (`apps/landing`)
**Branch:** `feature/faq-rich-text` in the CMS repo; landing changes are uncommitted on `feature/practice-test-flag` (the rest of that tree is unrelated WIP) — nothing committed or pushed
**Created / start date:** 2026-11-04
**Status:** In Review — built and verified end to end on a local DB clone (CMS admin + landing, desktop and mobile); not committed, not deployed. Waiting for: user review, CMS prod DB backup + migration, deploy order CMS then landing

> Phase 75 is taken by `feature/phase-75-payment-recovery` (worktree `clearcut-master-p75`), so this is 76.

---

## 1. Problem / objective
Editors want bold text, blue text and clickable links inside FAQ questions and answers on `clearcutoff.in/faqs` (the route is `/faq`; `/faqs` is not a route in this repo, see section 6). Today the CMS `Faq` global stores `question` as `text` and `answer` as `textarea` (plain text, line breaks kept with `whitespace-pre-line`), so no formatting is possible.

## 2. What the inspection found (2026-11-04)
- **CMS** `src/globals/Faq.ts`: global `faq` → `categories[]` (`key`, `label` localized) → `questions[]` (`question` text localized required, `answer` textarea localized required). en + hi only (mr falls back to en on the page). Tables created in `src/migrations/20260905_051125.ts` (`faq_categories_questions_locales` holds both strings).
- **Editor:** Lexical (`lexicalEditor()` in `payload.config.ts`, `@payloadcms/richtext-lexical` 3.85.2). Already used by `Alternatives.introBody` and `Posts.content`, each with a virtual `lexicalHTMLField` (`*_html`, `storeInDB: false`) so the frontend never needs Lexical. That is the pattern to reuse.
- **Blue text:** Lexical has no colour feature by default. `TextStateFeature` exists in 3.85.2 (marked *experimental*) and stores a key like `color: "blue"` on the text node, with the CSS defined in config. The default HTML converter does **not** emit textState, so a small custom text converter is needed. Not yet proven → spike in phase A.
- **Frontend** `apps/landing`: `getFaq(locale)` (`lib/api/cms.ts`, revalidate 3600 + `/api/revalidate` webhook) → `app/[locale]/faq/page.tsx` → `FaqPageContent.tsx` → shared `FAQAccordion.tsx`. `FaqQuestion` is `{question: string; answer: string}` in `types/cms.ts`.
- **Things that read the plain strings and must keep working:**
  1. accordion title (`<Text as="p">`) and content (`whitespace-pre-line`);
  2. in-page search (`question`/`answer` `.toLowerCase().includes`);
  3. deep-link anchor `slugify(question)` (`#category-question-words`), so the question text must not change shape;
  4. `FAQPage` JSON-LD (`name`, `acceptedAnswer.text`) built from every question;
  5. home page `components/sections/FAQsSection.tsx`, which also renders `FaqCategory[]` from the CMS.
- **Existing HTML renderer:** `components/shared/article/ArticleBody.tsx` styles CMS HTML via child selectors (`[&_a]:text-brand [&_a]:underline`); there is no typography plugin and the codebase has settled on `dangerouslySetInnerHTML` of CMS-controlled HTML.
- **Brand blue tokens** (`packages/design-tokens/tokens.css`): `--color-brand #0083ff`, `--color-brand-dark #0053a2`, `--color-brand-accessible #0069cc` (the token made for blue *text* on white, because `#0083ff` is too light for body text).
- **Existing data:** the live CMS (`payloadcms.clearcutoff.in/api/globals/faq`, en and hi) currently has **0 categories**, and live `/faq` shows "FAQs are coming soon". So production has no FAQ rows to lose. Local/dev databases may hold rows, so compatibility is still designed in (section 3, phase B).

## 3. Scope
- **In:** CMS rich-text fields for question and answer with a small toolbar (bold, blue, link, plus the minimum needed to keep paragraphs and lists); migration; HTML output fields; landing rendering on `/faq` and the home FAQ section; blue + link styling from existing tokens; schema/search/anchor compatibility; tests; this doc kept current.
- **Out:** italics/underline/headings/images/tables/colours other than blue; redesigning the FAQ page; mr translation; any change to URLs, metadata, hreflang or canonical; Payload/Next upgrades; new npm packages (everything needed is already in `@payloadcms/richtext-lexical`).

## 4. Implementation plan
Order matters: **CMS ships and migrates first, landing second.** Landing must work against both the old and the new CMS shape so either deploy order is safe.

### Phase A — Spike (no repo changes beyond a scratch test)
- [x] A1. In the CMS repo, prove `TextStateFeature` (one `color` key, one value `blue`) saves, reloads in the admin, and that a custom `text` converter in `lexicalHTMLField({ converters })` emits `<span class="faq-blue">…</span>` (and still emits `<strong>` and `<a href target rel>`).
- [x] A2 (not needed). If textState or its converter is unreliable, fall back to a small custom inline feature storing a `blue` flag; decide with the user before building it (new decision D5).

### Phase B — CMS schema and data compatibility (additive only)
- [x] B1. In `src/globals/Faq.ts` keep `question` and `answer` exactly as they are (plain text, still localized) and add `questionRich` and `answerRich` (`richText`, localized, `lexicalEditor` with a restricted feature list: bold, link with `newTab` + `rel`, `TextStateFeature` blue, paragraph; lists only for `answerRich`; question rich is a single paragraph, no lists). A shared helper `src/fields/faqEditor.ts` holds the feature list so both fields use one definition.
- [x] B2. Make legacy `question`/`answer` **not required** and add an `admin.condition` that shows them only when the rich field is empty, with a description: "Legacy plain text. Kept so old content still shows; edit in the rich field above." Editors see one box for new content; old rows are never wiped.
- [x] B3. Add `lexicalHTMLField` outputs `questionRich_html`, `answerRich_html` (`storeInDB: false`) with the blue converter, and a computed **`question` text fallback hook** (`beforeChange` or a virtual field) so the plain `question` string used for the slug, search and JSON-LD is derived from `questionRich` when present. Rule: plain text is never deleted or overwritten when it is the only content.
- [x] B4. `afterChange` hook on the global calling landing's existing `POST /api/revalidate` (path default `/faq`, `/hi/faq`; the route's own comment already expects this hook, none exists yet). Env: `LANDING_REVALIDATE_URL`, `REVALIDATE_SECRET` (same secret the route reads).
- [x] B5. Generate migration (`pnpm payload migrate:create`) → new columns/tables only (jsonb for rich fields, relax NOT NULL on the legacy columns). Review SQL by hand: no `DROP`, no `ALTER ... TYPE` on existing columns. Run `pnpm generate:types`.
- [x] B6. Data safety check before and after migrating a copy of the DB: row counts for `faq_categories_questions` and `_locales`, and a diff of every legacy `question`/`answer` string (must be identical). Take a DB backup before the production migration.

### Phase C — Landing rendering
- [x] C1. `types/cms.ts`: extend `FaqQuestion` with optional `questionRich_html`, `answerRich_html`; keep `question`/`answer` (the API always returns the plain fallback).
- [x] C2. New small shared component `components/shared/RichFaqText.tsx`: takes `html` or plain `text`; plain text renders exactly as today (`whitespace-pre-line`), HTML renders with `dangerouslySetInnerHTML` inside one wrapper that styles `strong`, `a`, `ul/ol`, `p`, and `.faq-blue` using the existing tokens (`text-brand-accessible` for blue and for links, underline on links, focus ring) — no new colours; styles go in `globals.css` or child selectors following `ArticleBody`. Links keep `target="_blank" rel="noopener noreferrer"` for external, none for same-site paths.
- [x] C3. `FAQAccordion.tsx` already accepts `ReactNode` title/content: `FaqPageContent.tsx` and `FAQsSection.tsx` pass `<RichFaqText>` when HTML exists, else the plain string. Title uses inline-only HTML (no block margins inside `<summary>`). Clicking a link inside `<summary>` must not toggle the accordion (stop propagation for `a`).
- [x] C4. Search and anchors keep using the plain `question`/`answer` strings (never the HTML) so deep links and search results behave exactly as before.
- [x] C5. JSON-LD: keep `name` = plain question; `acceptedAnswer.text` = the HTML (Google allows `a`, `b`, `strong`, `p`, `ul`, `li`, `br` in FAQ answers) when rich exists, else plain. Decision D4.
- [x] C6. No change to `generateMetadata`, canonical, hreflang, URLs, `revalidate = 3600`.

### Phase D — Verify and document
- [x] D1. CMS: create + edit + save a FAQ with bold, blue, a link, a mixed sentence, and an untouched legacy plain-text row; reload the admin; check the REST output (`/api/globals/faq?locale=en`) for `*_html`.
- [x] D2. Landing against local CMS: `/faq` and `/hi/faq`, desktop (1280) + mobile (390): rendering, link click, link inside the open accordion, blue contrast, search, deep link `#key-question`, tab switching; home page FAQ section; no hydration warnings; JSON-LD validity.
- [x] D3. `pnpm --filter landing typecheck/lint`, `pnpm check:colors`, CMS `pnpm lint`, `pnpm generate:types` clean, CMS int tests if any touch `faq`.
- [x] D4. Update this doc + tracker row, add the pattern to `DEVELOPMENT_RULES.md` (CMS richText + `*_html` + `RichFaqText`).

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-04 | 🛑 **D1 Storage.** | **Additive rich fields next to the old plain ones** (user: "pick what is best, check the official docs"). Payload's own docs advise against storing converted HTML, so the HTML is a virtual `lexicalHTMLField` (`storeInDB: false`), the same as `Posts`/`Alternatives`. |
| 2026-11-04 | 🛑 **D2 Question formatting.** | Rich question too (single line, bold/blue/link) as the request says; a plain-text copy is derived for slugs/search/JSON-LD. |
| 2026-11-04 | 🛑 **D3 Blue.** | `--color-brand-accessible #0069cc`. `tokens.css` documents it as the token for blue *text* (5.39:1 on white; `#0083ff` is 3.69:1). |
| 2026-11-04 | 🛑 **D4 JSON-LD.** | HTML in `acceptedAnswer.text` (with the blue `<span>` stripped, since Google lists only `a, b, strong, p, ul, ol, li, br`); plain `name`. |
| 2026-11-04 | 🛑 **D5 Blue storage.** | Spike passed with `TextStateFeature` (official Payload feature, stores `"$": {"color": "blue"}` on the text node) plus a custom `text` HTML converter; no custom node needed. |
| 2026-11-04 | 🛑 **D6 `/faqs`.** | Treated `/faq` as the page. No `/faqs` route exists, nothing to preserve. |

## 6. Blockers / risks
- ⚠️ **CMS production DB migration** (additive). Needs a backup, and the CMS deploy must go before landing. Landing ignores the new fields when absent, so the reverse order is also safe.
- ⚠️ `TextStateFeature` is experimental in Payload 3.85.2: pin the version, keep the spike result in this doc, and keep blue's stored value a plain string key (`blue`) so a later change of implementation only touches the converter.
- ⚠️ The live FAQ has no content today. Editors will create it fresh, but `/faq` then goes from "coming soon" to real content, which changes the indexed page and the JSON-LD. That is the intended effect, but say so to the user before the first real content is published.
- HTML from the CMS is rendered with `dangerouslySetInnerHTML`. It is editor-controlled (admin login) and produced by Payload's converter from a restricted feature set, same trust model as `ArticleBody`; no user-submitted HTML reaches it.
- Revalidation hook needs the landing `REVALIDATE_SECRET` set in the CMS env; until then the page refreshes on the 1-hour window.
- Home FAQ section (`FAQsSection.tsx`) consumes the same data, so it is in scope for rendering.

## 7. Dependencies / packages added
None expected (`@payloadcms/richtext-lexical` already installed; `TextStateFeature`, `lexicalHTMLField` ship with it). New CMS env: `LANDING_REVALIDATE_URL`, `REVALIDATE_SECRET`. One additive CMS migration.

## 8. Tests and verification
Everything below ran against a **clone** of the local CMS DB (`clearcut_crm_faq`, 26 legacy questions × en/hi) with a local-only test admin; the user's own local DB, and production, were not touched.
- [x] Spike A: `TextStateFeature` + custom `text` converter saves, reloads and emits `<span class="faq-blue">`; bold → `<strong>`; link → `<a href rel="noopener noreferrer" target="_blank">`; `javascript:` URL → `#`; `<script>` is escaped.
- [x] Migration `20261104_061012_faq_rich_text`: additive SQL reviewed (4 new columns, 2 `DROP NOT NULL`; no DROP/ALTER TYPE). Applied to the clone; all 52 legacy rows (26 × en/hi) read back identical (`question`/`answer` unchanged, `questionText`/`answerText` equal them, `*Html` empty).
- [x] CMS admin, Playwright (sonnet subagent): legacy rows show plain fields, no validation errors; new rows show only the rich editors; toolbar = Bold, Link, Blue dropdown (+ Ordered/Unordered list in answers only), nothing else; link drawer = Custom URL + new tab only; bold/blue/link/list persist across save + reload; API returns the expected `*Html`/`*Text`.
- [x] Found and fixed: a `hi` save was blocked by "Enter the question" on rows with no Hindi text → rich-field validation now only enforces English (other locales fall back to English). Verified a Hindi update then saves.
- [x] Landing `/faq`, `/hi/faq`, `/mr/faq`, home FAQ section, Playwright desktop 1280 + mobile 390 (sonnet subagent, 13 checks): all PASS — formatting, `rgb(0,105,204)` blue and links, external link `target=_blank rel=noopener`, relative link without target, list bullets, long URL wraps (no horizontal scroll), title link opens a popup without toggling the accordion, default-open + tab switching, search (plain text, no raw tags), deep links, server-rendered HTML contains the formatting, title/canonical/hreflang unchanged, JSON-LD valid (29 = API total; HTML answers without `<span>`; legacy answers identical), focus ring on links, Enter toggles `<summary>`.
- [x] `pnpm --filter landing exec tsc --noEmit`, `eslint` on the changed landing files, `pnpm check:colors` (no new colours), vitest `src/lib/api/faq.test.ts` (8 tests: normalisation, legacy fallback, unwrap/clean HTML). CMS `tsc --noEmit` and prettier clean.
- [ ] CMS `pnpm lint` could not run: `@eslint/eslintrc` is missing from that repo's `node_modules` (environment issue, not from this change).
- [ ] Production check after deploy: create one real FAQ in the CMS and view `/faq` and `/hi/faq`.

## 9. Next steps
1. User reviews the changes (CMS repo + landing diff).
2. Take a CMS prod DB backup, deploy CMS (runs the additive migration), set `LANDING_REVALIDATE_URL` + `REVALIDATE_SECRET` in the CMS env, then deploy landing.
3. Create one real FAQ in the CMS admin and check `/faq` and `/hi/faq`.
4. Decide whether to fix the Hindi `slugify` issue (section 11).

## 10. Progress log
- 2026-11-04 — CMS (`clearcut-cms`, branch `feature/faq-rich-text`, uncommitted): `src/fields/faqRichText.ts` (shared editor features, blue text state, HTML converter, plain-text virtual field), `src/globals/Faq.ts` (rich + legacy fields, `afterChange` revalidate hook), `src/hooks/revalidateFaqPage.ts`, migration `20261104_061012_faq_rich_text`, regenerated `payload-types.ts` + `importMap.js`.
- 2026-11-04 — Landing (uncommitted): `src/types/cms.ts` (`FaqQuestion` + raw type), `src/lib/api/cms.ts` (`getFaq` → `normalizeFaq`), new `src/components/shared/RichFaqText.tsx` (`unwrapRichHtml`), `src/styles/globals.css` (`.faq-rich`), `FaqPageContent.tsx`, `FAQsSection.tsx`, `app/[locale]/faq/page.tsx` (JSON-LD), `src/lib/api/faq.test.ts`.
- Design: the CMS always returns `questionText`/`answerText` (plain, derived from rich text, else the legacy field) next to `questionHtml`/`answerHtml`, so search, slugs and JSON-LD never see HTML. `getFaq` falls back to `question`/`answer` when talking to an older CMS, so either side can deploy first.

## 11. Findings not caused by this change (not fixed here)
- `/hi/faq`: `slugify()` in `FaqPageContent.tsx` strips Devanagari (`\w` is ASCII-only), so most Hindi rows get the same id (`refund-`): duplicate React keys + a hydration warning in the console, and Hindi deep links are ambiguous. `slugify` is not in this diff and the ids are existing URLs, so fixing it (needs a unicode-aware slug and a decision about already-shared Hindi links) is a separate task.
- Landing dev with Turbopack served a stale stylesheet once (no `.faq-rich` rules); `next dev --webpack` served it correctly, and compiling `globals.css` through PostCSS emits the rules. Local cache issue; if blue ever looks missing in dev, restart with `.next` cleared.
- Local port 3100 is used by an unrelated project on this machine.
