# Phase 128 — Landing FAQ section fully CMS-managed (en/hi/mr)

**Tickets:** (new, from user)
**Repos:** CM (`apps/landing`) · CMS (`D:\clearcutoff-projects\clearcut-cms`)
**Branch:** CM `phase-128-landing-faq-cms` · CMS `phase-128-cms-mr-locale` — both committed locally, **not pushed**
**Created / start date:** 2026-11-24
**Status:** Blocked – production CMS database. Code is done and checked locally. The production CMS DB is missing the phase 76 columns (and `mr`), and Coolify never runs Payload migrations, so the SQL in §6 must be run by the user before the CMS push and the content entry.

---

## 1. Problem / objective
The home-page FAQ section (`components/sections/FAQsSection.tsx`) rendered a large hardcoded `CONTENT` (4 tabs × 5 questions × en/hi/mr) whenever the CMS `faq` global was empty, which in production it always was. Goal: the CMS `faq` global is the only source of the questions, answers and tab labels, in en/hi/mr, with the same text, formatting and order. The hardcoded Q&A copy is removed.

## 2. Scope
- **In:** remove the hardcoded Q&A + tab labels; add the `mr` locale to the CMS; enter the 60 Q&As into the production CMS; `/faq` then shows real content.
- **Kept in code (user decision, not FAQ content):** eyebrow, heading, description and the "Can you actually pass the exam…" explanation card.
- **Out:** Android/iOS app-page FAQs (`appDownloadFaq.ts`), the HTET info FAQs (`htetInfo.ts`), `/faq` SEO (hreflang/canonical/hero for `mr`), adding an FAQ section to course pages.

## 3. Implementation plan
- [x] Inventory: production `faq` global = `{"categories": []}` in every locale (updated 2026-10-02). Backup: `C:\Users\Admin\AppData\Local\Temp\claude\2231dd39dcc8c357\0fe210a1-44c2-48b4-8ab1-2036f6ed4cbe\scratchpad\faq-backup\faq-{en,hi,mr,all}.json`. Live `/`, `/hi`, `/mr` all showed the hardcoded fallback; `/faq` showed "coming soon".
- [x] Which pages render the section: **only the home page** (`LandingPage.tsx`, already passes `getFaq(locale)`). `/teaching/[slug]` (`CoursePage.tsx`) has its `SectionRenderer` commented out, so the `{ type: "faqs" }` entries in `lib/data/courses.ts` are never rendered (live HTML has no `id="faqs-section"`). `/exam/*` has none.
- [x] CMS: `mr` locale + migration (branch `phase-128-cms-mr-locale`, commit `831c436`).
- [x] Landing: `FAQsSection` renders CMS only; hidden when the CMS has no category with questions.
- [x] Seed: `docs/phases/128-landing-faq-seed.py` turns the old copy (git `975fe32`) into Lexical JSON. All 60 rows checked offline with Payload's own HTML + plain-text converters (identical except `'` printed as `&#39;`).
- [!] Production DB: run §6 SQL (user, Coolify DB terminal), after a DB backup.
- [ ] Push CMS `main` → Coolify auto-deploys (webhook). Check `/api/globals/faq?locale=mr` and the admin.
- [ ] Enter the content (§6 step 4), re-fetch per locale, diff with `seed.json`.
- [ ] Playwright before/after (deployed CMS content, local landing): home en/hi/mr, `/faq` en/hi/mr, 1440 + 390.
- [ ] User approves landing push (auto-deploys). **Landing must deploy only after the content is in the CMS**, or the home FAQ section disappears.

## 4. Progress / completed changes
- 2026-11-24 — CMS `src/payload.config.ts` (+ `{ code: 'mr', label: 'Marathi' }`), `src/migrations/20261124_055500_mr_locale.{ts,json}` (up = 4× `ALTER TYPE … ADD VALUE 'mr'`), `src/migrations/index.ts`, `src/payload-types.ts`.
- 2026-11-24 — CM `apps/landing/src/components/sections/FAQsSection.tsx`: `filters` + `faqs` removed from `CONTENT` (−313 lines); tabs/items built from `categories` only; `return null` when no category has questions.
- 2026-11-24 — CM `docs/phases/128-landing-faq-seed.py` (seed generator).

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-24 | 🛑 Marathi: CMS had en/hi only | **A** — add `mr` to the CMS and migrate en/hi/mr (user) |
| 2026-11-24 | 🛑 Explanation card has no schema field | **(i)** — keep it in the component with eyebrow/heading/description (user) |
| 2026-11-24 | CMS empty or unreachable | Empty / 404 → section hidden. Unreachable → `getFaq()` throws (existing `createFetchClient` behaviour), so the build fails loudly and an ISR regeneration fails, keeping the last good page. Same as every other CMS read in `lib/api/cms.ts` (Claude) |
| 2026-11-24 | Lists | The old answers used `<br/>` + literal "1." (never `<ol>`), so each answer is one paragraph with Lexical `linebreak` nodes — identical rendering (Claude) |

## 6. Blockers / risks
- ⚠️ **The production CMS has never run a Payload migration.** Coolify builds it with Nixpacks (`next start`), so `docker-entrypoint.sh` (`payload migrate`) never runs. Container log 2026-11-04: `column faq_categories_questions__locales.question_rich does not exist`, so the phase 76 migration is not applied and the admin FAQ page cannot load or save. The local `payload_migrations` table is also out of sync (only `baseline` + `dev`), so a bare `payload migrate` would replay old migrations and fail. **Do not run `payload migrate` in production.** Apply only this SQL instead.
- **Order matters:** SQL first, then push CMS (the new code queries `_locale = 'mr'`; without the enum value every `locale=mr` read errors), then content, then landing.

