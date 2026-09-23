# API

This repo **consumes** external APIs and exposes only a handful of Next.js route handlers in the dashboard. Paths below are taken from call sites in the source; request/response bodies are only listed where the code shows them. Backend contracts themselves live in the Laravel and Payload repos.

## 1. Route handlers exposed by this repo (`apps/dashboard/src/app/api`)

| Route | Method | Behaviour |
|---|---|---|
| `/api/auth/login` | POST | Forwards `{email, password}` to `${NEXT_PUBLIC_LARAVEL_MAIN_BACKEND}/auth/login`. On failure returns 401 `{message}`. On success returns `{user}` and sets HttpOnly cookie `auth_token` (7 days, `sameSite=lax`, `secure` in production) |
| `/api/auth/logout` | – | File exists but is **entirely commented out** |
| `/api/profile` | GET | Reads `auth_token` cookie → 401 if missing; proxies `GET /v2/profile` with bearer token (`no-store`); 502 on non-JSON backend reply |
| `/api/payment-init` | POST | Forwards the body to `https://n8n.clearcutoff.in/webhook-test/payment-init` (a hardcoded n8n **test** webhook URL) and returns `{success, status, data}` |
| `/api/sentry-example-api` | – | Sentry example route |

Other apps define no `route.ts` handlers, apart from sitemap/robots files. (`apps/landing/src/api/route.ts` exists but was not analysed.)

## 2. Laravel main backend (base URL includes `/api`)

Base URL env: `NEXT_PUBLIC_LARAVEL_MAIN_BACKEND` (dashboard, tools) and `NEXT_PUBLIC_API_URL` / `BACKEND_URL` / `API_URL` (blog, landing). Auth: `Authorization: Bearer <token>`. Envelope used by syllabus/level endpoints: `{status, message, data}`.

### Auth (blog, landing, dashboard)
`POST /v1/auth/login`, `POST /auth/login` (dashboard `loginApi`), `POST /v1/auth/register`, `POST /v1/auth/varify-otp`, `POST /v2/auth/varify-otp` *(spelling "varify" is the backend's)*, `POST /v1/auth/truecaller/initiate`, `GET /v1/auth/truecaller/status/{requestNonce}`, `GET /v1/me`, `GET /v1/auth-user`, `POST /v1/logout`, `DELETE /v1/delete-account`.

### Blog content (public)
`GET /blog/exam` (query: `status`, `short_name`, `first`, `enavigation`), `GET /blog/get-years?exam_id=`, `GET /blog/get-sections`, `GET /blog/get-questions` (query: `year`, `level_id`, `id`, `limit_q`, …), `GET /blog/get-questions-by-section`.

### Onboarding / enrolment
`GET /v1/exam/all-levels/{examId}`, `POST /v1/exam/selectedexam`, `POST /v2/enrollment/create`, `POST /v2/enrollment/create-by-name`, `GET /v2/enrollment/edit/{examId}`, `POST /v2/enrollment/customization`, `POST /v2/action/start-course`, `/v2/change-course?course_id=`, `/v2/get-my-active-courses`, `/v2/get-mycourses`.

### Preparation & content
`/v2/preparation/get-course/{courseId}`, `get-sections/{examId}`, `get-section-chapters`, `get-pyqs/{examId}`, `get-instances/{courseId}`, `instance-sections/{instanceId}`, `instance-questions/{instanceId}`; `/v2/content/get-notes/{sectionId}`; `/v2/mini-test/get`; `/v2/question-tester/{…}`.

### Tests & exams
`/v2/test/list/{courseId}?type=…`, `/v2/test/sectional/{courseId}`, `/v2/practice-test[/{uuid}]`, `/v2/exam/get-exam/{examId}`, `create-exam` (query `paperId`, `test_id`, `examType`, `courseId`, plus `sectionId` or `chapterId`), `answer`, `clear-answer`, `mark-review`, `end-exam/{id}`, `exam-attempts-list`, `/v2/exam/attempt/{examId}/heartbeat`; plus `/exam/{id}/submit`, `/exam/{id}/proctor`, `/exam/{id}/autosave` (all `POST`, `apps/dashboard/src/lib/exam.ts`; no `/v2` prefix).

### Progress
`/v2/interactions` (also `resume-state`, `progress-summary`, `learning-progress`, `learning-progress/by-topic`), `/v2/streak`, `/v2/streak/log-minutes`.

### Payments & subscriptions
`/v2/payment/pricing`, `create`, `verify`, `webhook-trigger`, `checkout-initiated`; `/v2/subscription` and `create`, `{id}/pause|resume|cancel`.

### Profile
`GET|PUT /v2/profile` (PUT body: `name, gender, dob, email, phone`).

### Tools (public, unauthenticated; used by `apps/tools`)
`GET /tools/syllabus/exams`, `GET /tools/syllabus/levels/{examId}?locale=`, `GET /tools/syllabus/syllabus/{examId}/{levelId|full-exam}?locale=`.

Dashboard also calls `https://apptest.clearcutoff.in/api/blog/exam?status=active` with a **hardcoded host** in `lib/api/onboarding.ts` (`fetchExams`).

## 3. Payload CMS (`/api/...`)

Base: `CMS_URL` (landing, default `http://localhost:3011`); `NEXT_PUBLIC_PAYLOAD_URL` (blog, fallback `https://payloadcms.clearcutoff.in`).

- Landing: `/api/comparisons`, `/api/alternatives`, `/api/globals/marketing-proof`, `/api/globals/faq` (all with `locale`/query params).
- Blog: `/api/posts`, `/api/globals/global-sections?locale=`, generic `/api/{collection}`, `/api/globals/{slug}`, `/api/{collection}/{id}`.

## 4. Tools backend

`TOOLS_API_URL` (default `https://tools-api.clearcutoff.in/api/v1`), called at **build time** only by `apps/tools/src/lib/api/toolsApi.ts` for the resizer exam list and per-exam detail (`public_slug`, `exam`, `category`, `data.photoSpec/signatureSpec/officialRequirements`). Exact paths were not enumerated here.

## 5. Other outbound

- n8n webhook (see `/api/payment-init`); dashboard `services/webhook.ts` (`webhookPaymentInitiate`) calls `/api/payment-init`. A commented-out block in `lib/api/profile.ts` shows an older direct call to `https://n8n.clearcutoff.in/webhook/payment-init`.
- Amplitude, GTM, Facebook Pixel, Clarity, Sentry — configured through env vars listed in each `.env.example`.

## 6. Client libraries

- `packages/api`: `createApiClient` (axios), `createFetchClient` (fetch; `baseUrl`, `defaultRevalidate`, `fetchJson`), `errors`.
- Dashboard: `apiFetch(path, options, token?, retryOptions?)` in `src/lib/api/client.ts` — sets JSON headers and bearer token, retries via `fetchWithRetry`, throws `ApiError`, redirects to login on stored-token rejection.
