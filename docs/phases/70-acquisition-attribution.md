# Phase 70 — User-acquisition attribution (DB `users.metadata` + Amplitude)

**Repos:** backend `clearcutoff-main-backend` (Laravel) + CM (`packages/auth`, landing, blog, tools). Dashboard / RN app are not auth consumers and are out of scope.
**Status:** **Implemented and verified locally (2026-10-30); NOT committed, pushed or deployed.** Backend branch `feature/attribution` (worktree `clearcutoff-backend-attr`), frontend branch `feature/attribution` (worktree `clearcut-master-attr`).
**Rule:** nothing goes live (backend deploy or Amplitude changes) without your approval. Deploy order: backend first (the new `attribution` field is optional), then the apps.

## 1. Request (summary)
Store structured acquisition attribution in the existing `users` JSON column, with first-touch / last-touch rules and extensibility; classify `paid` (OTP verified from `/start` or the main-landing login modal) vs `organic` (OTP verified from any tools page); store the exact page; send the same data to Amplitude (existing events, no duplicates, anonymous → authenticated identity); document the exact Amplitude spec; test everything with real stored values.

## 2. What exists (inspected)
**Database.** The column is **`users.metadata`** (JSON, cast `array` in `App\Models\User`, mass-assignable) — not `meta_data`. It already holds `reminder.*` (WhatsApp follow-ups query `metadata->reminder->next_at`) and `action.*`, written by `UserService::initMeta()` and read with `App\Helpers\MetaJSONHelper` (`get/set` with dot notation, `push`, `increment`, `forget`). So the plan **reuses the column and the helper, adds one new top-level key `attribution`, and never replaces the whole array** (a merge that leaves `reminder`/`action` untouched). No migration is needed.

**Backend auth (V1 `AuthController`).**
- `login()` (= send OTP): creates the user for a new phone, fires server event **`Signed Up`** (`signup_method`; user prop `signup_date`), calls `UserService::initMeta()`, sends OTP.
- `varifyOtp()` (= verify): first verification → `UserService::verifyUser()` (sets `is_verified`, `verification_method`; **no event**); an already-verified user → `UserService::trackLogin()` → server event **`Login`** (`login_method`, `platform`). Truecaller (`truecallerLogin` / iOS) go through `UserService::loginByPhone()` → `verifyUser`.
- `AmplitudeService::track()` queues `SendAmplitudeEvent` (HTTP V2 `/2/httpapi`); events carry `event_properties` and `user_properties`; `user_id` = the user's `uuid` (the same id the web apps pass to `setUserId`). There is no identify-only call.

**Frontend.** `@clearcut/auth` is the single login code for landing, blog and tools: `authApi.loginUser` → `/v1/auth/login`, `authApi.verifyOtp` → `/v1/auth/varify-otp`; `/start` (`StartAuthForm`) uses the same `authApi`. Events (shared, `onEvent`): `Authentication Options Viewed`, `Authentication Method Selected`, `Verification Sent/Resent/Failed`, **`Authentication Outcome`** (`outcome`, `auth_method`, `failure_reason`); `onIdentify(uuid)` calls Amplitude `setUserId` (new signup: right after the OTP is sent; everyone: after verify). Amplitude web SDK already collects first-touch `initial_utm_*` and `[Amplitude] Page Path/URL/Domain` on these events. **Caveat:** `authApi.loginUser` runs the body through a Zod schema, which would drop an unknown `attribution` field — the schema must be extended.
**Where the page comes from:** landing routes `/`, `/start`, `/hi/…`, `/mr/…` (locale prefix); tools run under `basePath /tools` (`/tools/resizer/<exam>`, `/tools/syllabus-tracker`, `/tools/age-eligibility-calculator`, `/tools/hi/…`). Landing and tools share one origin (`clearcutoff.in`) in production, so browser storage is shared between them.

