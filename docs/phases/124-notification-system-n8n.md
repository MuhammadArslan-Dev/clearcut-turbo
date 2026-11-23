# Phase 124 — Notification system driven by n8n (daily task reminders, continue learning, custom pushes, token expiry)

**Tickets:** (new, from user)
**Repos:** BE (`C:\laragon\www\clearcutoff-main-backend`) · RN (`E:\React Native\ClearCutoff-App - New`) · CM (`apps/dashboard`) · n8n (`n8n.clearcutoff.in`)
**Branch:** `phase-124-notification-system` (clearcut-master, this doc only). No backend/RN branch yet. Not committed, not pushed.
**Created / start date:** 2026-11-23
**Status:** In progress — backend + dashboard implemented and tested on branch `phase-124-notification-system` in both repos (uncommitted, not pushed, not deployed). RN part waits for the splash branch. The user's clarified requirements (§0 below) override the plan wherever they differ. No n8n workflow was changed and no real notification was sent.

## 0. Clarified requirements and what was built (2026-11-23)

User decisions that replace the open items in §5: no new last-page tracking (reuse resume state); exactly ONE course per user = the dashboard's active course; clear the dashboard token only on an explicit 401; **D1 rejected** — reuse the existing `automation.key` / `AUTOMATION_API_KEY` (no new keys, no `automation_clients`, committed default left as is and listed as a security limitation); IST (Asia/Kolkata) for everything, **no `users.timezone` migration**; a Daily Task counts as attempted only after a COMPLETED attempt (D3 = no); one reminder per user per slot per IST day (D4 = per user, active course only); keep all history; validated `data.deep_link_path`; fix DL-1.

**No migrations, no new tables, no new packages.** Duplicate protection = the existing UNIQUE `notifications.dedupe_key` + the existing UNIQUE `daily_test_reminders(assignment, slot, channel)`; request idempotency = `Idempotency-Key` header stored in the cache for 48 h.

Backend (`C:\laragon\www\clearcutoff-main-backend`, branch `phase-124-notification-system`):
- `POST /api/v2/automation/notifications/daily-task-reminders` — `{slot: morning|missed(=evening), cursor?, limit?<=500, dry_run?, identifiers?}`; 422 `outside_slot_window` outside 06:00-08:00 / 18:00-20:00 IST (`NOTIFY_DAILY_TASK_*`); paged by `next_cursor`.
- `POST /api/v2/automation/notifications/continue-learning` — `{identifiers<=500, inactive_days 1-365, dry_run?}`; `dry_run` is the status lookup.
- `POST /api/v2/automation/notifications/send` — `{identifiers, campaign_key, title, body (string or {en,hi,mr}), deep_link (required), once_per?, type?, image?, dry_run?}`.
- `POST /api/v2/automation/notifications/validate-target` — `{deep_link}`.
- Services: `Enrollment\ActiveCourse` (shared with `CourseRepository::getMyActiveCourses`), `Notifications\{CourseDeepLinks, DeepLinkTarget, NotificationCopy, AutomationNotificationWriter, DailyTaskReminderService, ContinueLearningService, CustomNotificationService}`, `Automation\UserIdentifierResolver`, `Support\IndianPhone`, middleware `automation.idempotent`.
- `PersonalizedDailyTestService`: DL-1 fixed (enrollment uuid + daily test uuid) for the 08:00 live push and the old reminders; one shared completed-attempt rule (`completedAssignmentIds`).
- `ExpoPushService`: `NOTIFY_PUSH_DRIVER=log` sends nothing; no automatic resend after a timeout.
- Legacy `/v2/notifications/{send,multiple,broadcast}`: `data.deep_link_path` validated (422), validation errors no longer turned into 500, request bodies no longer logged, `/multiple` uses `IndianPhone`.

Dashboard (`apps/dashboard`, this branch): `lib/courseLinks.ts` (+ `course-deep-links.json` contract shared with the backend, `TodayGoalsCard.goalHref` uses it), `lib/auth-failure.ts`, `lib/api/client.ts` (`SessionExpiredError`), `providers/AuthProvider.tsx` (`authError`, `retryAuth`), `components/features/auth/ProtectedPage.tsx` (Try again card instead of the redirect). The Preparation page already applied `chapter` / `topic` from the URL (Sidebar.tsx, phase 109) — DL-3 was outdated, no change needed.

Known difference (not changed, per the user): the Daily Tests card (`DailyTestController::exams()` `attempted_today`) counts any completed attempt of the test, ever; reminders count only a completed attempt made after today's assignment.

