# DEVELOPMENT_RULES.md — ClearCutOff

> **Living rulebook. Read this file FIRST before starting ANY task (frontend or backend).**
> If you discover a new reusable component, pattern or convention while working, **add it here** in the same change. Outdated rules are bugs — fix them.

Related docs: root `CLAUDE.md` (monorepo/architecture details), backend `CLAUDE.md` (`C:\laragon\www\clearcutoff-main-backend`).

---

## 0. Task Workflow (mandatory order)

1. **Read this file.**
2. **Analyze existing code for the task** — find the closest existing page/component/hook/endpoint (`Grep`/`Glob`) before writing anything.
3. **Reuse.** Check the component catalog (section 3). Use it as-is → else extend it (new prop/variant) → else create a new reusable component that follows the design system.
4. **Compare any provided design/screenshot with the existing design system** and adapt the design to existing components/tokens. Do not copy the mock pixel-for-pixel with new colours, radii or fonts.
5. **Implement** following sections 2–7.
6. **Verify** (section 8) — tsc, eslint, `check:colors`, and a real screenshot for UI work.
7. **Update this file** if a new pattern/component/gotcha was introduced.

Hard "don'ts":
- Don't create a component when an existing one can be reused or extended.
- Don't introduce random colours, spacing, font sizes, radii, shadows or new UI patterns.
- Don't redesign things the user did not ask to change (e.g. `MyCourseCard` was explicitly kept as-is — client-approved).
- Don't add features the user didn't ask for (e.g. an extra "Next" button). Restyle only what's requested.
- Don't add a `Co-Authored-By: Claude` trailer to git commits (user preference). Commit/push only when asked.

---

## 1. Repository Map

Turborepo + pnpm. Frontend: `D:\clearcutoff-projects\clearcut-master`.

| Path | Purpose |
|---|---|
| `apps/dashboard` | Logged-in product (port 3020). Next 16 App Router, Tailwind v4, next-intl (en/hi/mr), Amplitude, Sentry |
| `apps/blog`, `apps/landing`, `apps/tools` | Public apps (different stacks of shared packages — see root `CLAUDE.md`) |
| `packages/*` (`@clearcut/*`) | Shared source-only packages. **No barrel files** — import the subpath: `@clearcut/ui/button` |

**Dashboard is a partial consumer.** It uses only `@clearcut/ui`, `utils`, `i18n`, `react-query`, `design-tokens`. Its own auth (`providers/AuthProvider.tsx`, token in localStorage + `auth_token` cookie), HTTP (`lib/api/client.ts` → `apiFetch`), Zustand stores (`src/store/*`) and analytics (`lib/analytics/*`) are **separate** from the shared packages. Never "fix" by pointing dashboard at `@clearcut/auth|api|state`.

Backend: Laravel 12 at `C:\laragon\www\clearcutoff-main-backend`, API at `http://clearcutoff-main-backend.test/api`.

---

## 2. Frontend Rules (apps/dashboard focus)

### 2.1 Folder conventions
- Routes: `src/app/[locale]/(protected)/...` (`(exam)` group = full-screen attempt experience, no dashboard shell).
- Feature code: `src/components/features/<feature>/` (components + `hooks/` + `constants.ts`).
- Shared primitives: `@clearcut/ui/*` first, then `src/components/ui/*` (dashboard-local), then `src/components/layout/*`.
- API functions: `src/lib/api/<domain>.ts`. Types live beside the functions.
- Navigation: always `import { Link, useRouter } from "@/i18n/navigation"` (locale-aware), never `next/link`/`next/navigation` router for app routes (`useParams`/`usePathname` from next/navigation are fine).

### 2.2 Data fetching
- Use `apiFetch` (`lib/api/client.ts`). Base URL is `NEXT_PUBLIC_LARAVEL_MAIN_BACKEND` and **includes `/api`**.
- Server state → **TanStack Query** hooks in `features/<feature>/hooks/` with explicit `queryKey` constants, `staleTime`/`gcTime`, and `invalidateQueries` after mutations (see `useDailyTestHistory`). Never refetch-on-mount with a skeleton flash for data that is already cached.
- Client-only UI state → Zustand store in `src/store/*`.
- **Public URL ids are UUIDs / opaque codes, never numeric DB ids.** API function signatures are id-scoped (`getDailyTestHistory(courseId)`, `startDailyTest(courseId, testId)`).
- The `courseId` in URLs is the **enrollment uuid**. Resolve to the exam via `useEnrollmentForCourse(courseId)` (matches by `uuid`), not by exam id.