**Amplitude taxonomy (project 673721) — naming collisions found:**
- Event property **`source` already exists with a different meaning** ("product surface": `onboarding`, `learn_dashboard`, `pay_tap`…, also on `Verification Sent` and `Payment Outcome`). `channel` exists only on `Support Contacted` (`whatsapp`). `page` exists on `Page Viewed`. User properties `gp:utm_source`, `gp:initial_utm_source`, `gp:registered_from` exist.
- ⇒ The new Amplitude properties are **prefixed** (`attribution_*`, `first_touch_*`, `last_touch_*`); the DB keys keep the plain names you asked for (`source`, `channel`, `page`).

## 3. `users.metadata.attribution` — structure (versioned, extensible)
```json
{
  "reminder": { "...": "untouched" },
  "action":   { "...": "untouched" },
  "attribution": {
    "v": 1,
    "first_touch": {                       // written ONCE, at the user's first successful OTP verification
      "source": "paid",                    // paid | organic | other   (server-derived, rules in §4)
      "channel": "facebook",               // see §4 — utm/click-id/referrer derived, else "direct"
      "page": "/start",                    // normalized pathname where verification was initiated
      "landing_page": "/hi/exam/htet-preparation",   // this browser's first-ever landing page
      "referrer": "facebook.com",          // host only, no path/query
      "app": "landing",                    // landing | tools | blog | ...
      "locale": "hi",
      "utm": { "source": "fb", "medium": "paid", "campaign": "ctet_leads_hi_20260820" },   // only allow-listed keys
      "at": "2026-10-30T10:15:00Z"
    },
    "last_touch": { "…same shape…": "overwritten on EVERY successful verification (incl. repeat logins)" },
    "extra": { "tool": "resizer", "exam": "tnpsc" }   // free-form, validated bag any page/feature may add (≤ 20 keys, scalar values)
  }
}
```
Rules: **never overwrite existing metadata** (read → `MetaJSONHelper->set('attribution.…')` → save, inside a row lock so two verifications cannot clobber each other); `first_touch` is written only when it is absent **and** this is the first verification (`is_verified` was false); a user who already existed before this feature gets **no invented first-touch** — only `last_touch` from their next login (`first_touch` stays absent; reports treat that as "pre-attribution"). `last_touch` always updates. Unknown/invalid fields are dropped, strings trimmed and length-capped, paths must match `^/[a-z0-9/_\-.]*$` after normalization.

## 4. Classification (server decides; the client only reports facts)
The browser reports `{app, page, landing_page, referrer, locale, utm, click_ids, extra}`; **the backend derives `source`/`channel`** so a client cannot just claim "paid":
- `source = paid`  when `app = landing` and the verify was started from `/start` or from the landing login modal (any landing page) — your rule, applied literally.
- `source = organic` when `app = tools` (every tool route).
- everything else (blog/academy, direct dashboard handoff, Truecaller without page context, mobile app, unknown) → `source = other` **pending your decision (§7 Q1)**.
- `channel` (proposed): `facebook` / `instagram` / `google` / `whatsapp` / … from `utm_source` or a click id (`fbclid`→facebook, `gclid`→google); otherwise search-engine referrer → `search`; other referrer → `referral`; none → `direct`.
- `paid_evidence` (bool, in the touch) = a paid signal (utm medium / click id) was present. Your rule would label an organic visitor who opens the landing modal as `paid`; this flag lets you later separate "paid by rule" from "paid with evidence" without changing the rule.