> Builds on the push deep-link audit of 2026-11-23 (`C:\Users\Admin\AppData\Local\Temp\claude\2231dd39dcc8c357\0fe210a1-44c2-48b4-8ab1-2036f6ed4cbe\scratchpad\push-deeplink-audit.md`, "the deep-link audit" below). Its issue numbers (DL-1 … DL-11) are referenced, not repeated.
> Evidence is `file:line` on: BE `main` @ 156b202, CM `main` @ 5a9ff81, RN working tree on `feat/splash-10b` (another agent's branch; read only, no git state changed). Data facts are read-only SELECTs on the local `clearcut` DB (not production), 2026-11-23.

---

## 1. Problem / objective

ClearCutOff needs one scalable notification system in which **n8n only schedules and triggers**, and the **backend decides who gets what** (eligibility, copy, deep link, duplicates). Six requirements from the user:

1. **Daily Task reminders** at 06:00 and 18:00 in the user's local time, only when today's assigned task is not attempted; the 06:00 one names the task and course, the 18:00 one is a "missed" reminder.
2. **Continue Your Learning API** for n8n: look up users by phone/uuid/id (single or bulk, mixed), return active course, last learning activity/page and days inactive against a per-request threshold, and trigger a personalised re-engagement push.
3. **Custom / test notifications** with an exact destination URL, validated against approved hosts and supported dashboard routes, never silently falling back to Dashboard; one payload contract plus a mapping for the old `screen` values.
4. **Token expiry:** dashboard (and the RN app) clear the token only on an explicit auth rejection; network errors, timeouts and 5xx keep the token and retry / show an error.
5. **n8n API design:** documented endpoints, single + bulk, schemas, validation, a dedicated machine credential, rate limits, idempotency, per-user/type/day duplicate protection, minimal personal data.
6. **Copy** in en/hi/mr and a full message catalogue.

## 2. Scope

- **In:** audit (§A), compatibility check (§B), endpoint design (§C), DB changes (§D), backend / RN / dashboard change lists (§E–§G), n8n workflow designs (§H), message catalogue (§I), test plan (§J), rollout, flags, risks, decisions.
- **Out (explicitly not doing in this phase):** WhatsApp/SMS/email channels (the design keeps `channels` open for them); iOS push (APNs still on hold, memory `project_rn_app_ios_push_setup`); a user-facing notification-preferences screen; the phase-64 enrollment-table switch (paused); fixing the unrelated security findings in §A.10 (listed so the user can decide, not fixed here); any production send.

---

## A. Current architecture audit (evidence)

### A.1 Push sending pipeline (BE)
| What | Evidence |
|---|---|
| Single entry point for every push: queued job, `$tries = 3`, backoff 10/60/300 s, no named queue (prod worker only consumes `default`) | `app/Jobs/Notification/SendAppPushNotificationJob.php:29-33`, constructor comment |
| Job creates one `notifications` row per user via `NotificationService::create` (dedupe by `dedupe_key` = `"{prefix}:{user_id}"`, only when the caller passes `dedupe_key_prefix`), then `NotificationDispatcher::dispatch` | same file, `handle()`; `app/Services/Notifications/NotificationService.php` (exists-check + catch 23000) |
| Dispatcher fans out to channels from `config/notifications.php` (`push` → `PushNotificationChannel`, `web` → `WebNotificationChannel`), writes `delivery_status`, `status`, `sent_at` | `app/Services/Notifications/NotificationDispatcher.php`; `config/notifications.php` |
| Push channel = "handed to Expo", not "delivered" | `app/Services/Notifications/Channels/PushNotificationChannel.php` |
| Expo call: `POST https://exp.host/--/api/v2/push/send`, chunked, `data = {title, body, ...metadata}`, `richContent.image`, **no Expo access token, no `channelId`, no dry-run/fake transport**, `Http::retry(2, 500)` | `app/Services/ExpoPushService.php:20-22, 45-70` |
| Dead-token cleanup: immediate on `DeviceNotRegistered`/`MismatchSenderId`, and receipts every 30 min | `ExpoPushService.php:124, 147-192`; `routes/console.php:50` |
| Future-dated rows dispatched every 5 min | `routes/console.php:56`, `app/Console/Commands/DispatchDueNotifications.php` |
| Laravel-scheduled "Daily Test is Live!" push at 08:00 IST | `routes/console.php:43` → `PersonalizedDailyTestService::sendDailyTestNotifications` (`:792-851`) |

### A.2 Expo token storage
- `push_tokens` (user_id, token **unique**, platform, last_used_at), one user → many devices; legacy `users.expo_push_token` left unused — `database/migrations/2026_09_29_130000_create_push_tokens_table.php`.
- Save/delete: `POST /v2/notifications/save-token` (`updateOrCreate` keyed by token, platform `ios|android`), `DELETE /v2/notifications/token` — `routes/Apis/V2/data.php:131-137`, `app/Http/Controllers/AppPushNotificationController.php:29-97`.
- RN registers on login and unregisters on logout — `services/notificationService.ts:11, 31, 214`; `context/AuthContext.tsx:9`.
- Local data: 715 tokens, 572 `android`, 143 `platform NULL`, 0 iOS.
- **No timezone, locale or app version is stored with the token.**

### A.3 Notification log tables
| Table | Purpose | Evidence / local rows |
|---|---|---|
| `notifications` | One row per (recipient, event). `type` free string, `channels` JSON, `audience_type`, `batch_uuid`, `metadata` (= push `data`), `delivery_status` JSON, `status`, **`dedupe_key` UNIQUE**, `scheduled_at`, `sent_at`, `read` | `2026_09_29_140000_upgrade_notifications_table_for_multi_channel.php`; 8 rows (all `daily_test_live`, admin sends with `screen`) |
| `daily_test_reminders` | One row per (assignment, slot, channel); **UNIQUE(assignment, slot, channel)**; status `sent / skipped_no_token / failed` | `2026_09_24_000000_create_daily_test_reminders_table.php`; **0 rows** (reminders never ran locally) |
| `push_ticket_receipts` | Expo ticket ids for the receipts sweep | `2026_09_29_130100_create_push_ticket_receipts_table.php` |
| `daily_test_assignments.notified_at` | Idempotency for the 08:00 "live" push | `PersonalizedDailyTestService.php:797-846` |
| `users.metadata.reminder` (`step, count, next_at, last_sent_at`) | Old n8n WhatsApp reminder state | `app/Services/Auth/UserService.php:22`; ~13.8k users locally |
| n8n Data Table `push_campaign_log` | The only duplicate guard for cohort pushes today (backend has none for custom sends) | n8n workflow `Campaign Push via Amplitude Cohort` (§A.9) |

### A.4 Daily test assignment ("today's assignment")
- One `daily_test_assignments` row per **(user, exam, test_date)**, UNIQUE — `PersonalizedDailyTestService.php:46-57, 596-599`. A user with N active exams gets N assignments a day (452 such users locally).
- "Today" = `now(config('daily_test.timezone'))` = **Asia/Kolkata for everyone** — `PersonalizedDailyTestService.php:112-115`; `config/daily_test.php` (`DAILY_TEST_TIMEZONE`, default `Asia/Kolkata`).
- Created by: n8n `POST /v2/automation/daily-tests/generate` (`routes/Apis/V2/automation.php:31`), the enrollment hook, and the read-side fallback `DailyTestController::ensureTodaysTest` (`app/Http/Controllers/API/V2/DailyTestController.php:101-116`). The n8n workflow "Daily Test Generation 4 AM IST" is **inactive**.
- Eligible enrollment = `u_exam_enrollments` with `stage_id` set and status not in `dropped, expired, cleared` (`PersonalizedDailyTestService.php:110, 636-641`). The task name lives in `daily_tests.meta` (`section_name`, `chapter_name`), the course in `exams.short_name` + the enrollment's stage.
- Local data: assignments 2026-09-19 … 2026-11-21 (5,243 rows).

### A.5 Attempt tracking
- `daily_test_attempts` (uuid, user, daily_test, attempt_number, status `in_progress|completed`, started_at, completed_at), UNIQUE(user, daily_test, attempt_number). Local: 884 completed, 275 in progress.
- **Two different "attempted" rules exist today:**
  - reminders: a completed attempt with `completed_at >= assignment.created_at` — `PersonalizedDailyTestService.php:892-896`;
  - the Daily Tests list card: **any** completed attempt of that `daily_test_id`, ever — `DailyTestController.php:188-191`. Daily test content is shared and re-used across rotation laps, so the card can show "attempted" for a test done weeks ago.

### A.6 Enrollments / active course
- Live table is `u_exam_enrollments` (`last_accessed_at` max 2026-11-21); `u_enrollments` is the paused phase-64 target (`last_accessed_at` max 2026-05-20). Memory `project_enrollment_table_migration`: go through the `UExamEnrollment` model only.
- A **course** = rows sharing `group_code`; a paper/level = one row (`stage_id`). Dashboard "current course" = enrollment ordered by `last_accessed_at` (`app/Http/Controllers/API/V2/DashboardController.php:39-75`, `changeCourse` stamps the whole group). The paper the user was last active in = `App\Services\Enrollment\LastActivePaper` (phase 106).
- `/preparation/{courseId}` accepts the enrollment uuid **or** `group_code` (`app/Services/Preparation/PreparationService.php:13-26`). `/daily-test-attempt/{courseId}/{testId}` needs the **enrollment uuid** + **daily test uuid** (DL-1).
- Language per enrollment: `u_exam_enrollments.language` = english 16,582 / hindi 821 / marathi 81 / punjabi 5. **There is no user-level UI language.**

### A.7 Last-activity tracking (what exists)
| Signal | Meaning | Local freshness | Usable? |
|---|---|---|---|
| `user_course_resume_states` (user, course_id = group_code, mode `learning|test-series`, paper/section/chapter/topic ids, last_accessed_at) | last learning **position** per course | max 2026-11-19, 10,473 users | **Yes** — "last page" for learning |
| `user_streaks` (user, activity_date, minutes_spent), UNIQUE(user, date) | a learning day | max 2026-11-20 | **Yes** — day-level activity |
| `user_learning_interactions.interaction_at` | video/notes/quiz events | max 2026-11-19 | Yes |
| `daily_test_attempts`, `exam_attempts`, `meter_history` (TEST_SUBMIT) | tests taken | current | Yes |
| `personal_access_tokens.last_used_at` | any authenticated API call (≈ "last seen", incl. app open) | max 2026-11-21 | Yes, as `last_seen_at` only |
| `u_exam_enrollments.last_accessed_at` | course switch / enrollment touch | current | Weak |
| `user_time_logs` (page, duration) | page time | **dead since 2026-02-17** | No |
| Page views (dashboard home, payments, profile) | — | **not stored anywhere in the backend** (Amplitude only) | No |

All of these have a `user_id`-leading index, so per-user lookups are cheap; a "scan every user inactive ≥ N days" audience query is not.

### A.8 Timezone
- **Not stored per user.** `users` has no timezone column (schema read 2026-11-23); nothing in `push_tokens`. App, DB and daily-test timezone are all Asia/Kolkata / +05:30 (`config/app.php:71`, `config/database.php:60,85`, `config/daily_test.php`).

### A.9 Auth / token handling and existing automation access
**Backend**
- Sanctum tokens expire **14400 min = 10 days after creation** (`config/sanctum.php:50`); `expires_at` is never set (0 rows). Not sliding: an active user is cut off on day 10 regardless.
- Expired / invalid token → `AuthenticationException` → **401 `{"message":"Unauthenticated."}`** for `api/*` (`bootstrap/app.php:101-106`).
- **403 is also used for paywall / content access**, not only auth (`DailyTestController`, `PreparationController`, `ExamController`, `GuardsTopicAccess`, `EnsureAdminUser`; 26 sites). So "clear the token on any 403" would log out every free user who taps a locked topic.
- Machine auth: one shared static key, header `X-Api-Key`, `hash_equals` — `app/Http/Middleware/VerifyAutomationApiKey.php`; alias `automation.key` (`bootstrap/app.php:53`). **`config/services.php:100` ships a real-looking default key in the repo**, so an environment missing `AUTOMATION_API_KEY` accepts the committed value. No abilities, no per-client keys, no audit of which client called.
- Rate limit: every `api` route runs `throttle:api` (`bootstrap/app.php:41-48`); a request without a user token (n8n) gets **60/min per IP** (`app/Providers/RouteServiceProvider.php:30-55`).
- Phones are stored as `+91XXXXXXXXXX`, column `varchar(20)` **UNIQUE** (`database/migrations/0001_01_01_000000_create_users_table.php:19`); login normalises with `'+91'.preg_replace('/\D/','',…)` and `^\+91[6-9]\d{9}$` (`app/Http/Requests/Auth/LoginRequest.php:22,35`). Local: 21,850 match the pattern, 9 junk, 2 NULL.

**Existing push / automation endpoints**
| Endpoint | Auth | Notes |
|---|---|---|
| `POST /v2/notifications/send` (`user_id` int) | `automation.key` | `data` = free-form array, no target validation; no dedupe; validation failures are caught as `Exception` → **500** and the full request is logged — `AppPushNotificationController.php:167-230` |
| `POST /v2/notifications/multiple` (`users[]` ids or phones, max 100) | `automation.key` | phone normalisation only prepends `+91` (`"09876…"`, `"91 98…"` fail) — `:287-305`; 200 even if only some users have tokens, no per-user result |
| `POST /v2/notifications/broadcast` | `automation.key` | every user with a token; returns the exception message on 500 — `:232-285` |
| `POST /v2/automation/daily-tests/send-reminders` (`slot`, `channels`, `date?`) | `automation.key` | synchronous over all of today's assignments in one HTTP request, per-row `exists()` queries, 1 push per (user, exam), IST date only — `DailyTestAdminController.php:209-233`, `PersonalizedDailyTestService.php:880-1032` |
| `POST /v2/automation/daily-tests/{pregenerate,generate}`, `GET …/runs/{run}` | `automation.key` | 202 + run polling pattern already exists (`automation.php:20-35`) |
| `GET /v2/admin/unverified-users`, `POST …/reserve|confirm` | `automation.key` | **mints a full-ability `automation-login` Sanctum token per user per call** and returns it (`app/Services/UnverifiedUserReportService.php:57`; `WhatsappFollowupService.php:46`) → **168,071 such tokens** locally |
| `GET /v1/auth/reminder/users`, `GET /v1/auth/reminder/check`, `POST /v1/auth/reminder/update` | **none** | `/reminder/users` returns full `User` models of everyone due (`routes/Apis/V1/authapi.php:42-44`, `V1/Auth/AuthController.php:316-345`) |

**n8n (read via the n8n MCP, nothing changed)**
| Workflow | Active | Uses |
|---|---|---|
| Daily Test Reminders (Push) `e7yppSm6tXxwvC0E` | no (live_mode false) | `send-reminders`, slots morning **11:00** + evening 18:00, `api_base` = apptest |
| Campaign Push via Amplitude Cohort `Vbiw9ESEjiqXT6uS` | no (test mode) | Amplitude cohort → `/v2/notifications/multiple` in chunks of 100, `data.deep_link_path`, own `push_campaign_log` data table as the only duplicate guard |
| Daily Test Generation 4 AM IST `S3vuGdhIObtNAST6` | no | pregenerate + generate |
| Day Wise `avmwWjkgiIXbWtv0` | **yes** | schedule "Evening Today Signups" (66 nodes; probably the V1 reminder / WhatsApp journey — not opened, see §8 Not verified) |
| WhatsApp bot, cohort → WhatsApp workflows | yes | Authkey WhatsApp, not push |

**Dashboard (CM)**
- `AuthProvider` clears the token and cached user on **any** `getMeApi` failure, including network errors and 5xx — `apps/dashboard/src/providers/AuthProvider.tsx:144-152`. Then `ProtectedPage` sends the user to `https://clearcutoff.in` — `apps/dashboard/src/components/features/auth/ProtectedPage.tsx:37`.
- `apiFetch`: a 401 on **any** request → `redirectToLogin()` (clear + `https://clearcutoff.in`) — `apps/dashboard/src/lib/api/client.ts:127-131`, `src/lib/auth-token-client.ts:94-100`. Network failures become `ApiError{status:0,isNetworkError:true}`; `fetchWithRetry` retries network errors once, never 5xx (`src/lib/api/fetchWithRetry.ts`). 403 is not special-cased (correct, see paywall note).
- `src/components/Server Component/AuthClientProvider.tsx:36` also clears on logout (old provider, `/sign-in` email page — legacy, not the live login).

**RN app**
- Native API layer logs out **only on 401** (and skips pre-auth endpoints and deliberate logouts) — `services/apiService.ts:93-117`. Correct already.
- But any WebView navigation to a marketing origin is treated as logout — `components/AppWebView.tsx:225-233` — so the dashboard's "redirect on any getMe failure" becomes a **native logout on a network blip** (DL-6).
- Session restore trusts a stored token without validating; a profile failure keeps a placeholder user — `context/AuthContext.tsx:49-90`.
- Tap handling, late listeners, stale last-response replay, no locale, `screen` ignored: DL-2, DL-4, DL-5, DL-7 (`app/(app)/home.tsx:44-53, 219`; `hooks/useNotifications.ts:52-107`).
- Analytics already sent: `Notification Received` / `Tapped` / `Dismissed` / `Permission Result` with `deep_link_path`, `trigger_context`, `notification_category` — `hooks/useNotifications.ts:58-83`, `app/(app)/home.tsx:131`.
- `expo-localization` is not installed (`package.json`); `expo-updates ~57.0.12` present (EAS Update possible for JS-only changes).

### A.10 Security / correctness findings met during the audit (not fixed here)
| # | Finding | Evidence | Proposed |
|---|---|---|---|
| S1 | Committed default automation key (and health-check token) | `config/services.php:90, 100` | Remove defaults (fail closed), rotate the production key, move n8n to per-client keys (§C.1) |
| S2 | Unauthenticated V1 reminder endpoints return full user rows | `routes/Apis/V1/authapi.php:42-44`; `V1/Auth/AuthController.php:332-345` | Put behind `automation.key`, return whitelisted fields; check what `Day Wise` calls first |
| S3 | Reports mint a full-ability login token per user per call (168k tokens) | `UnverifiedUserReportService.php:57` | New API never returns tokens; separate decision for the report |
| S4 | Push endpoints turn validation errors into 500 and log the full request body | `AppPushNotificationController.php:220-229, 274-283` | Fixed as part of §E.4 (let `ValidationException` through) |
| S5 | Duplicate-send paths: Expo `retry(2)` after a timeout can resend an accepted batch; `/multiple`/`/broadcast` have no dedupe, so an n8n retry double-sends; a job retry after a mid-loop exception re-sends to users already done when `dedupe_key` is null; `daily_test_reminders` is written `sent` before the queued job runs | `ExpoPushService.php:64-66`; `AppPushNotificationController.php`; `SendAppPushNotificationJob::handle`; `PersonalizedDailyTestService.php:913-922` | §C.6 (rows created synchronously with dedupe keys, dispatch by id, no transport retry on timeout) |
| S6 | Daily-test push links are numeric and 404 (DL-1) | `PersonalizedDailyTestService.php:835, 1023` | §E.3 |

---

## B. Compatibility check — each proposed contract vs current schema and code

| Requirement / contract | Supported by today's data? | Gap → needs |
|---|---|---|
| 06:00 / 18:00 **local** time | **No.** No per-user timezone anywhere (A.8) | Migration `users.timezone` (+ `timezone_updated_at`); RN and dashboard report it; until filled, everyone = Asia/Kolkata. Effectively all current users are in India, so day-one behaviour = IST |
| "Today's assignment" for the user's local date | Partly. Assignments are keyed by the **IST** date (A.4) | For a non-IST user, the local date can differ from the IST date for a few hours. v1: local date = IST date for IST users (all of today's users). For other timezones the reminder service calls the existing `generateDailyTestForUserExam($user, $exam, $localDate)` (bounded, idempotent). No migration |
| "Attempted today's task" | Yes, but two rules disagree (A.5) | One shared rule (`DailyTaskState::attempted($assignment)` = completed attempt with `completed_at >= assignment.created_at`), used by reminders **and** `DailyTestController::exams()`. Decision D3 on whether `in_progress` counts |
| Name the active task and course | Yes: `daily_tests.meta.section_name/chapter_name`, `exams.short_name` + `translation`, stage name | none |
| One reminder per user per slot | **No.** One push per (user, exam) today | Group per user in the new service (multi-task copy, §I); dedupe key per user (D4) |
| Deep link to the attempt | **No** (numeric ids, DL-1) | Build from enrollment uuid + daily test uuid (`dailyTest.uuid`, eager-loaded) |
| Phone lookup with/without +91, 0, spaces, dashes | Yes: all valid phones stored `+91XXXXXXXXXX`, UNIQUE index (A.9) | Normaliser only (no migration); 9 junk rows simply never match |
| Lookup by uuid / user id | Yes: `users.uuid` UNIQUE, `users.id` PK | none. Note `users.user_id` (varchar "CL-…") also exists and is mostly NULL — not accepted as an identifier (D11) |
| Active course | Yes (`u_exam_enrollments` + `LastActivePaper`) | Reuse `LastActivePaper` + the dashboard's `last_accessed_at` rule; do not invent a third rule |
| Last learning activity / page | **Partly.** Last *learning position* yes (resume state); literal last *page* (home, payments, profile) **no** — not stored (A.7) | v1 returns `last_activity.kind` + learning position + deep link. A real "last page" needs a new write path (D7) |
| Days inactive, threshold per request | Yes, computed from MAX over A.7 signals | For bulk audiences (not a given list) a `user_activity_summaries` table (D8, phase 2) |
| Personalised re-engagement push | Yes (pipeline A.1) | New service + copy + dedupe/cooldown |
| Exact destination URL, validated | **No** validation; `screen` ignored by app (DL-2) | Route allowlist + host allowlist (§C.5); app reads `deep_link_path` only; server maps `screen` |
| Locale-correct landing page | **No** (DL-7) | Backend prefixes `/hi` / `/mr` from the enrollment language (D5) |
| Clear token only on explicit auth failure | Backend returns a clean 401 (A.9). **403 is not an auth signal here** | Dashboard: clear on 401 only (+ a future explicit `code:"auth_revoked"` 403 if the backend ever adds one). No backend change needed for v1 |
| Dedicated n8n credential with abilities | **No** (one shared key, committed default) | New `automation_clients` table + middleware (D1) |
| Idempotency key | **No** | New `automation_idempotency_keys` table |
| Per-user, per-type, per-day unique log | **Yes, reusable:** `notifications.dedupe_key` UNIQUE + `daily_test_reminders` UNIQUE | Defined key formats (§C.6); no new log table. Add index `(receiver_id, type, created_at)` for caps/cooldowns |
| Rate limits for n8n | Falls into 60/min per IP | Named limiter `automation` keyed by client |
| Expo dry-run in tests | **No** fake transport | `PushTransport` interface + `log` driver; tests use `Http::fake()` |
| Production data matches local | **Unknown** — every count above is local | §8 Not verified |