**Step 1 — backup:** Coolify → CMS Postgres resource (the one `DATABASE_URL` of app `oksko0k4k80wc44kcco8004g` points to; there are two: "Stage-BD-for-CMS" and `postgresql-database-zkcw…`) → Backups → Backup now.

**Step 2 — read-only check** (psql in that DB's terminal):
```sql
SELECT version();
SELECT name, batch FROM payload_migrations ORDER BY id;
SELECT column_name FROM information_schema.columns WHERE table_name = 'faq_categories_questions_locales' ORDER BY 1;
SELECT column_name FROM information_schema.columns WHERE table_name = 'faq_categories_questions' ORDER BY 1;
SELECT t.typname, array_agg(e.enumlabel ORDER BY e.enumsortorder) FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid WHERE t.typname LIKE '%locale%' GROUP BY 1;
```

**Step 3 — apply** (additive only; idempotent; same statements as migrations `20261104_061012_faq_rich_text` and `20261124_055500_mr_locale`):
```sql
BEGIN;
ALTER TABLE "faq_categories_questions_locales" ALTER COLUMN "question" DROP NOT NULL;
ALTER TABLE "faq_categories_questions_locales" ALTER COLUMN "answer" DROP NOT NULL;
ALTER TABLE "faq_categories_questions" ADD COLUMN IF NOT EXISTS "question_html" varchar;
ALTER TABLE "faq_categories_questions" ADD COLUMN IF NOT EXISTS "answer_html" varchar;
ALTER TABLE "faq_categories_questions_locales" ADD COLUMN IF NOT EXISTS "question_rich" jsonb;
ALTER TABLE "faq_categories_questions_locales" ADD COLUMN IF NOT EXISTS "answer_rich" jsonb;
ALTER TYPE "public"."_locales" ADD VALUE IF NOT EXISTS 'mr';
ALTER TYPE "public"."enum__posts_v_published_locale" ADD VALUE IF NOT EXISTS 'mr';
ALTER TYPE "public"."enum__comparisons_v_published_locale" ADD VALUE IF NOT EXISTS 'mr';
ALTER TYPE "public"."enum__alternatives_v_published_locale" ADD VALUE IF NOT EXISTS 'mr';
INSERT INTO payload_migrations (name, batch, updated_at, created_at)
SELECT n, (SELECT COALESCE(MAX(batch), 0) + 1 FROM payload_migrations WHERE batch > 0), now(), now()
FROM (VALUES ('20261104_061012_faq_rich_text'), ('20261124_055500_mr_locale')) v(n)
WHERE NOT EXISTS (SELECT 1 FROM payload_migrations p WHERE p.name = v.n);
COMMIT;
```
(`ADD VALUE` inside a transaction needs Postgres ≥ 12; step 2 shows the version. Rollback of the columns is not needed: old code ignores them.)

**Step 4 — content** (after the CMS deploy, in a new tab of the logged-in admin): `POST /api/globals/faq?locale=en` with `categories[{key,label,questions[{questionRich,answerRich}]}]` from `seed.json`; `GET ?locale=en&depth=0` for the row ids; then `POST ?locale=hi` and `?locale=mr` with **the same category/question ids** (arrays are not localized: a POST without ids would replace the English rows).
- `/faq` changes from "coming soon" to real content + FAQPage JSON-LD once content exists (intended). `/mr/faq` will then show Marathi questions under the English hero, with an English canonical and no `mr` hreflang (`app/[locale]/faq/page.tsx`); follow-up decision.
- The CMS env has no `LANDING_REVALIDATE_URL` / `REVALIDATE_SECRET`, so a CMS save reaches landing on the 1-hour ISR window, not instantly.

## 7. Dependencies / packages added
None. One CMS migration (`20261124_055500_mr_locale`), applied in production by hand (§6).

## 8. Tests and verification
- [x] CMS: `pnpm generate:types`, `tsc --noEmit` clean. Local dev (`next dev -p 3011`, local DB `clearcut-crm`, dev push) → all 4 locale enums `{en,hi,mr}` (same as the migration's up), `GET /api/globals/faq?locale=mr` 200 with English fallback.
- [x] Seed: 60 rows (4 × 5 × 3) through `convertLexicalToHTMLAsync` + `convertLexicalToPlaintext`: HTML, plain answer and plain question identical to the old copy (5 differ only in `&#39;` for `'`).
- [x] Landing: `tsc --noEmit` clean; `eslint FAQsSection.tsx` 0 errors (1 pre-existing unused `data` warning); vitest 10 files / 46 tests pass; `pnpm check:colors` pass (landing 108, was 109); `pnpm turbo run build --filter=landing` against the production CMS passes. Built `en/hi/mr.html` have no `id="faqs-section"` (CMS empty → hidden), as designed.
- [x] Baseline: live `/`, `/hi`, `/mr` showed the hardcoded copy (curl).
- [ ] Playwright before/after with real CMS content (blocked on §6).
- [ ] **Not verified:** production DB state (step 2), CMS deploy, content entry, visual comparison, `/faq` with content, `strong` weight (`.faq-rich strong` is 600; the old JSX `<strong>` inherited the browser bold) — check in the visual pass.

## 9. Next steps
1. User: §6 steps 1–3 and send the step 2 output.
2. Merge + push CMS `phase-128-cms-mr-locale` → watch the Coolify deploy → check `locale=mr` and the admin.
3. Step 4 content, diff, Playwright, then the user approves the landing push.