## 5. Capture (one central mechanism)
- **`packages/auth/src/attribution.ts`** (new, the only place): `buildAttribution()` reads `location` (normalized pathname: lowercased, locale prefix `/hi` `/mr` removed and stored as `locale`, query/hash/ids dropped, trailing slash trimmed; tools keep the full `/tools/resizer/tnpsc`), UTM + click ids from the URL, `document.referrer` host, and a first-landing record kept in `localStorage` (`cc_attr_first_landing`, written once per browser, shared by landing + tools in production); `setAttributionExtra({ ... })` lets any page/feature add to `extra`.
- Each app passes its identity once in `createAuthFeature({ attributionApp: "landing" | "tools" | "blog" })` — no per-component code.
- `authApi.loginUser` and `authApi.verifyOtp` (and the Truecaller web call) attach `attribution` automatically — so the modal, `/start`, tool modals and any future caller are covered with zero component changes. Page is captured **at the moment of the request**, so modal triggers, navigation, refresh and cross-page auth each report the page that actually initiated them.
- Backend: new `App\Services\Auth\AttributionService` (validate → derive source/channel → merge into `metadata` → return the touch) called from `varifyOtp` / `UserService::loginByPhone`; request validation in one place; PHPUnit tests (MySQL-only like the existing suite).

## 6. Amplitude tracking specification (as implemented)
No new event names. One reserved Amplitude type (`$identify`, user-properties only) is used for first verifications, which have no server event of their own.

**Naming:** plain `source` / `channel` / `page` already mean other things in project 673721 (`source` = product surface), so every Amplitude property here is prefixed. DB keys keep the plain names.

### Events and their properties
| Event | Sent by | When | Event properties added | User properties |
|---|---|---|---|---|
| `Verification Sent` | browser (`trackVerificationSent`) | OTP send succeeded | `attribution_page`, `attribution_app` (+ existing ones) | — |
| `Verification Resent` | browser | resend succeeded | `attribution_page`, `attribution_app` | — |
| `Verification Failed` | browser | send/resend failed | `attribution_page`, `attribution_app` | — |
| `Authentication Outcome` | browser (`trackAuthSuccess/Failure`) | each verify attempt (+ Truecaller) | `attribution_page`, `attribution_app` (+ `outcome`, `auth_method`, `failure_reason`) | — |
| `Signed Up` | server (`AuthController::login` / `loginByPhone`) | brand-new user created (at OTP send) | `attribution_page`, `attribution_app` (known at send time; **no source/channel yet — not verified**) | `signup_date` (existing) |
| `$identify` | server (`UserService::verifyUser`) | the user's **first** successful verification | — | `$set` last_touch_*, `$setOnce` first_touch_* + `acquisition_app` |
| `Login` | server (`UserService::trackLogin`) | a **returning** verified user logs in again | `attribution_source`, `attribution_channel`, `attribution_page`, `attribution_app` (+ `login_method`, `platform`) | `$set` last_touch_*, `$setOnce` first_touch_* + `acquisition_app` (replay is a no-op in Amplitude) |

### Property meaning
| Property | Kind | Values / example |
|---|---|---|
| `attribution_source` | event | `paid` \| `organic` \| `other` (server-derived) |
| `attribution_channel` | event | `facebook` \| `instagram` \| `google` \| `whatsapp` \| other utm source slug \| `unknown_paid` \| `search` \| `referral` \| `direct` |
| `attribution_page` | event | normalized pathname where the request was made: `/start`, `/contact-us`, `/tools/resizer/tnpsc`, `/tools/syllabus-tracker/ctet/full-exam` |
| `attribution_app` | event | `landing` \| `tools` \| `blog` \| `academy` \| `dashboard` \| `app` |
| `last_touch_source / _channel / _page / _at` | user (`$set`) | the most recent verification |
| `first_touch_source / _channel / _page / _landing_page / _at`, `acquisition_app` | user (`$setOnce`) | the first verification (never changes) |

### Page and tool identification
`page` is the real pathname at the moment of the request, lower-cased, query/hash dropped, locale prefix (`/hi`, `/mr`, `/tools/hi`) removed and reported as `locale`. Tools are therefore distinguishable by route (`/tools/resizer/tnpsc`, `/tools/resizer/htet`, `/tools/syllabus-tracker/ctet/full-exam`) — never a generic `/tools`. `landing_page` is the browser's first-ever landing page. Any page may add `extra` facts with `setAttributionExtra({ tool: "resizer" })` (stored in `metadata.attribution.extra`, validated: ≤ 20 keys, scalar values).