---

## C. Proposed API (all under `/api/v2/automation`, `ApiResponse` envelope `{status, message, data}`)

### C.1 Auth, abilities, rate limits, errors
- **Credential:** header `X-Api-Key: <client key>`. Keys live hashed (`sha256`) in `automation_clients` with `name` (e.g. `n8n-prod`), `abilities` JSON, `rate_limit_per_min`, `allowed_ips` (optional), `last_used_at`, `revoked_at`. Middleware `automation.client:<ability>` resolves the client, checks the ability, stamps `last_used_at`, sets `request()->attributes['automation_client']`. The old `automation.key` keeps working for the old routes during migration (D1).
- **Abilities:** `users:read`, `activity:read`, `notifications:send`, `notifications:send-bulk`, `daily-tasks:run`, `notifications:test` (test sends to an allowlist only).
- **Rate limits** (`RateLimiter::for('automation')`, keyed `automation:{client_id}`): reads 120 req/min; sends 30 req/min; each request capped at **500 identifiers**; `429` with `Retry-After`. The global `throttle:api` (60/min per IP) must not apply to these routes (they get the named limiter instead).
- **Error codes** (HTTP + `data.error_code`):

| HTTP | error_code | When |
|---|---|---|
| 401 | `unauthorized` | missing / wrong / revoked key |
| 403 | `ability_missing` | key valid, ability not granted |
| 409 | `idempotency_conflict` | same `Idempotency-Key`, different body |
| 409 | `run_in_progress` | a daily-task run for the same slot/window is still running |
| 422 | `validation_failed` | schema errors (`data.errors` per field) |
| 422 | `too_many_identifiers` | > 500 |
| 422 | `target_not_supported` / `target_host_not_allowed` / `target_param_invalid` | §C.5 |
| 429 | `rate_limited` | limiter |
| 503 | `feature_disabled` | the feature flag for that endpoint is off |
| 500 | `internal_error` | never echoes exception text |