### 2.3 Performance rules (exam/attempt screens)
- Per-second things (timers) live in isolated leaf components (`LiveTimeLeft`, `ElapsedClock`), never in a parent that re-renders the question tree.
- Use selector-based Zustand subscriptions (`useExamStore((s) => s.x)`); never subscribe to the whole store.
- Per-question timers use refs, not state.

### 2.4 i18n (en / hi / mr) — required for every user-visible string
- No hard-coded UI text. Use `useTranslations("<Namespace>")`.
- Add keys to **all three**: `messages/en`, `messages/hi`, `messages/mr`.
- New namespace file (`messages/{locale}/<name>.json`) **must be registered in the `load()` list in `src/i18n/request.ts`** — the namespace key can differ from the filename (`dailyTests.json` → `DailyTests`, `dashboardHome.json` → `DashboardHome`, `onboarding` → `Onboarding`).
- Dates/numbers: use `Intl` with the locale map (`en-GB`/`en-US`, `hi-IN`, `mr-IN`), never English month names.
- Verify by switching language in the UI (hi/mr) — text must not overflow layouts.

### 2.5 Analytics
- Dashboard uses Amplitude via `lib/analytics/*`; event names/payloads are typed in `types.ts` + `events/*`. `ANALYTICS_EVENT_CATALOG.ts` is documentation only — never import it.

---

## 3. UI Component Catalog — REUSE BEFORE CREATING

### 3.1 Shared (`@clearcut/ui/*`)
| Need | Use | Notes / gotchas |
|---|---|---|
| Button | `@clearcut/ui/button` | `variant`: solid/outlined/soft/plain · `color`: primary/danger/success/gray/neutral/warning · `size` · `leftIcon`/`rightIcon` · `sx={{ borderRadius: "50px" }}` for pill · `fullWidth`. Dashboard also has `MainButton`. |
| Card | `@clearcut/ui/card` | Default inline `height:100%` + `min-height:fit-content` and overflow hidden → to size to content add **`className="!h-auto !min-h-0"`**. Props: `bgcolor`, `border` (Tailwind class pass-through, e.g. `border-gray-200`), `padding`, `borderRadius`. |
| Text | `@clearcut/ui/text` | `variant` display-*/heading-*/body-*, `weight`, `color` (gray-normal/subtle/muted, primary-normal). Plain elements may use the typography classes `heading-*` / `body-*` directly. |
| Chip / badge | `@clearcut/ui/chip`, dashboard `StatusChip` | Don't hand-roll pills. |
| Select | `@clearcut/ui/select` (`Select` + `SelectOption`, `onValueChange`) | Replacement for old MUI Joy select. |
| Input | `@clearcut/ui/input`, `main-input` | |
| Skeleton | `@/components/ui/skeleton` / `@clearcut/ui/skeleton` | Use for loading states; match final layout. |
| Link, Breadcrumbs, Separator, Overlay, JsonLd, PageNotFound, SiteFooter | `@clearcut/ui/*` | |
| Icons | `@clearcut/ui/icons/*`, dashboard icon index (`ChevronIcon`, `TrashIcon`, `LockIcon`, `WarningCircleIcon`, `SandTimerIcon`, `MainAppLogo`…), then `lucide-react` | Don't paste new inline SVGs if an icon exists. `MainAppLogo` default height is 61px. |