### First-touch vs last-touch
* `first_touch`: written once, at a user's first OTP verification (`is_verified` was false), only if absent. A user who was already verified before this feature gets **no invented first_touch** — only `last_touch` from their next login.
* `last_touch`: overwritten on every successful verification.
* `users.source` (existing indexed column, default `organic`): set once from the first_touch (`paid`/`organic`); never overwrites a deliberate value such as `meta_lead`; never changed by later logins.

### Example payloads (captured from the real local run, §9)
Paid, `/start` with `?utm_source=fb&utm_medium=paid&utm_campaign=ctet_leads_hi_20260820&fbclid=…`, referrer `l.facebook.com`:
```json
{"event_type":"Signed Up","event_properties":{"signup_method":"phone_otp","attribution_page":"/start","attribution_app":"landing"},"user_properties":{"signup_date":"2026-10-30"}}
{"event_type":"$identify","user_properties":{
  "$set":{"last_touch_source":"paid","last_touch_channel":"facebook","last_touch_page":"/start","last_touch_at":"2026-10-30T06:16:23Z"},
  "$setOnce":{"first_touch_source":"paid","first_touch_channel":"facebook","first_touch_page":"/start","first_touch_landing_page":"/start","first_touch_at":"2026-10-30T06:16:23Z","acquisition_app":"landing"}}}
```
Organic, resizer download on `/tools/resizer/tnpsc`:
```json
{"event_type":"$identify","user_properties":{
  "$set":{"last_touch_source":"organic","last_touch_channel":"direct","last_touch_page":"/tools/resizer/tnpsc","last_touch_at":"2026-10-30T06:13:40Z"},
  "$setOnce":{"first_touch_source":"organic","first_touch_channel":"direct","first_touch_page":"/tools/resizer/tnpsc","first_touch_landing_page":"/tools/resizer/tnpsc","first_touch_at":"2026-10-30T06:13:40Z","acquisition_app":"tools"}}}
```
Repeat login of that organic user through the landing modal on `/contact-us` (last touch moves, first touch stays):
```json
{"event_type":"Login","event_properties":{"login_method":"otp","platform":"web","attribution_source":"paid","attribution_channel":"direct","attribution_page":"/contact-us","attribution_app":"landing"},
 "user_properties":{"$set":{"last_touch_source":"paid","last_touch_channel":"direct","last_touch_page":"/contact-us","last_touch_at":"2026-10-30T06:17:59Z"},
  "$setOnce":{"first_touch_source":"organic","first_touch_channel":"direct","first_touch_page":"/tools/resizer/tnpsc","first_touch_landing_page":"/tools/resizer/tnpsc","first_touch_at":"2026-10-30T06:13:40Z","acquisition_app":"tools"}}}
```

### Identity (anonymous → authenticated)
Unchanged and deliberately not duplicated: the existing `onIdentify(uuid)` → Amplitude `setUserId(uuid)` joins the browser's anonymous device id to the user (new signup: right after the OTP is sent; everyone: after verify); every server event uses the same `uuid` as `user_id`, and `insert_id` is fixed when the event is created so queue retries cannot double-count. The UTM/first-landing record lives in browser storage, so attribution survives sessions and pages; Amplitude's own `initial_utm_*` first-touch is untouched.

## 7. Decisions (2026-10-30)
All proposals approved: non-landing/tools apps → `source = other`; channel rule as in §4; no invented first-touch for existing users; the `$identify` call; prefixed names; backend-first deploy with explicit approval (**nothing is pushed or deployed yet**); real routes stored. Plus (user): the existing `users.source` column is also set (see above).