Per-user problems are **not** request errors: they come back per item with a `status` (`not_found`, `ambiguous`, `no_push_token`, `not_eligible`, `duplicate`, `cooldown`, `target_unresolvable`, `queued`, `would_send`).

### C.2 Identifier contract (all endpoints that take users)
```json
"identifiers": [
  {"type": "phone", "value": "098765 43210"},
  {"type": "uuid",  "value": "9b2f…"},
  {"type": "user_id", "value": 1234},
  "+91 98765-43210",
  4321
]
```
- Typed objects are preferred. Bare values are auto-detected: JSON integer → `user_id`; uuid regex → `uuid`; otherwise phone.
- **Phone normaliser** (one helper, `App\Support\IndianPhone::normalize`, reused by `/v2/notifications/multiple`): strip everything but digits and a leading `+`; then `+91XXXXXXXXXX` → ok; `0091…` / `91` + 10 digits (12 digits) → last 10; `0` + 10 digits → last 10; 10 digits → as is; result must match `^[6-9]\d{9}$`, stored form `+91` + 10. Anything else → item `status: invalid_identifier`.
- Exact indexed lookups only (`users.phone`, `users.uuid`, `users.id`), soft-deleted users excluded. Duplicates in the input are collapsed; results keep `input_index` so n8n can join back.
- **Minimal data:** responses return `user_uuid` and the derived fields below. Never name, phone, email, numeric id (unless the input was that id), or a login token.

### C.3 Endpoints

| # | Method + path | Ability | Purpose |
|---|---|---|---|
| E1 | `POST /automation/users/resolve` | `users:read` | identifiers → user_uuid + `has_push_token` |
| E2 | `POST /automation/users/learning-status` | `activity:read` | active course, last activity, days inactive vs `inactive_days`, eligibility |
| E3 | `POST /automation/notifications/continue-learning` | `notifications:send` (+`-bulk` if > 1) | personalised re-engagement push (or `dry_run`) |
| E4 | `POST /automation/daily-tasks/reminders` | `daily-tasks:run` | hourly run; backend picks users whose local time is in the slot window and who have not attempted today's task |
| E5 | `POST /automation/daily-tasks/status` | `activity:read` | for given identifiers: today's task(s) and attempted yes/no (n8n debugging, support) |
| E6 | `POST /automation/notifications/send` | `notifications:send` / `-bulk` / `test` | custom or test push with a validated destination |
| E7 | `GET /automation/notifications/runs/{run_uuid}` | any send/run ability | progress + counts of an async run / batch |
| E8 | `GET /automation/notifications/targets` | `users:read` | machine-readable list of supported named targets / route patterns |

Existing `/v2/notifications/{send,multiple,broadcast}` and `/v2/automation/daily-tests/send-reminders` stay (deprecated), gain target validation + `screen` mapping (§E.4), and are retired after the n8n workflows move (D10).

**E1 — resolve**
```http
POST /api/v2/automation/users/resolve
X-Api-Key: …
{"identifiers": ["9876543210", {"type":"uuid","value":"0b6c…"}, 99999999]}
```
```json
{"status":true,"message":"OK","data":{"results":[
 {"input_index":0,"status":"found","user_uuid":"5d1e…","matched_by":"phone","has_push_token":true},
 {"input_index":1,"status":"found","user_uuid":"0b6c…","matched_by":"uuid","has_push_token":false},
 {"input_index":2,"status":"not_found"}],
 "counts":{"found":2,"not_found":1,"invalid_identifier":0}}}
```

**E2 — learning-status**
```json
{"identifiers":["+91 98765 43210","0b6c…"], "inactive_days":3, "exam":"CTET"}
```
`inactive_days` integer 1–365, required. `exam` optional (short name or uuid) to scope the course.
```json
{"input_index":0,"status":"found","user_uuid":"5d1e…",
 "locale":"hi","timezone":"Asia/Kolkata","has_push_token":true,
 "active_course":{"course_id":"6afd3af227c7b","exam":"CTET","level":"Paper 1","enrollment_status":"trial"},
 "last_activity":{"at":"2026-11-19T22:30:34+05:30","kind":"learning",
   "position":{"section":"Child Development","chapter":"Learning","topic":"Theories of learning"},
   "deep_link_path":"/hi/preparation/6afd3af227c7b"},
 "last_seen_at":"2026-11-21T09:02:11+05:30",
 "days_inactive":4, "eligible":true, "reason":null}
```
- `days_inactive` = whole days between the user's local "today" and the local date of `last_activity.at` (learning signals only: resume state, streak, interactions, test attempts/submits — **not** `last_seen_at`, see D6).
- `eligible` = `days_inactive >= inactive_days` AND has an active course AND has a push token AND not in cooldown; `reason` explains a `false` (`active_recently`, `no_active_course`, `no_push_token`, `cooldown`).
- Names come from the current syllabus in the user's locale (same "store ids, derive names" rule as §6 of DEVELOPMENT_RULES).