### 3.2 Dashboard-local (`src/components/...`)
- Modals: `Modal` / `ModalHeader` / `BottomSheet` (mobile sheet). Paywall: `PayWalls/LockedContentModal` + `usePaywallsStore.open(modalKey, exam, source, course)` — every Upgrade CTA opens this, its "Unlock Now" continues to `/payment/initiated`. Closable.
- Tabs: `TabSwitch`; exam `SectionsTab`, `QuestionReportTabs` (equal-width via `w-full [&>button]:flex-1`).
- `ProgressBar`, `CounterCard`, `Pagination` (`ui/widgets/pagination/Pagination`), `QOption`.
- **Attempt UI** (`features/attempt-ui/`): `AttemptTopbar` (`leading` slot for mobile), `AttemptSummaryStrip`, `AttemptActionBar` (`legacy`, `compactMobile`), `LiveTimeLeft` (`variant="inline"`), `InfoStrip`, `StatusCountRow` (colored-dot + label + count legend row), `QuestionsDock` (collapsible mobile-only "Questions" panel — grid + `QuestionStatusLegend`, takes normalized `{status, isActive}[]` + `onSelect`; presentational, so it doesn't reach into either page's store — each page maps its own active-section questions into that shape), etc. Used by BOTH full-length exam and daily-test attempt — **change once, both update**. Exam shell: `layout/exam/{ExamShell,Topbar,TimerStrip,Sidebar,TestInfoSidebar}` — 3-column desktop layout: `TestInfoSidebar` (left, Exam/Section/Total Questions/Total Marks/Duration via `useExamSummary()`) / `{children}` question card (center) / `Sidebar` (right, question navigator — `QuestionNavigatorSheet`). Deliberately mirrors the Daily Test attempt page's own left-Test-Info/center-question/right-Questions-panel layout (`daily-test-attempt/[courseId]/[testId]/[[...attempt]]/page.tsx`) so the two attempt screens read as the same pattern; the full-length exam keeps its own section-accordion + Summary/Question-View toggle inside the right panel since Daily Test has no multi-section equivalent. `useExamSummary()` (`features/exam/hooks/`) is the single source for both the topbar title/meta and the Test Info panel's fields — don't recompute exam totals/duration separately in a new consumer, extend the hook.
- **Daily tests** (`features/daily-tests/`): `DailyTestHistoryRow`, `TestInfoPanel` (Subject row only if `subject` prop passed), `InfoRow` (`compact`), `PremiumUpsell`, `DailyTestExamCard`, hooks `useDailyTestHistory|Result|Attempts`, `useEnrollmentForCourse`.
- Home/Learn widgets: `layout/dasbboard/pages/LearnPage`, `HomeGreeting`, `ui/widgets/*` (DailyTestWidget, TodayGoals, NextMilestone, QuickRevision, LearningStreak, AppDownload). `MyCourseCard`/`MyCoursesWrapTwo` — **do not restyle**.
- **Preparation bottom bar** (`layout/preparation/`): `BottomBarV2.tsx` is the live one (phones < md render V1 unchanged; from md up: contextual Add/Change Paper · Previous · Topic Test · Next; layout adapts when a slot is missing — see its docblock). `BottomBar.tsx` (V1) is kept untouched — restore by switching the one import in `features/preparation/pages/preparationPage.tsx`. It is responsive by **container width** (`@container` + `@[800px]:`/`@[960px]:` variants — beside the 400px sidebar, viewport breakpoints mis-fire); class names per container-query mode must be spelled out literally. `BottomBarV2View` is the pure layout (no store/network) so all slot combinations can be previewed with a throw-away page. `line-clamp-*` sets its own `display`, so never put it on the same element as `md:block`/`hidden` — clamp an inner span.
- Nav: `config/navigation.ts` (`activePrefixes`, `isNavItemActive`) — a nav item stays active across its nested routes (e.g. Learn stays active inside daily-tests).

