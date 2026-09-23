# Database

**This repository has no database, ORM, migrations or schema files.** All persistent server-side data lives in other systems:

| System | Holds | Where it is defined |
|---|---|---|
| Laravel main backend | Users, exams, levels, courses, enrolments, tests/attempts, payments, subscriptions, streaks, syllabus | Separate repo (not analysed here) |
| Payload CMS | Posts, comparisons, alternatives, FAQ, global sections, marketing proof | Separate repo (not analysed here) |
| Laravel tools backend | Resizer exam specs | Separate repo (not analysed here) |

For the real schema, read those repositories' migrations/collections. Nothing below should be treated as the schema — it is only what this repo's TypeScript types and client code reveal.

## Data shapes visible from this repo's types

- **Syllabus** (`apps/tools/src/lib/api/syllabusApi.ts`): `SyllabusExam {id, exam_id, short_name, name, state, exam_type, logo_url}`, `SyllabusLevel {id, name, name_en, parent_id, group}`, `SyllabusChapter {id, name, order}`; tree = `Record<subject, SyllabusChapter[]>`. Responses use an envelope `{status: "success"|"error", message, data}`.
- **Levels** (`apps/dashboard/src/lib/api/onboarding.ts`): `Level {id, entity, exam_id, group, name, parent_id, status, slug, translation: {[lang]: {name, group, detail}}}`.
- **Profile update payload** (`apps/dashboard/src/lib/api/profile.ts`): `name, gender (lower-cased or null), dob, email, phone`.
- **Resizer specs** (`apps/tools/src/lib/api/toolsApi.ts`): per exam `photoSpec` / `signatureSpec {format, widthPx, heightPx, minSizeKB, maxSizeKB}` and `officialRequirements`.
- Backend behaviour noted in code comments: `enrollment/customization` and `payment/checkout-initiated` are deduped server-side to one record per (user, course).

## Client-side storage (the only data this repo persists)

| Key | Kind | Where | Purpose |
|---|---|---|---|
| `auth_token` | Cookie, HttpOnly, `sameSite=lax`, 7 days | Set by dashboard `POST /api/auth/login` | Server-side/route-handler auth (`/api/profile` reads it) |
| `auth_token` | Cookie (JS-set) + localStorage | `apps/dashboard/src/lib/auth-token-client.ts` | Client auth token; cleared and redirected to login on 401 |
| `onboarding-storage` | localStorage (Zustand persist) | `apps/dashboard/src/store/onboarding/useOnboardingStore.ts` | Onboarding selections |
| `exam-store` | localStorage (Zustand persist) | `apps/dashboard/src/components/features/exam/store/useExamStore.ts` | In-progress exam state |
| `UPCOMING_COURSE`, `is_new_user`, `ONBOARDING_START`, `course`, `locale` | localStorage | Dashboard onboarding components, blog/landing language handling | Flow flags and selected course/language |
| Syllabus Tracker progress | localStorage | `apps/tools` (per `SYLLABUS_TRACKER_PLAN.md`: "nothing gets written to the database, ever") | Chapter check-offs; exact key not verified |

Stores created through `createPersistedStore` (`packages/state`) always use `skipHydration: true` and are hydrated explicitly with `useHydrateStore`.

Duplicates named `useExamStore copy 2.ts` / `copy 3.ts` also use `persist` but look like leftover copies.