**E3 — continue-learning**
```http
POST /api/v2/automation/notifications/continue-learning
Idempotency-Key: n8n-cl-2026-11-23-run-1
{"identifiers":[…], "inactive_days":3, "campaign_key":"cl_3d", "dry_run":false}
```
Backend re-checks eligibility (never trusts n8n's earlier read), picks the template by `days_inactive` (§I), builds the deep link, creates the rows synchronously, queues dispatch.
```json
{"run_uuid":"8c0e…","results":[
 {"input_index":0,"status":"queued","user_uuid":"5d1e…","notification_uuid":"a41f…","template":"continue_learning_topic"},
 {"input_index":1,"status":"not_eligible","reason":"active_recently"},
 {"input_index":2,"status":"duplicate","reason":"already_sent_today"}],
 "counts":{"queued":1,"not_eligible":1,"duplicate":1}}
```
`dry_run:true` returns `would_send` + the rendered title/body/deep link and writes nothing.

**E4 — daily-tasks/reminders (hourly)**
```json
{"slot":"morning", "local_time":"06:00", "window_minutes":60, "dry_run":false}
```
`slot` ∈ `morning|missed` (existing `evening` accepted as an alias of `missed`). `local_time` default 06:00 / 18:00 from config. Answers **202** with a `run_uuid`; the work runs in queued chunks (same pattern as `daily-tests/generate`), n8n polls E7. Selection, per user:
1. timezone = `users.timezone` ?? `Asia/Kolkata`; local now ∈ [`local_time`, `local_time + window`).
2. local date → that user's assignments for that date (all active exams).
3. drop assignments already attempted (shared rule, §B); if none left → skip `attempted`.
4. dedupe key `daily_task:{slot}:{user_id}:{local_date}` (one push per user per slot per day, multi-task copy when > 1 open task) **and** the existing `daily_test_reminders` row per assignment.
5. no push token → `skipped_no_token` (logged, not retried).
Run response (E7):
```json
{"run_uuid":"…","type":"daily_task_reminder","slot":"morning","finished":true,
 "counts":{"candidates":812,"attempted":23,"queued":701,"no_token":80,"no_assignment":6,"duplicate":2,"failed":0}}
```

**E6 — custom / test send**
```http
POST /api/v2/automation/notifications/send
Idempotency-Key: campaign-diwali-2026-chunk-3
{"identifiers":[…], "type":"campaign", "campaign_key":"diwali_2026",
 "title":{"en":"…","hi":"…","mr":"…"}, "body":{"en":"…","hi":"…","mr":"…"},
 "target":{"url":"https://app.clearcutoff.in/test-series/6afd3af227c7b"},
 "image":"https://…", "mode":"live", "dry_run":false, "once_per":"campaign"}
```
- `title` / `body`: a string (same for all) or a per-locale object (`en` required). Limits: title ≤ 65, body ≤ 178 characters (Android collapsed view; longer is rejected, not cut).
- `target`: exactly one of `url` (absolute, allowed host), `path` (relative), or `name` + `params` (§C.5). Omitted `target` = no deep link (app just opens) — this is the only case without a destination, and it is explicit.
- `mode:"test"` (ability `notifications:test`) sends only to users in `NOTIFY_TEST_ALLOWLIST`; others → `not_in_test_allowlist`.
- `once_per`: `campaign` (dedupe `custom:{campaign_key}:{user_id}`), `day` (`custom:{campaign_key}:{user_id}:{local_date}`) or `none` (requires `Idempotency-Key`).
- Response shape as E3.

### C.4 Push payload contract (`data` sent to Expo, schema v1)
```json
{"schema":1, "notification_uuid":"a41f…", "type":"daily_task_reminder",
 "deep_link_path":"/hi/daily-test-attempt/{enrollment_uuid}/{daily_test_uuid}",
 "campaign_key":"…", "slot":"morning",
 "title":"…","body":"…"}
```
- `deep_link_path` is the **only** navigation key: relative, starts with one `/`, optional locale prefix, already validated by the backend, ≤ 512 chars. No `screen`, no absolute URL, no numeric ids.
- Legacy keys (`exam_id`, `daily_test_id`, `test_date`) stay for one release for old app builds that log them.

### C.5 Destination validation (backend, `App\Services\Notifications\DeepLinkTarget`)
1. **Host** (for `target.url`): must be in `NOTIFY_ALLOWED_HOSTS` (default `app.clearcutoff.in`; `apptest.clearcutoff.in` only outside production). Scheme `https`. No userinfo, no port. Otherwise 422 `target_host_not_allowed`.
2. **Path** must match one route pattern (locale prefix `(/hi|/mr)?` allowed; `{uuid}` = uuid, `{course}` = uuid or group_code `[a-z0-9]{8,40}`):

| Named target | Pattern | Per-user resolution when `params` omitted |
|---|---|---|
| `dashboard` | `/dashboard` | — |
| `my_courses` / `profile` / `payments` / `referral` | `/dashboard/{my-courses|profile|payments|referral}` | — |
| `daily_tests` | `/daily-tests/{uuid}` | user's active enrollment for `params.exam` or the current course |
| `daily_test_today` | `/daily-test-attempt/{uuid}/{uuid}` | today's assignment (enrollment uuid + test uuid) |
| `daily_test_history` | `/daily-tests/{uuid}/{uuid}` | — (needs both) |
| `preparation` | `/preparation/{course}` (+ `section`,`chapter`,`topic` numeric query) | current course; resume position applies by itself |
| `preparation_alt` | `/{course}/preparation` | as above |
| `test_series` | `/test-series/{course}` or `/{course}/test-series` | current course |
| `practice_test` | `/practice-test/{course}` | current course |
| `target` | `/target/{course}` | current course |
| `notes` / `pyqs` | `/{course}/content/{notes|pyqs}` | current course |
| `exam` | `/exam/{examId}` | — (explicit id required) |
| `onboarding` | `/onboarding` | — |
| `payment` | `/payment/initiated` (query allowlist only) | — |
| `continue_learning` | resolves to `preparation` with the resume position | resume state |

   Not allowed: `/sign-in`, `/marketing`, previews, `/test`, `/md-verify-temp`, `/sentry-example-page`, `/payment/success|failed`, `/question-tester`, anything else → 422 `target_not_supported`.
3. **Query**: allowlisted keys only (`section, chapter, topic, tab, source, utm_source, utm_medium, utm_campaign`), values `[A-Za-z0-9_-]{1,64}`.
4. **Locale**: the backend adds `/hi` or `/mr` from the user's enrollment language unless the given path already has a prefix (D5).
5. **Never fall back silently:** a given target that is invalid fails the whole request (422); a named target that cannot be resolved **for one user** marks that user `target_unresolvable` and sends nothing to them.
6. **Legacy `screen` mapping** (server side, applied on the old `/v2/notifications/*` endpoints before sending; and in the app for payloads still in trays): `"/dashboard"` → `/dashboard`; `"daily-test"` / `"daily_test"` / `"daily-tests"` → per-user `daily_tests` (else `/dashboard`, where the Daily Test widget lives, flagged `legacy_mapped`); any other value starting with `/` that passes step 2 → that path; anything else → request rejected (422) on the backend, ignored + logged `deep_link_result=invalid` in the app.

### C.6 Idempotency and duplicate protection (three layers)
1. **Request level:** `Idempotency-Key` header (required on E3, E6 when `once_per:"none"`, optional elsewhere). Table `automation_idempotency_keys` (client_id, key, endpoint, request_hash, response_json, status, expires_at 48 h), UNIQUE(client_id, key). Same key + same body → stored response replayed; different body → 409; first call still running → 409 `run_in_progress`.
2. **Per user / type / scope / day:** `notifications.dedupe_key` (UNIQUE, already there). Formats:
   - `daily_task:{morning|missed}:{user_id}:{YYYY-MM-DD local}`
   - `daily_test_live:{assignment_id}` (existing)
   - `continue_learning:{user_id}:{YYYY-MM-DD local}` + cooldown: no second continue-learning push within `NOTIFY_CL_COOLDOWN_DAYS` (default 3) — checked on `notifications(receiver_id, type, created_at)`
   - `custom:{campaign_key}:{user_id}[:{date}]`
   Plus `daily_test_reminders` UNIQUE(assignment, slot, channel) per task.
3. **Delivery:** rows are created **synchronously in the request** with `insertOrIgnore` (the unique key decides, races included) and the request returns exactly which users got a row; a new `DispatchNotificationsJob(notification_ids)` then reuses `NotificationDispatcher`. A job retry only dispatches rows still `pending`, so it can never re-send a row already `sent`. Expo transport: no automatic retry after a **timeout** (the batch may have been accepted); retry only on connection-refused / 5xx before any response; Expo tickets already make retries visible.
4. **Daily cap:** at most `NOTIFY_DAILY_CAP` (default 2) non-transactional pushes per user per local day (daily task reminders count; payment/subscription pushes do not) → item status `capped` (D9).

---

## D. DB changes (all new migrations, reversible, run locally with `--path` only — DEVELOPMENT_RULES §6)

| Migration | Change | Why |
|---|---|---|
| `add_timezone_to_users` | `users.timezone varchar(64) NULL`, `timezone_updated_at timestamp NULL`, index on `timezone` | local-time scheduling |
| `create_automation_clients` | id, uuid, name, key_hash (UNIQUE), abilities JSON, rate_limit_per_min, allowed_ips JSON NULL, last_used_at, revoked_at, timestamps | dedicated n8n credential (D1) |
| `create_automation_idempotency_keys` | client_id FK, key varchar(128), endpoint, request_hash char(64), status, response_json JSON NULL, expires_at, UNIQUE(client_id, key) | request idempotency |
| `create_notification_runs` | uuid, client_id, type, slot, params JSON, status, counts JSON, started_at, finished_at | async runs + n8n polling (same shape as `daily_test_generation_runs`) |
| `add_type_index_to_notifications` | index `(receiver_id, type, created_at)` | caps / cooldown queries |
| (phase 2, D8) `create_user_activity_summaries` | user_id PK, last_learning_at, last_seen_at, last_course_id, updated_at | bulk "all inactive users" audiences without scanning 6 tables |

No change to `notifications`, `daily_test_reminders`, `push_tokens` columns. **Cannot be supported by existing data:** literal last page outside learning (A.7), historic timezones (unknown until clients report), user-level UI language (only enrollment language).

---

## E. Backend changes (BE, branch to create: `phase-124-notifications`)

1. `[ ]` Config `config/notifications.php`: flags + limits (§K), `allowed_hosts`, `test_allowlist`, `push_driver` (`expo|log`), slot times.
2. `[ ]` `App\Support\IndianPhone` + `App\Services\Automation\UserIdentifierResolver` (C.2).
3. `[ ]` `App\Services\Notifications\DeepLinkTarget` (C.5) + `NotificationTargets` list for E8; locale prefix helper.
4. `[ ]` Old endpoints: validate/map `data.deep_link_path` / `data.screen` through `DeepLinkTarget`; stop catching `ValidationException` (422 instead of 500); stop logging full request bodies; `/multiple` uses `IndianPhone`.
5. `[ ]` `App\Services\DailyTasks\DailyTaskState` (one "attempted" rule) used by `PersonalizedDailyTestService::sendReminders` **and** `DailyTestController::exams()` (changes the card for users who did the same shared test on an earlier lap — D3).
6. `[ ]` Fix DL-1: `DailyTestLinks::attemptPath()` (enrollment uuid + test uuid) in `sendDailyTestNotifications` and `dispatchPushReminder`.
7. `[ ]` `App\Services\DailyTasks\DailyTaskReminderService` (E4): timezone window selection, grouping per user, copy, dedupe, chunked queued jobs, run counts.
8. `[ ]` `App\Services\Activity\LearningActivityService` (E2): MAX over A.7 signals per user in one query per signal for the whole batch; reuses `LastActivePaper` and resume state.
9. `[ ]` `App\Services\Notifications\ContinueLearningService` (E3) and `CustomNotificationService` (E6) on top of a shared `NotificationBatchWriter` (synchronous `insertOrIgnore`, caps, cooldown, dry-run).
10. `[ ]` `DispatchNotificationsJob(ids)` reusing `NotificationDispatcher`; `PushTransport` interface with `ExpoPushTransport` (today's `ExpoPushService` code) and `LogPushTransport`; remove the retry-after-timeout.
11. `[ ]` `NotificationCopy` with en/hi/mr templates from §I (PHP lang files `lang/{en,hi,mr}/notifications.php`), exam names from `exams.translation`.
12. `[ ]` `automation.client:<ability>` middleware + `automation` rate limiter + `php artisan automation:client-create {name} --abilities=…` (prints the key once).
13. `[ ]` Controllers `API/Automation/*Controller` (thin), FormRequests, routes in `routes/Apis/V2/automation.php`.
14. `[ ]` `POST /v2/profile/timezone` (auth:sanctum) + accept optional `timezone` on `save-token`; validate with `DateTimeZone::listIdentifiers()`.
15. `[ ]` Server-side Amplitude: genuinely new event **`Notification Sent`** (nothing covers the send moment today; Title Case) with `notification_type`, `slot`, `campaign_key`, `template`, `deep_link_target`, `locale` — **needs approval (D12)**. App-side events stay as they are, with added properties only.
16. `[ ]` Flag `DAILY_TEST_LIVE_PUSH_ENABLED` around the 08:00 scheduled push (`routes/console.php:43`) (D2).
17. `[ ]` Pint, feature tests (§J), `.env.example` updated.

## F. RN app changes (JS only → EAS Update; coordinate with the splash-screen work on `feat/splash-10b`, do not start until that branch is merged)

1. `[ ]` `useNotifications`: register the response listener and read the last response **on Home mount**, independent of permission/first load; clear the last response after **every** handled tap; dedupe by `request.identifier` (DL-4, DL-5).
2. `[ ]` `home.tsx`: `pendingTarget` ref; validate `deep_link_path` (relative, single leading `/`, `new URL(path, WEB_ORIGIN).origin === WEB_ORIGIN`) (DL-9); map legacy `screen` (C.5 step 6); if a target exists before the WebView renders, use it as the initial `source.uri` with `?token=` (single load, DL-5/DL-8).
3. `[ ]` Keep `pendingTarget` (AsyncStorage, 10-minute TTL) across a forced re-login; open it after login; clear on use.
4. `[ ]` `AppWebView` marketing-origin interception: before `performLogout()`, call `getProfile()` — 401 → logout; network/5xx/timeout → **stay logged in**, show the existing "Couldn't load" overlay with Retry (reload the dashboard). Covers old dashboard builds too.
5. `[ ]` `navigateTo` resets the error overlay (DL-10).
6. `[ ]` Send `timezone` (`Intl.DateTimeFormat().resolvedOptions().timeZone`) with `save-token` (and on app foreground if changed). No new native module.
7. `[ ]` `Notification Tapped`: add `notification_type`, `notification_uuid`, `campaign_key`, `deep_link_result` (`navigated|no_target|invalid|legacy_mapped`) — properties on the existing event, no new event.
8. `[ ]` Remove or use the unread `__NATIVE_AUTH_TOKEN__` injection (DL-8) — decision with the dashboard step G.5.

## G. Dashboard changes (CM `apps/dashboard`)

1. `[ ]` `AuthProvider`: in the `getMeApi` catch, clear token + cache **only** when the error is the 401 path (the `redirectToLogin` throw or `ApiError.status === 401`). For `ApiError.isNetworkError`, status 0, 408, 429, 5xx and timeouts: keep the token **and** the cached user, retry once with backoff (5xx included, unlike `fetchWithRetry`), expose `authError` + `retryAuth()` in the context.
2. `[ ]` `ProtectedPage`: redirect to `https://clearcutoff.in` only when there is no token or the token was rejected; when `authError` is set and no cached user exists, render the existing `NoInternetScreen` / `Error500Screen` (`components/ui/error-screens`) with Retry (one request per tap; cancel-then-refetch rule §2.2). Existing strings `slowLoad.*` / `retry` reused; any new string in en/hi/mr.
3. `[ ]` 403 stays a content/paywall signal everywhere (no logout). If the backend later adds an explicit revoked-token 403 with `code:"auth_revoked"`, handle that code only.
4. `[ ]` `preparationPage`: after `section`, apply `chapter` then `topic` from the URL once (DL-3), so topic-level links work.
5. `[ ]` Daily test attempt page: a 404 with numeric-looking ids → `flow.replace('/dashboard')` instead of "Failed to load" (old pushes in trays).
6. `[ ]` Report timezone once per session (`POST /v2/profile/timezone`) for web-only users (optional, D13).
7. `[ ]` Optional `window.__CC_NAVIGATE__(path)` for in-place navigation from the app (DL-5).

## H. n8n workflow designs (built only after the backend is live on apptest; all start with `live_mode=false`)

**Common:** credential "ClearCutoff Automation (n8n-prod)" = Header Auth `X-Api-Key`; `api_base` in one Set node; every send node `retryOnFail=false` (idempotency makes a manual re-run safe); errors → one Slack `#alerts` node; workflow timezone Asia/Kolkata.

**W1 Daily Task Reminders (replaces `e7yppSm6tXxwvC0E`)**
`Schedule (every hour at :00)` → `Set slots [{slot:morning, local_time:"06:00"}, {slot:missed, local_time:"18:00"}]` → `HTTP POST /automation/daily-tasks/reminders` (body `{slot, local_time, window_minutes:60, dry_run: !live_mode}`, header `Idempotency-Key: dt-{slot}-{$now.toUTC().toFormat('yyyy-MM-dd-HH')}`) → `IF 202` → `Wait 30 s` → `HTTP GET /automation/notifications/runs/{run_uuid}` → `IF finished` (loop, max 20) → `IF counts.failed > 0 or no_assignment > 0` → Slack.
How local time works across timezones: n8n runs **every hour**; the backend selects only users whose own local time is inside `[06:00, 07:00)` (or 18:00) right now and dedupes per user per local day, so each user is picked exactly once in the hour their clock passes 06:00 — whatever their offset (+05:30, +05:45, -04:00 …). For today's all-IST user base, the 06:00 IST run does all the work and the other 23 runs return `candidates: 0` in milliseconds.

**W2 Daily Test Generation (existing `S3vuGdhIObtNAST6`)** must be **active at 04:00 IST** before W1 goes live (assignments must exist at 06:00). Optional: also hourly per timezone later.

**W3 Continue Learning**
`Schedule daily 10:00 IST` (or a manual/Webhook trigger with `{inactive_days}`) → `Source of users` (Amplitude cohort export as in `Vbiw9ESEjiqXT6uS`, or a fixed list) → `Code: chunk 500` → `HTTP POST /automation/users/learning-status {identifiers, inactive_days}` → `Filter eligible` → `HTTP POST /automation/notifications/continue-learning {identifiers: eligible uuids, inactive_days, campaign_key:"cl_{n}d", dry_run}` with `Idempotency-Key: cl-{n}d-{date}-{chunk}` → `Aggregate counts` → Slack summary. The backend re-checks eligibility, so the read step is only for reporting.

**W4 Custom / Test push (manual)**
`Form trigger` (title en/hi/mr, body en/hi/mr, destination URL, audience: test numbers / cohort / list, mode test|live) → `HTTP GET /automation/notifications/targets` (shows supported pages) → `HTTP POST /automation/notifications/send {mode:"test"}` to the test allowlist first → `Wait for approval (n8n Form / Slack)` → same call with `mode:"live"`, chunks of 500, `Idempotency-Key: {campaign_key}-{chunk}`.

**W5 Campaign Push via Amplitude Cohort (`Vbiw9ESEjiqXT6uS`)** moves from `/v2/notifications/multiple` to E6 with `once_per:"campaign"`; the `push_campaign_log` data table stays as reporting, no longer the only guard.

---

## I. Message catalogue

Placeholders: `{exam}` exam short name in the user's language (`exams.translation`, else `short_name`), `{level}` paper/level name, `{chapter}` / `{topic}` from the current syllabus, `{count}` questions in the test (`DAILY_TEST_QUESTIONS_PER_TEST`, default 10), `{minutes}` = `ceil(count × 1)` minutes, `{n}` number of open tasks, `{exam_list}` up to 2 exam names joined with "and"/"और"/"आणि" (+ "+N"), `{days}` days inactive. Copy language = the enrollment language of the course concerned (hindi → hi, marathi → mr, everything else → en) (D5). Title ≤ 65, body ≤ 178 characters after substitution; a too-long `{chapter}` is dropped to the template's short variant, never cut mid-word.

| # | Type / template | Trigger time | Sent by | en (title / body) | hi (title / body) | mr (title / body) | Deep link |
|---|---|---|---|---|---|---|---|
| 1 | `daily_task_reminder` · `morning` (1 open task) | 06:00 local, only if today's task not attempted | W1 → E4 | **Today's Daily Test is ready** / {exam} {level}: {chapter}. {count} questions, about {minutes} minutes. Start now. | **आज का डेली टेस्ट तैयार है** / {exam} {level}: {chapter}। {count} सवाल, लगभग {minutes} मिनट। अभी शुरू करें। | **आजची डेली टेस्ट तयार आहे** / {exam} {level}: {chapter}. {count} प्रश्न, सुमारे {minutes} मिनिटे. आत्ताच सुरू करा. | `daily_test_today` |
| 2 | `daily_task_reminder` · `morning_multi` (≥ 2 open) | 06:00 local | W1 → E4 | **{n} Daily Tests are ready today** / {exam_list}. Each one takes only a few minutes. | **आज आपके {n} डेली टेस्ट तैयार हैं** / {exam_list}। हर टेस्ट में बस कुछ ही मिनट लगते हैं। | **आज तुमच्या {n} डेली टेस्ट तयार आहेत** / {exam_list}. प्रत्येक टेस्टला फक्त काही मिनिटे लागतात. | `daily_tests` of the first open course |
| 3 | `daily_task_reminder` · `missed` (1 open) | 18:00 local, only if still not attempted | W1 → E4 | **Your Daily Test is still pending** / {exam}: {chapter} is waiting. Finish it before the day ends, it takes about {minutes} minutes. | **आपका डेली टेस्ट अभी बाकी है** / {exam}: {chapter} आपका इंतज़ार कर रहा है। दिन खत्म होने से पहले पूरा करें, सिर्फ़ {minutes} मिनट लगेंगे। | **तुमची डेली टेस्ट अजून बाकी आहे** / {exam}: {chapter} तुमची वाट पाहत आहे. दिवस संपण्यापूर्वी पूर्ण करा, फक्त {minutes} मिनिटे लागतील. | `daily_test_today` |
| 4 | `daily_task_reminder` · `missed_multi` | 18:00 local | W1 → E4 | **{n} Daily Tests are still pending** / {exam_list}. Finish them before the day ends. | **{n} डेली टेस्ट अभी बाकी हैं** / {exam_list}। दिन खत्म होने से पहले इन्हें पूरा करें। | **{n} डेली टेस्ट अजून बाकी आहेत** / {exam_list}. दिवस संपण्यापूर्वी त्या पूर्ण करा. | `daily_tests` |
| 5 | `continue_learning` · `topic` (resume position known, 2–6 days) | daily run (W3, 10:00 IST suggested) | W3 → E3 | **Continue where you left off** / {exam}: {topic} is waiting for you. Just 10 minutes today keeps you on track. | **जहाँ छोड़ा था, वहीं से शुरू करें** / {exam}: {topic} आपका इंतज़ार कर रहा है। आज सिर्फ़ 10 मिनट पढ़ें और तैयारी पटरी पर रखें। | **जिथे थांबलात, तिथून पुन्हा सुरू करा** / {exam}: {topic} तुमची वाट पाहत आहे. आज फक्त 10 मिनिटे अभ्यास करा आणि तयारी सुरू ठेवा. | `continue_learning` |
| 6 | `continue_learning` · `course` (no position) | W3 | W3 → E3 | **Your {exam} preparation is waiting** / It has been {days} days. Restart today with one short topic. | **आपकी {exam} की तैयारी इंतज़ार कर रही है** / {days} दिन हो गए हैं। आज एक छोटे टॉपिक से फिर शुरुआत करें। | **तुमची {exam} तयारी तुमची वाट पाहत आहे** / {days} दिवस झाले आहेत. आज एका छोट्या टॉपिकपासून पुन्हा सुरुवात करा. | `preparation` |
| 7 | `continue_learning` · `long` (≥ 7 days) | W3 | W3 → E3 | **Your progress is saved** / Everything you studied for {exam} is still here. Pick up from where you stopped. | **आपकी प्रगति सुरक्षित है** / {exam} के लिए आपने जो पढ़ा है, वह सब सेव है। जहाँ रुके थे, वहीं से आगे बढ़ें। | **तुमची प्रगती सुरक्षित आहे** / {exam} साठी तुम्ही जे शिकलात ते सर्व सेव्ह आहे. जिथे थांबलात, तिथूनच पुढे जा. | `continue_learning` |
| 8 | `test` · `test` | manual | W4 → E6 `mode:test` | **Test notification** / This is a ClearCutoff test message. Tap to check that the right page opens. | **टेस्ट नोटिफ़िकेशन** / यह ClearCutoff का टेस्ट संदेश है। टैप करके देखें कि सही पेज खुलता है। | **टेस्ट नोटिफिकेशन** / हा ClearCutoff चा टेस्ट संदेश आहे. योग्य पेज उघडते का ते टॅप करून तपासा. | given target |
| 9 | `campaign` / `custom` | manual / cohort schedule | W4, W5 → E6 | caller-supplied (validated lengths, en required) | caller-supplied | caller-supplied | given target (required unless explicitly omitted) |
| 10 | `daily_test_live` (existing, 08:00 IST Laravel) | 08:00 IST | `app:send-daily-test-notifications` | Daily Test is Live! / {exam} > {section} — attempt today's test now. (en only) | — | — | fixed by §E.6; **retire or keep: D2** |

Copy notes: no streak claims (the reminder cannot know whether the user has a streak to "break"); no fake urgency; exam names stay in Latin script when `exams.translation` has no hi/mr value (CTET, HTET are written this way in the app today).

---

## J. Test plan

**Safety rules (must hold for every run):**
- Backend tests use a **throwaway MySQL DB `clearcut_test_p124`** (created for the run, dropped after) — never `clearcut`. Add a guard to `tests/TestCase.php` that aborts when `DB_DATABASE` is not `:memory:` and does not start with `clearcut_test_` (phpunit's `<env>` entries have no `force="true"`, so a real env var can win — that is how `clearcut` was wiped on 2026-11-02).
- **Before any run:** `php artisan test --list-tests --filter=<filter>` and check that no unrelated `RefreshDatabase` test (`EventTrackingServiceTest`, `SyllabusTrackerApiTest`, …) is in the list. Use narrow filters (`--filter=Automation|DailyTaskReminder|ContinueLearning|DeepLinkTarget|IndianPhone`).
- Push transport = `log` driver, and `Http::fake(['exp.host/*' => …])` with `Http::preventStrayRequests()` in every notification test. No real Expo call, no bulk send, no production push. Device checks later: one test device, `mode:"test"`, apptest backend only.

| Area | Cases (expected) |
|---|---|
| Daily task, 06:00 | not attempted → 1 push (template 1); completed today → none; completed the same shared test on an earlier lap only → push (shared rule); `in_progress` → per D3; no assignment → counted `no_assignment`, no push; no token → `skipped_no_token`, row logged; 2 open exams → 1 push, template 2; dropped/expired enrollment → none |
| Daily task, 18:00 | still not attempted → template 3/4; attempted between 06:00 and 18:00 → none; morning push already sent → missed still sent (different slot key) |
| Local time | IST user at 06:00 IST run → picked; at 05:00/07:00 run → not picked; `America/New_York` user picked only in the run where their clock is 06:xx; `Asia/Kathmandu` (+05:45) picked once; DST change day; NULL timezone → IST; invalid timezone string rejected by the timezone endpoint |
| Run safety | same slot twice in an hour → second run `duplicate` for all; concurrent runs → 409 `run_in_progress` or unique-key losers counted `duplicate`, never 2 rows; job killed mid-chunk and retried → no user gets 2 pushes |
| Inactivity thresholds | activity 1/2/3/5/30 days ago × `inactive_days` 2/3/5 → `eligible` exactly when `days_inactive >= n`; activity only `last_seen_at` (app opened, nothing studied) → per D6; no activity ever → `days_inactive` from enrollment date; cooldown blocks a 2nd push within 3 days |
| Phone formats | `9876543210`, `+919876543210`, `+91 98765 43210`, `+91-98765-43210`, `09876543210`, `919876543210`, `0091 9876543210`, `(+91) 98765.43210` → same user; `5876543210`, `98765`, `+92…`, `abc` → `invalid_identifier`; junk DB rows never match |
| Identifiers | uuid, int id, string digits ≤ 9 (treated as phone → invalid, documented), mixed list, duplicates collapsed, 500 ok, 501 → 422, soft-deleted user → `not_found`, unknown uuid → `not_found` |
| Single vs bulk | 1 identifier with `notifications:send`; 2+ without `-bulk` → 403; bulk 500 → one response with per-item statuses in input order |
| Duplicates | same `Idempotency-Key` + same body → identical response, no new rows; same key + other body → 409; no key, `once_per:"campaign"` twice → second all `duplicate`; daily cap reached → `capped` |
| Deep links (backend) | each named target resolves to the expected path for a fixture user; `/hi` / `/mr` prefix from enrollment language; absolute URL on `app.clearcutoff.in` accepted; `evil.com`, `app.clearcutoff.in.evil.com`, `https://user@app.clearcutoff.in`, `//evil.com`, `javascript:`, `/sign-in`, unknown route, bad query key → 422; unresolvable per user → `target_unresolvable`, nothing sent; legacy `screen` values mapped as C.5 step 6 |
| Deep links (app, device, release build) | foreground / background / killed / after 10+ min × {daily test today, preparation topic, test series, dashboard, no target, invalid path, legacy `screen`} → exact page, single load on cold start, no replay after logout/login, `deep_link_result` property correct, double tap = last wins |
| Token expiry (dashboard, Playwright at 390 px, en/hi/mr) | valid token → page; expired token (`/v1/auth-user` 401) → token cleared, redirect once; network offline (`route.abort`) → token **kept**, NoInternet/Retry screen, Retry = exactly +1 request; 500/502/503 → token kept, error screen; 429 → kept; slow (hang 15 s) → SlowLoad notice; a paywall 403 on a topic → **no logout**; `?token=` handoff still works |
| Token expiry (app, device) | token expired → native login; airplane mode while dashboard loads → stays logged in, overlay with Retry; 5xx from `/v1/auth-user` → stays logged in |
| Network failures (backend → Expo) | Expo 500 / timeout / connection refused (faked) → row `failed` or retried once only before a response; `DeviceNotRegistered` → token deleted, others in the batch still sent |
| Security | wrong key 401; revoked client 401; missing ability 403; responses contain no phone/name/token (assert JSON keys); rate limit → 429 + Retry-After; another user's data never returned |
| Analytics | app `Notification Tapped` once per tap with new properties; `Notification Sent` (if D12 approved) once per sent row |

---

## K. Rollout order, feature flags

Order (user's rule): **backend → RN EAS update → dashboard → n8n**.
1. **Backend** to apptest with every flag OFF; then turn on per feature on apptest; test with the test allowlist only. Production deploy (auto on push to `main`) only with the user's go-ahead.
2. **RN** EAS Update (JS only) after `feat/splash-10b` is merged; check `runtimeVersion` matches the store build; staged to internal testers first.
3. **Dashboard** token fix + preparation params + numeric-id redirect (independent of the push work; can go earlier if the user wants the logout fix first).
4. **n8n**: W2 active first (04:00), then W1 with `live_mode=false` (dry runs return counts), then live for a test cohort, then everyone; W3/W4/W5 after.

| Flag (backend env) | Default | Effect |
|---|---|---|
| `NOTIFY_DAILY_TASK_ENABLED` | false | E4 returns 503 when off |
| `NOTIFY_CONTINUE_LEARNING_ENABLED` | false | E3 |
| `NOTIFY_CUSTOM_V2_ENABLED` | false | E6 |
| `NOTIFY_PUSH_DRIVER` | `expo` (prod) / `log` (local, testing) | transport |
| `NOTIFY_ALLOWED_HOSTS` | `app.clearcutoff.in` | C.5 |
| `NOTIFY_TEST_ALLOWLIST` | empty | user uuids for `mode:test` |
| `NOTIFY_DAILY_CAP` / `NOTIFY_CL_COOLDOWN_DAYS` | 2 / 3 | C.6 |
| `NOTIFY_LOCALE_PREFIX_ENABLED` | false | `/hi` `/mr` prefix (turn on after the RN update) |
| `DAILY_TEST_LIVE_PUSH_ENABLED` | true | 08:00 Laravel push (D2) |
| `AUTOMATION_LEGACY_KEY_ENABLED` | true | old shared key accepted; set false after n8n moves |

---

## 3. Implementation plan (ordered, after approval)

- [ ] 0. User reviews this doc and answers §5 decisions.
- [ ] 1. BE §E.1–E.6 (foundations, DL-1 fix, shared attempted rule) + tests.
- [ ] 2. BE §E.7–E.14 (services, endpoints, migrations, client keys) + tests on `clearcut_test_p124`.
- [ ] 3. BE deploy to apptest, flags off → dry runs → test allowlist sends to one device.
- [ ] 4. RN §F (after splash branch merge) → EAS Update to testers → device matrix (§J).
- [ ] 5. Dashboard §G → tsc, eslint, check:colors, Playwright (Sonnet sub-agent, memory `feedback_playwright_tests_sonnet`).
- [ ] 6. n8n W2 → W1 → W3 → W4/W5, each dry-run first.
- [ ] 7. Production: user's go-ahead per step; retire old endpoints/key (D10).

## 4. Progress / completed changes
- 2026-11-23: audit across BE / RN / dashboard / n8n (read-only), this doc written. Branch `phase-124-notification-system` created in clearcut-master; nothing committed.

## 5. Decision log (open — needs the user)
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-23 | **D1** n8n credential: (a) per-client hashed keys with abilities (`automation_clients`, recommended) or (b) a Sanctum token on a service user with abilities. Rotate the current shared key and remove the committed default (S1)? | open |
| 2026-11-23 | **D2** The 08:00 Laravel "Daily Test is Live!" push plus a 06:00 reminder = 2 pushes most mornings. Retire the 08:00 push when W1 is live (recommended), or keep both? | open |
| 2026-11-23 | **D3** Does an `in_progress` attempt count as "attempted"? Recommended: no for 06:00 (rare), and for 18:00 send a "finish your test" variant. Also approve changing the Daily Tests card to the shared rule (A.5). | open |
| 2026-11-23 | **D4** Multi-exam users: one push per user per slot with a combined message (recommended), or one per exam (today's behaviour)? | open |
| 2026-11-23 | **D5** Copy language + `/hi` `/mr` prefix: from the enrollment language (recommended, the only stored value) or always English? | open |
| 2026-11-23 | **D6** "Inactive" = no learning activity (recommended) or no app open at all (`last_seen_at`)? | open |
| 2026-11-23 | **D7** "Last page": accept "last learning position + last test" for v1 (recommended), or add page tracking (new write path, more DB writes)? | open |
| 2026-11-23 | **D8** Bulk audiences ("all users inactive ≥ N days") from the backend: add `user_activity_summaries` in a phase 2, or keep audiences in Amplitude cohorts (n8n passes the list)? | open |
| 2026-11-23 | **D9** Daily cap (2 non-transactional pushes/user/day) and quiet hours: is 06:00 acceptable as a push time (many apps keep 22:00–07:00 quiet)? | open |
| 2026-11-23 | **D10** Retire old `/v2/notifications/{send,multiple,broadcast}` and `daily-tests/send-reminders` after migration, or keep them permanently (validated)? | open |
| 2026-11-23 | **D11** Accept `users.user_id` ("CL-…") as an identifier? Recommended: no (mostly NULL). | open |
| 2026-11-23 | **D12** Add server-side Amplitude event `Notification Sent` (new event; nothing covers the send moment)? | open |
| 2026-11-23 | **D13** Dashboard reports timezone for web-only users too, or app only? | open |
| 2026-11-23 | **D14** Fix S2 (public V1 reminder endpoints) and S3 (login tokens in reports) in this phase or separately? Check what the active `Day Wise` workflow calls first. | open |
| 2026-11-23 | **D15** Sanctum 10-day absolute expiry: keep (users re-login every 10 days, the app included) or make it sliding / longer for the app? Out of scope unless approved. | open |

## 6. Blockers / risks
- ⚠️ **System impact:** backend contract change for every push sender; RN app behaviour on tap and on session loss; dashboard login behaviour for every user; n8n production workflows; analytics (new properties, possibly one new event).
- Production data unknown: all counts are local. Production may have different phone shapes, timezones (none), notification rows, or a stopped scheduler (local `notified_at` last 2026-09-23).
- The RN repo is being changed by another agent (`feat/splash-10b`) — merge conflicts in `home.tsx` / `AppWebView.tsx` likely; RN work waits.
- Assignments must exist by 06:00 (W2 inactive today). If generation fails, reminders silently skip (counted `no_assignment`, alert in W1).
- Pushing 06:00 reminders to ~all trial users may raise uninstalls/opt-outs; start with a cohort, watch Amplitude + Expo receipts.
- iOS: no APNs, so iOS users get nothing; not a regression.
- The existing shared key may already be used by other n8n workflows (WhatsApp bot "Check Payment", unverified-users report) — keep it working until each moves (flag `AUTOMATION_LEGACY_KEY_ENABLED`).
- Rollback: every feature behind a flag; migrations reversible; RN EAS Update can roll back to the previous update.

## 7. Dependencies / packages added
None (plan). Planned: 5 migrations (§D), new env vars (§K), no new composer/npm package (RN uses `Intl`, no `expo-localization`).

## 8. Tests and verification
- [ ] Baseline measured on the OLD code — not done (audit only). To measure first: number of pushes per user per morning (08:00 live + reminders), deep-link success (DL-1 404s in Sentry), and dashboard logouts caused by network failures (Sentry breadcrumbs `GET /v1/auth-user` status 0 followed by a redirect).
- [ ] Break-it pass — not applicable yet (no code).
- [ ] **Not verified:**
  - Any production data or production config (`AUTOMATION_API_KEY` set? `DAILY_TEST_TIMEZONE`? Laravel scheduler running? queue worker healthy?).
  - What the active n8n workflow `Day Wise` and the WhatsApp bot call on this backend (not opened in full).
  - Whether Hermes on the current app build returns a correct `Intl` timezone on all Android versions.
  - Whether `user_course_resume_states.course_id` always equals a live `group_code` (sampled 3 rows only).
  - Real-device behaviour of everything in §F.
  - The exact production share of users with more than one active exam (452 locally).
- [ ] Commands run: read-only `artisan tinker --execute` SELECTs on local `clearcut` (schema, counts, indexes); n8n MCP `search_workflows` / `get_workflow_details` (read). No tests, no builds, no installs.

## 9. Next steps
1. User answers D1–D15 (at least D1–D6 before backend work starts).
2. Create the backend branch `phase-124-notifications`, add the TestCase DB guard and `clearcut_test_p124`, then §E in order.
3. Re-check production facts in §8 "Not verified" with the user (they run the server commands themselves).