## 8. What changed
Backend (`clearcutoff-main-backend`, branch `feature/attribution`):
* `app/Services/Auth/AttributionService.php` (new) — `sanitize`, `classify`, pure `merge`, locked `record`, Amplitude mappers.
* `AuthController` (`login` Signed Up props; `varifyOtp`; Truecaller initiate/login/iOS), `UserService` (`verifyUser`, `trackLogin`, `loginByPhone`, first-verification `$identify`), `AmplitudeEvent::UserPropertiesUpdated = '$identify'`.
* `tests/Feature/AttributionTest.php` (new, 20 tests).
Frontend (`clearcut-master`, branch `feature/attribution`):
* `packages/auth/src/attribution.ts` (new, pure) + `exports` entry; `api.ts` (attaches `attribution` after the zod parse to login / verify / Truecaller-initiate), `verification-events.ts` (page/app on auth events), `create-auth-feature.tsx` (`attributionApp`), `context.tsx` (`captureFirstLanding` on app load).
* `apps/landing|blog|tools/src/lib/*auth*.ts` (`attributionApp`), tools `PageViewTracker` (first-landing capture; `AuthProvider` is not mounted in tools).
No migration (existing `users.metadata` JSON and `users.source` columns).

## 9. Verification log (2026-10-30)
**Automated.** Backend `AttributionTest`: 12 pure-rule tests pass on sqlite; all 20 pass on a migrated scratch MySQL schema (HTTP-level: first verify, repeat login, existing verified user, garbage/absent attribution, spoofed source, `users.source` rules, `meta_lead` preserved). Rest of the backend suite is unchanged (same pre-existing failures with and without my change: 42 on sqlite, 1 on MySQL). Frontend `tsc`: tools 0 / landing 0 / blog 34 (pre-existing, none in auth); `check:colors` green.
**Real browser + real local backend + fake Amplitude endpoint** (headed Chromium; scratch DB; OTP read from the DB; SMS jobs deleted before the worker ran; Amplitude jobs delivered to a local capture server; every payload above is a captured one):
* PASS organic — tools resizer `/tools/resizer/tnpsc`: request body carried `app/page/landing_page/locale`; DB: `source=organic`, `first_touch = last_touch`, `reminder`/`action` untouched; `Signed Up` (+`attribution_page/app`) and `$identify` captured.
* PASS paid — landing `/start?utm…&fbclid` with `l.facebook.com` referrer: DB `users.source = paid`, `first_touch.channel = facebook`, `utm{}`, `paid_evidence = true`.
* PASS repeat login — organic user logs in through the landing modal on `/contact-us`: `first_touch` stays organic/tools, `last_touch` = paid/`/contact-us`, `users.source` unchanged, `Login` captured with attribution + user properties.
* PASS cross-page — land on `/start?utm_source=instagram&utm_medium=cpc…` (referrer `l.instagram.com`), navigate to `/privacy-policy` (no utm in URL), open the modal: `page=/privacy-policy`, `landing_page=/start`, utm + referrer carried by the session; DB `channel=instagram`, `paid_evidence=true`.
* PASS tracker — Syllabus Tracker "Save for Future": stored page `/tools/syllabus-tracker/ctet/full-exam` (the real in-tool route), `landing_page=/tools/syllabus-tracker`, organic.
* NOT VERIFIED: the browser's own Amplitude SDK (`setUserId`, `Authentication Outcome` / `Verification Sent` with the new properties) — the web SDK is disabled on localhost by design (`analyticsAllowedHere`), so those property additions are verified only by the code path/tsc, not by an emitted payload; the Truecaller path; the blog app (no env); a real SMS/production backend; load/concurrency beyond the unit test.
* **Incident (disclosed):** my first `/start` run used a landing dev server whose client bundle ignores the non-`NEXT_PUBLIC_` `NEXT_API_URL`, so ONE `POST /v1/auth/login` for the invented number +919123450002 went to the real **apptest** backend (it created that user row and queued an OTP SMS there; whether an SMS actually reached anyone is unknown). It was noticed when the local DB had no such user; every later call was guarded (non-local auth requests were aborted or forwarded to the local backend) and nothing else reached apptest. Needs a look from you (see the report).