### 3.3 Reuse decision ladder
1. Exists and fits → use as-is.
2. Exists but lacks a prop → **extend** it (optional prop, default = old behaviour, so other screens don't change). Verify all callers.
3. Nothing fits → create a new component in the right layer (shared if ≥2 apps/features could use it, else the feature folder), built from `Card`/`Text`/`Button`/tokens, with i18n strings passed in/`useTranslations`.
4. Small one-off layout helper used by a single file (e.g. `Stat` in `DailyTestHistoryRow`) may stay local.

---

## 4. Design System Rules

- **Colours: tokens only.** Source: `packages/design-tokens/tokens.css` (+ dashboard `src/styles/tokens.css`). Families: `--color-brand`, `--color-primary-bg-soft`, `--color-success-bg-soft`, `--color-danger`, `--icon-positive-*`, `--icon-negative-*`, `--icon-notice-*`, `--background-gray-subtle`, `--color-surface-gray-*`. Use via Tailwind (`text-brand`, `text-surface-gray-muted`) or `var(--…)`.
- **Never** write hex/rgb/hsl/oklch literals or `bg-[#…]` — `pnpm check:colors` fails CI (per-package baseline can only go down). Need a new colour → add a token, not a literal.
- Tokens can resolve differently per app (`--color-brand-dark`: dashboard `#0053a2`, blog shadows with `#006bd1`). Check the app's own CSS.
- **Typography:** `heading-*`, `body-*` classes / `Text` variants. Emphasis via `!font-bold|semibold`. No arbitrary `text-[13px]`.
- **Spacing/layout:** Tailwind scale (`gap-3|4`, `p-4 md:p-6`). Page container: `mx-auto max-w-[1200px] p-4 md:p-6`. Radii used: cards 12px, pills fully rounded, nav elements per existing components.
- **Breakpoints** (dashboard `globals.css`): xs 500, sm 640, md 768, 2md 900, lg 1024, 1lg 1150, tablet 800. Mobile-first; verify at ~390px and ~1440px.
- **z-index/shadows:** use `--z-*` / shadow tokens; don't merge tokens across apps.
- **Tailwind v4 `@source`:** a shared package emitting utility classes must be listed in each consuming app's `globals.css` (`@source "../../../../packages/X/src/**/*.{ts,tsx}";`) or its classes silently don't generate.
- Consistency: same screen type ⇒ same header/card/tab/pagination look everywhere (see Daily Tests list ↔ history ↔ result).

---

## 5. Shared-package Rules
- No barrel files; add exports via the package's `exports` map (`"./name": "./src/name.ts"`).
- `createPersistedStore` always uses `skipHydration: true`; hydrate via `useHydrateStore` in a mounted client component. Don't bypass.
- New package → extend `tsconfig.base.json`.
- Cross-cutting change → check whether dashboard needs the same change separately.
- **Shared-package behaviour changes must be additive.** `@clearcut/auth` gained `onAuthenticated` (stay on the page after login) and `LoginCopy` (per-mount copy override) as *optional* inputs whose absence leaves blog/landing byte-for-byte on the old path — verify by running landing's login (`/dashboard?token=` redirect + original copy) after touching it. See root `CLAUDE.md` "Tools: Save for Future".

---

## 6. Backend Rules (Laravel 12)

- **Layering:** Route (`routes/Apis/V2/*.php`, registered from `routes/api.php`, `auth:sanctum`) → Controller (`app/Http/Controllers/API/V2`) → Service → Repository (interface bound in `AppServiceProvider`) → Resource. Keep controllers thin; business logic in Services.
- **Responses:** always `App\Helpers\ApiResponse` → `{ status, message, data }`.
- **Models:** prefixes E* (exam), S* (subject), U* (user), Mapping*; use `HasUuid`. **Never edit stale `* copy.php` files.**
- **Public identifiers = UUIDs**; never expose numeric ids or internal ids in URLs/responses when a uuid exists.
- **Authorization (IDOR-safe):** resolve every nested resource through ownership chain and return **404 (not 403)** on any failure. Daily tests: enrollment(uuid, own, active) → assignment(user, exam, test) → attempt(user, test, uuid).
- **Validating maps keyed by user-visible names (e.g. `subjects`: `{ "E.V.S.": [...] }`):** never use `a.*.*.b` wildcard rules — Laravel's dot-notation expansion mis-parses keys containing `.` and silently drops them from `validated()`. Validate with a closure and rebuild the stored array from known keys.
- **MySQL `JSON` columns re-sort object keys (length, then bytes).** Never rely on key order of a stored JSON object — derive the order from its source of truth (e.g. the tracker's subject order comes from the live syllabus tree) or store a list.
- **Store ids, derive display data.** `user_syllabus_trackers` keeps only `exam_id` / `root_navigation_id` / `navigation_id` (NULL = unscoped, never a `0`/`"full-exam"` sentinel) plus the user's `progress`; names, logos, subjects and chapters come from the current syllabus via `SyllabusTreeService` and follow `?locale=en|hi|mr`. A NULL-able column inside a unique key needs a **VIRTUAL** generated column (`IFNULL(col,0)`) — MySQL forbids `ON DELETE CASCADE` on the base column of a **STORED** one.
- **Sanitize responses:** whitelist fields (e.g. `publicMeta`, sanitized `topic_meta`) — no raw model dumps.
- **Migrations:** new migration per change, reversible `down()`, never edit an already-run migration. Run locally, verify.
- **Data:** DB timezone +05:30. Daily-test questions come from `question_new` (`QuestionNew` + `QuestionTrans`).
- **Style:** Laravel Pint (`vendor/bin/pint --dirty`). Heavy work → queued jobs. Errors → Sentry.
- **Tests/fixtures:** create temporary users/tokens/rows for manual verification and **delete them afterwards**. Prefer `tinker --execute` (interactive tinker hangs).
- Frontend + backend contract changes must ship together; update TS types in `lib/api/*` when a response shape changes.

---

## 7. Security Checklist (every endpoint/page)
- Auth required; ownership verified server-side; 404 on mismatch.
- No numeric ids in public URLs.
- No secrets/tokens in URL query strings, logs or committed files (`.env` is gitignored; update `.env.example` for new vars).
- Validate input (FormRequest/Zod); never trust client-computed scores/permissions.

---

## 8. Verification Workflow (before saying "done")

Frontend (from repo root / `apps/dashboard`):
```sh
npx tsc --noEmit -p .          # THE type check (dashboard/blog build ignores TS errors)
npx eslint <touched paths>
pnpm check:colors              # design-token guard
pnpm turbo run build --filter=dashboard   # when routes/config/i18n changed
```
- `next build` green ≠ type-correct. Only `tsc` counts.
- **UI work must be visually verified**: real browser screenshot (headless Chrome script or Chrome tool) at desktop + mobile, in `en` and one of `hi`/`mr`, incl. loading/empty/error/locked states.
- Backend: exercise the endpoint with a real token (unauthorized/other-user → 404), run Pint, clean up fixtures.
- Report honestly: failing checks are reported with output; skipped steps are stated.

---

## 9. Environment Gotchas (Windows)
- Dev server: dashboard on port 3020 (`next dev -p 3020`, `NODE_OPTIONS=--max-old-space-size=4096` if low on memory / Jest-worker 500s). Don't start a second one; stop before restarting.
- Renaming/moving folders fails with "Permission denied" while the dev server watches them → stop the server first, then `git mv`.
- `scrollIntoView` shifts overflow-hidden shells → scroll the container (`el.scrollTo`) instead.
- Multi-line scripted edits: write a script file (Python) instead of shell heredocs with quotes.
- Git Bash `/tmp` ≠ Windows temp; use the scratchpad dir for temp files.

---

## 10. Known Pitfalls (learned the hard way)
- Fixed-height `Card` overflow → `!h-auto !min-h-0`.
- Colour literal (`#000`) in a component fails CI → use a token.
- Course-card data: `get-course` resolves by enrollment uuid/group_code, not exam id; eager-loads may lack `name`.
- `language-modal` selected-state bug (uses route `locale` not `appLanguage`) is pre-existing.
- Image Resizer (`apps/tools`): JPEG size targeting lives in `src/lib/jpegBudget.ts` — aim at 98% of the max (never the min), keep the highest quality under the max, and check bytes against `KB × 1024` (not rounded KB). Switching document type must clear the image via `clearImageState()` and async work must check `workspaceVersionRef`. `apps/landing/src/components/pages/ResizeImageTool.tsx` is a separate copy of the same tool and still has the old one-way quality loop.
- Stray WIP files under `apps/dashboard/src/app/[locale]` (`page copy.tsx`, `test/`, `sentry-example-page/`) are not product surface.
- **Zustand selector must never construct a new object/array as its return value** (e.g. `useStore((s) => s.exam?.sections ?? [])`) — the `?? []` fallback (or any inline `{}`/`[]`/spread) is a fresh reference on every call, and zustand's `useSyncExternalStore`-based subscription treats "snapshot changed" as a reason to re-render, which re-runs the selector, which returns yet another new reference — an infinite loop (`Maximum update depth exceeded`), caught by the nearest error boundary as a blank/500 page with no other symptom. Select the stable field only (`useStore((s) => s.exam)`) and derive the fallback in the component body against a module-level constant (`const EMPTY: X[] = []; const sections = exam?.sections ?? EMPTY;`) — see `QuestionNavigatorSheet.tsx`.
- A `useMemo` keyed on a store sub-array (e.g. `[sections]`) won't recompute after a store action that **mutates a nested object in place** and only replaces the top-level object (`set({ exam: {...exam} })` — the exam store's `answer`/`toggleReview`/`clear` all do this). The array reference is unchanged even though its contents changed. Depend on the top-level object instead (or in addition): `useMemo(fn, [exam, sections])`.
- **`next/dynamic`-loaded modals whose content only fetches on mount have a chunk-then-fetch waterfall** — the data request doesn't start until the JS chunk has downloaded and the component has mounted, on top of the chunk download itself. `MyCoursesWrapTwo.tsx` lazy-loads several course/payment modals this way (deliberately, to keep the high-traffic Learn dashboard's initial bundle small — don't undo that). Fix by prefetching the query (`queryClient.prefetchQuery`, same `queryKey`/`queryFn`/`staleTime` the modal's own hook uses — export a small `prefetchX` helper next to the hook so they can't drift into two different cache entries) as soon as the id is known, not on click — see `useLevels.ts`'s `prefetchLevels` + `MyCoursesWrapTwo`'s `examIdsNeedingSelection` effect, which warms `BuySigleCourseModal`'s data ahead of time for any course still missing a paper/subject pick. The same gap likely applies to the other lazy modals in that file (`EditCourseModal`, the payment modals) if one of them turns out slow to open.

- **Error monitoring (404/500) — reuse `@clearcut/error-reporting`**, don't hand-roll: `redactUrl/redactSearch/scrubSensitiveData` in every `beforeSend`, `classifyNotFound` + `createPageErrorReporter` for not-found pages and error boundaries. Never `captureMessage` every 404 (noise) and never breadcrumb-only (invisible) — see root `CLAUDE.md` "Error tracking". A caught-and-returned error in an API route handler never reaches `onRequestError`: call `Sentry.captureException` in the catch.
- **`instrumentation.ts` belongs in `src/`** when the app dir is `src/app` (Next only scans the parent of the app dir; `instrumentation-client.ts` is found in either place). `global-error.tsx` must be at `app/global-error.tsx`, not under `[locale]/`.
- **`window.next.router.push()` to a route that doesn't exist falls back to a hard navigation** — a broken Link therefore usually shows up as a same-site-referrer 404, not an in-app one. `PerformanceNavigationTiming.name` stays the initially loaded URL after `pushState`, which is what `classifyNotFound` relies on.
- **Firefox for Android doesn't reliably support navigating a hidden iframe to a custom URL scheme** (`packages/auth/src/truecaller.ts`'s `useTruecallerAvailability`) — that iframe technique exists to dodge a *different*, Chrome-only problem (WhatsApp's Custom Tab replacing the whole page on a top-level scheme navigation), and silently doesn't work in Firefox, so the ambient "is Truecaller installed" probe always timed out `"unavailable"` there and then **permanently cached that wrong result for 180 days, cross-subdomain**, hiding the button on every later visit in any browser on that device. `isAndroidFirefox()`/`isTruecallerSupportedBrowser()` already correctly included Firefox — the bug was downstream, in a detection *mechanism* not being cross-browser safe, not in the platform check. Fixed by skipping the ambient probe entirely for Firefox (trust the platform check, rely on `useTruecallerLogin`'s existing reactive `APP_OPEN_GRACE_MS` fallback instead, same as an app-not-installed Chrome user already gets). General lesson: a browser-detection allowlist being correct doesn't mean every *technique* gated behind it works in every browser on that list — verify the actual mechanism, not just the UA check.
- **A `keepalive: true` fetch flushed on tab-hide/unmount can have its page torn down before `apiFetch`'s own catch block gets to wrap the failure** — the raw `TypeError: Failed to fetch` slips out un-wrapped instead of the usual `ApiError`, so an `isApiError(err) && err.isNetworkError` guard silently fails to match it (Sentry CLEARCUTOFF-NEXTJS-APP-2T, `useStreakTracker.ts`'s keepalive flush — reported as a bare TypeError with no `ApiError` in the chain). Use `isNetworkFailure(err)` (`lib/api/api-error.ts`) instead of that check anywhere a fire-and-forget write catches its own rejection — it matches both the wrapped and un-wrapped shape. Separately, `Sidebar.tsx`'s `setResumeState` background sync had no network-failure suppression at all (unlike `useStreakTracker.ts`, which already had the right idea for its own endpoint) — every retry-exhausted mobile network blip on `/preparation/:courseId` was reported as its own error, concentrated in Facebook/Instagram/Chrome-Mobile-WebView traffic (CLEARCUTOFF-NEXTJS-APP-74, 173 events/94 users). Both now route a non-actionable `isNetworkFailure` through `logger.breadcrumb` instead of `logger.error` — still visible as context on a later, unrelated error, not its own noisy issue; a genuine 4xx/5xx is still reported as an error either way.
- **Never put a long-lived auth token in a URL/deep link.** `apps/dashboard/src/components/ui/widgets/app-download/app-download-widget.tsx` (the "Continue in App" widget) used to embed the real Sanctum token directly in `clearcutoffapp://auth?token=<token>` — a URL can end up in browser history, referrer headers, or app logs, any of which would leak a permanent credential. Fixed by minting a short-lived (90s), single-use handoff code from the backend first (`createAppHandoffCode()`, `lib/api/authHandoff.ts` → `POST /v1/auth/handoff/create`) and putting *that* in the URL instead (`?code=`); the RN app exchanges it server-side for a real token (`POST /v1/auth/handoff/exchange`, see the RN repo's and backend repo's `CLAUDE.md` for the native/backend halves). If you ever need to hand off an authenticated web session to the native app again, mint a code — never pass the token itself, even "just this once."
- **`apps/dashboard/public/.well-known/assetlinks.json` had a wrong package name and an unfilled placeholder fingerprint** (`PASTE_YOUR_SHA256_HERE`) — meaning Android App Link (`autoVerify`) verification for `app.clearcutoff.in` could never have actually succeeded in production, despite the file existing and looking "configured." Fixed with the real package (`com.clearcutoff.app`) and the release keystore's real SHA256. A `.well-known` file existing is not the same as it being *correct* — always check the actual values, not just presence, when touching App Links/Digital Asset Links.
- **A `try`'s `finally` still runs after a `return` inside that `try`** — don't write a comment claiming a `finally`-driven reset (e.g. `setSubmitting(false)`) is "skipped" on some early-return path; it isn't, `finally` always runs. Caught this while adding a `return` after the success path in `BuySigleCourseModal.handlePurchase` — the comment was wrong, not the code; removed the comment rather than restructure around it.
- **A user-initiated submit (someone's actively waiting on it, e.g. "New Exam Added" purchase in `BuySigleCourseModal.handlePurchase`) needs different network-failure handling than a background sync** (contrast with `isNetworkFailure` → `logger.breadcrumb`-only above): still show the user a retry-able error message (there was none at all before — a failed purchase silently reset the button with zero feedback, Sentry CLEARCUTOFF-NEXTJS-APP-A7, another Instagram-in-app-browser network blip), but *also* still route it through `isNetworkFailure` so a non-actionable blip is a breadcrumb, not an error-level Sentry report, while a genuine 4xx/5xx stays error-level. Also worth checking for: a promise that *resolves* without throwing but without the expected `status: "success"` shape — that path was completely unhandled here too (no error shown, nothing reported) and needed the same treatment. New user-facing copy goes through `useTranslations`, all three locales (`messages/{en,hi,mr}/modals.json`), never hardcoded — even for a small addition.
- **Meta (Facebook) Pixel advanced-matching fields (`ct`/`st`/`zp`/`country`) only get auto-hashed and sent when set via `fbq('init', pixelId, {...})`, never inside a `track()` call's own custom-data object** — that's already documented at `packages/utils/src/meta-geo.ts` (`getMetaGeoData()`, IP-geolocated via `ipapi.co`, cached in `sessionStorage`) and `packages/auth/src/facebook-pixel.ts`, but the pattern wasn't reused everywhere: `apps/landing`'s only event (`PageView`, the highest-volume event platform-wide) never called `getMetaGeoData()` at all, and `apps/dashboard`'s `Purchase` (`useRazorpayPayment.ts`) / `CustomizeProduct` (`payment/initiated/page.tsx`) fired via the bare `trackFacebookEvent()` with no `init()` before them — `Purchase` especially, since it also fires from paywall modals (`MainPaywall`, `PreparationPaywall`, `full-course-payment-modal`) that never visit `/payment/initiated`, so there was no earlier page-level `init()` for it to inherit. Fixed by adding `trackFacebookEventWithUserData()` (`apps/dashboard/src/lib/analytics/facebook-pixel.ts`) — the one shared "init-then-track" helper, reused at every gap — and, for landing specifically, making the effect that awaits `getMetaGeoData()` the *sole* place `PageView` fires (the inline bootstrap script's own immediate `track('PageView')` was removed) rather than firing it twice. Don't add a new Meta event call site with a bare `fbq('track', ...)` — check whether it needs advanced matching, and if so use the shared helper, not a new copy of the init-then-track sequence.
- **`ipapi.co` (the free, unauthenticated geolocation API `getMetaGeoData()` depends on) returned an HTTP 403 Cloudflare bot-challenge page when checked from this dev environment** — reproduced both via a real browser `fetch()` and a plain `curl` with a realistic User-Agent, so not a User-Agent-sniffing issue. `getMetaGeoData()`'s existing try/catch already degrades gracefully (falls back to `{ country: 'in' }` only, doesn't break the event), so this doesn't crash anything, but it means city/state/zip can go silently missing even with the wiring now fixed everywhere, if `ipapi.co` is blocking the request. Unconfirmed whether this affects real end-user browsers/IPs the same way it did this dev environment's IP — flagged, not fixed, since swapping geolocation providers (or moving to server-side geo, e.g. Cloudflare's `request.cf.city`/`region`/`postalCode` if these apps sit behind Cloudflare) is a bigger infra decision than this fix's scope.
- **`apiFetch`'s final `return res.json() as Promise<T>` (`lib/api/client.ts`) was never wrapped in try/catch** — the only unhandled step in an otherwise fully-wrapped function. A body-read failure *after* headers/status already arrived OK (connection dropped mid-stream — an in-app browser backgrounding the tab mid-response is the common real case) skipped all of `apiFetch`'s own `ApiError` wrapping and reached the caller as a raw TypeError, with none of the endpoint/status/breadcrumb context every other failure path gets (Sentry CLEARCUTOFF-NEXTJS-APP-A9). Now wrapped the same way the `fetchWithRetry` catch above it already is — but `isNetworkError` is only set when the underlying `cause` is a `TypeError`; a `SyntaxError` from `JSON.parse` (the backend actually sent malformed JSON — a real bug) stays a full error rather than getting miscategorized as a network blip and suppressed by `isNetworkFailure` downstream. If you ever add another step after `res.ok` is confirmed true, wrap it too — "we already checked `res.ok`" doesn't mean nothing else in that step can fail.
- **`isNetworkFailure()`'s regex (`/fetch/i`) only matched Chrome/Firefox's network-error phrasing, not Safari/WebKt's** — Safari says "Load failed" for the exact same condition (CLEARCUTOFF-NEXTJS-APP-A9, iOS Instagram in-app browser), which contains neither "fetch" nor anything the old pattern caught. Widened to `/fetch|network|load failed/i` (also picks up React Native's "Network request failed"). If you add a network-blip check anywhere, don't assume "Failed to fetch" is the only browser phrasing — check what Safari/WebKit says for the same condition too.
- **`sentryApiClient` (`lib/sentry/sentry-api-client.ts`) is the shared wrapper behind ~10 dashboard hooks** (`useMyActiveCourses`, `useGetCurrentCourse`, `useLearningStreak`, `useGetExam`, `useChapterData`, `useMiniTestQuestions`, `useRazorpayPayment`, …) and had zero `isNetworkFailure` awareness — every failure from every one of those hooks reported as a hard Sentry error regardless of cause, unlike the one-off fixes already applied to `Sidebar.tsx`/`useStreakTracker.ts`/`BuySigleCourseModal`. Fixing it here once (route `isNetworkFailure` to `logger.breadcrumb`, same as those) covers every current caller and any future one — this is the right layer for this fix, not another endpoint-by-endpoint patch. The thrown error/control-flow to the caller (React Query, etc.) is unchanged; only what gets reported to Sentry differs.
- **A recurring run of `API 429` errors on `/preparation/:courseId`** (`get-my-active-courses`, `get-section-chapters`, `resume-state` — all three hitting on the same trace within the same second) is a genuinely separate, *unresolved* question from the network-blip fixes above: whether the backend's general `api` rate limiter (60/min per user, `RouteServiceProvider.php`) is too tight for how many requests this page's own real, expected usage (rapid section/chapter/topic navigation) fires per minute, or whether the page is making more requests than it needs to. Flagged, not fixed — raising a rate limit is a security/capacity trade-off the backend owner should decide, not something to change unilaterally while investigating a symptom.

---

- **The shared OTP screen pre-fills `4321` for the dummy phone `9988776655`** (and the backend accepts it) — automated tests must press *Verify OTP*, typing extra digits is ignored by `maxLength`. The local dev backend throttles OTP sends (3/min per phone): `php artisan cache:clear` between repeated logins.
- Backend tests: the repo's full migration chain does not run on the sqlite `:memory:` test DB (an older `daily_tests` migration breaks it) — DB-touching feature tests use `DatabaseTransactions` against a migrated MySQL DB (`DB_CONNECTION=mysql php artisan test --filter=…`).

---

## 11. Changelog of this file
- 2026-09-26 — Added preparation BottomBarV2 (V1 kept for restore) and the `line-clamp` + `md:block` gotcha.
- 2026-09-26 — Added Tools Save-for-Future rules (additive shared-auth options, lazy login UI, local-never-overwritten), dotted-key validation + MySQL JSON key-order backend gotchas.
- 2026-09-25 — Added error-monitoring rules (shared `@clearcut/error-reporting`, instrumentation.ts location).
- 2026-09-22 — Initial version (analysis of monorepo, dashboard, backend, daily-test/exam UI work).
