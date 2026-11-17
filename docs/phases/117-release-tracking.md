# Phase 117 — Release tracking (Jira release comments + Sentry release/deploy records)

**Tickets:** (new, from user)
**Repos:** CM (blog, landing, dashboard) · BE
**Branch:** `feat/release-tracking` (CM) — not committed, not pushed. BE branch not created yet.
**Created / start date:** 2026-11-17
**Status:** In Review — code complete and tested (45 tests, real dry-runs on both Coolify instances). Nothing has written to Jira or Sentry yet. Real-service validation + go-live wait on the secrets and on merging the workflow to `main` (see §10).

> Rules from the user: full Git SHA = release version · Jira + Sentry updates only AFTER the deployment actually succeeded · no backfill of old releases · existing deploy workflows untouched · non-blocking · retries must not create duplicate Jira comments or Sentry records.

---

## 1. Problem / objective
Every merge to `main` is a production release, but nothing links a release to its Jira tickets, and Sentry releases carry no commits and no deploy (audit 2026-11-17: all releases have `lastCommit: null`, `deploys: []`, unfinalized; `laravel-backend` has no releases). Goal: after a deployment succeeds, comment on each related Jira ticket and attach commits + a deploy to the matching Sentry release, so a Sentry error maps to the exact release, its commits and tickets.

## 2. Scope
- **In:** backend (Laravel, Coolify #1), landing (Coolify #1), dashboard + blog (Coolify #2). Jira comments on `CC-*` tickets. Sentry: commits, finalize, deploy for the release named by the full SHA. Backend gets `SENTRY_RELEASE` so its events carry the release.
- **Out:** backfilling old Sentry releases/Jira tickets, changing existing deploy workflows (`ci.yml`, `deploy.yml`, Cloudflare ones), Astro `/go`, CMS, tools, ticket transitions, Sentry source-map / SDK changes.

## 3. Verified deployment flow (2026-11-17)

| App | Runs on | Deploy trigger | Success signal | Notes |
|---|---|---|---|---|
| Backend web `clearcut-main-backend` | Coolify #1 (4.5.3, `65.108.49.3`) | GitHub push webhook (`is_webhook: true` on 118 records; some manual redeploys `is_webhook: false`) | deployment `status = finished` for the commit. Health check ON (`/up`), so Coolify only switches containers once the new one is healthy (rolling update, docs) | The same SHA can have 2 deployment records (manual redeploy) → dedupe by SHA, not deployment id. `post_deployment_command` (artisan optimize) exists; whether its failure fails the deployment: **not verified** |
| Backend worker `clearcut-backend-queue-worker` | Coolify #1 | not inspected | — | Same repo; the web app is the release signal |
| Landing `clearcutoff.in` | Coolify #1 | push webhook, **path-filtered** (`watch_paths`: `apps/landing/**`, `packages/**`, root lockfiles, `nixpacks.toml`) | `status = finished`. Health check OFF, so "finished" = container started (Coolify docs: no health check = started counts as ready) | 48 finished / 2 failed in the last 50 (real failed SHAs: `9ef05c1`, `214cfd0`). Dashboard-only commits (e.g. `64094e7`) never deploy landing |
| Dashboard `app.clearcutoff.in` (`clearcut-dashboard`, uuid `eeexh9bwpfhutfe6f1yomflf`) | Coolify #2 (Oracle, `140.245.112.235`, v4.7.5) | GitHub-App source, push webhook (`is_webhook: true` on the 10 latest of 48), path-filtered (`apps/dashboard/**`, `packages/**`, root lockfiles, `nixpacks.toml`) | `status = finished`. Health check OFF → "finished" = container started. A deploy takes ~10 min (e.g. `64094e7` 10:36 → 10:46) | Repo `MuhammadArslan-Dev/clearcut-turbo`, branch `main` |
| Blog `academy.clearcutoff.in` (`clearcut-blog`, uuid `zjszwdcgoht9gh1nrydyqysw`) | Coolify #2 | **Manual only**: public-repo source, no GitHub App, all 7 records `is_webhook: false`. Latest `0eeebc6` (2026-11-14), several commits behind `main` | `status = finished`; health check OFF | Never deploys on push → a push-triggered tracker would be wrong; the reconciler records a release only when someone presses Deploy |
| Backend + worker copies on Coolify #2 (`imjqgtjndcbmpmsg0ivkm5vj`, `gc5watpjwzduloh6snvy8f8f`) | Coolify #2 | manual, last deploy 2026-11-03 (`1a23e97`), no custom domain (only `*.sslip.io`) | — | Looks like a stale standby copy → **excluded** from tracking (decision D5, needs user confirmation) |

API used (verified): `GET {panel}/api/v1/deployments/applications/{uuid}?skip=&take=` → `{count, deployments[]}`; default page = 10 rows, so the tracker must page with `skip`/`take`. Record has `commit` (40-char SHA), `status`, `deploy_started_at`, `finished_at`, `is_webhook`, `commit_message`. Optional later upgrade (not a dependency): Coolify ≥ 4.7 can sync each deployment to GitHub Deployments (needs a private GitHub App with Deployments: write; `github_deployment_id` is `None` on all records today), which would feed Jira's Deployments view natively for the dashboard only.

Coolify deployment `status` values (Coolify source): `queued`, `in_progress`, `finished`, `failed`, `cancelled-by-user`, `skipped`. Record fields used: `commit` (full SHA), `status`, `finished_at`, `application_uuid`, `is_webhook`.

Consequence: one push can deploy 0..N apps, so a "release" is **per (app, SHA)** and must follow Coolify's deployment record, never the git push.

## 4. Design (final workflow)
Reconciler, not push-triggered:
1. `release-tracking.yml` (new file; `schedule` every 5 min + `workflow_dispatch` with optional `app`/`sha` for retries). Own `concurrency` group. `ci.yml` and the deploy workflows are not touched.
2. For each configured app it reads Coolify's deployment history (read-only API token) and picks deployments with `status = finished`, newer than the app's **baseline SHA** (the last finished deployment when tracking is switched on → no backfill).
3. A deployment is *released* only if finished. `queued` / `in_progress` → wait for the next run. `failed` / `cancelled-by-user` / `skipped` → no Jira/Sentry write, one log line.
4. Commit range = previous finished deployment SHA of the same app `..` this SHA, limited to the app's watched paths. Jira keys: regex for project `CC` in commit subject/body (merge subjects carry the branch name and key, e.g. `Merge fix/cc-190-…: … (CC-190)`). No key → no Jira comment; unknown ticket (404) → skipped and logged.
5. **Jira:** one comment per (ticket, app, SHA): app, environment `production`, deploy time (IST), full + short SHA, compare link, that ticket's commits, Sentry release link, and a hidden marker `release-tracker:v1 app=<app> sha=<sha>`. Before writing it lists the ticket's comments and skips if the marker exists → re-runs never duplicate.
6. **Sentry:** release name = full SHA (existing frontend releases already use it; backend gets `SENTRY_RELEASE=$SOURCE_COMMIT` in Coolify). Steps: ensure release exists → set commits → finalize → create deploy `production`, each skipped if already present (deploys cannot be deleted, so the check is mandatory). Projects: dashboard → `clearcutoff-nextjs-app`; landing + blog → `clearcutoff-public`; backend → `laravel-backend`.
7. **Non-blocking:** each integration step is isolated; a Jira or Sentry failure is logged as a warning, the other integration still runs, and the next scheduled run retries (state lives in the Jira marker and Sentry itself, no database). Nothing in the deploy path depends on this workflow.

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-17 | Version = full Git SHA | user |
| 2026-11-17 | Update only after deployment success, not on push | user |
| 2026-11-17 | No backfill; non-blocking; keep existing workflows | user |
| 2026-11-17 | Scope: blog + landing + dashboard + backend (Coolify) | user |
| 2026-11-17 | D1: verify Coolify #2 (dashboard + blog) via a read-only API token the user creates | user (waiting on token + panel URL) |
| 2026-11-17 | D4: one tracker in the monorepo for all five apps; backend commits read through a GitHub token with read access to `dalal-rohit/cc-new-backend` | user |

## 6. Blockers / risks (🛑 need the user)
- ✅ **D1 Coolify #2**: done 2026-11-17 (read-only token in the git-ignored `coolify-token` file; panel is plain HTTP → token travels unencrypted, recommend HTTPS). Hetzner (#1) done too (2026-11-17): panel is HTTPS (`https://coolify.clearcutoff.in`), token works; dry-run of landing + backend read the real history (landing failed `9ef05c1` → no release; backend `855b653` deployed twice → one release). The `coolify-token` URL values may end in `/mcp`; the client strips it. Oracle panel is still plain HTTP.
- 🛑 **D5** Confirm the Oracle copies of backend + worker are a standby (stale, no domain) and must NOT be tracked as production.
- 🛑 **D2 Secrets** (GitHub repo secrets, I never see values): Coolify read-only token(s) + URL(s); Jira service-account email + API token (needs "Add comments" on project CC); Sentry org auth token; a GitHub token able to read `dalal-rohit/cc-new-backend` (different owner than the monorepo).
- 🛑 **D3 Sentry GitHub integration** installed for both repos? Needed for commits/suspect commits (Sentry docs). Releases show no commits today, which suggests it is not.
- 🛑 **D4** Single tracker in the monorepo handling all five apps (recommended: one place, one set of secrets) vs one workflow per repo.
- ⚠️ A plain-HTTP Coolify panel URL would send the API token in clear text; use HTTPS or accept the risk with a read-only token.
- ⚠️ Poll interval 5 min means Jira/Sentry updates land up to ~5–10 min after a deploy (GitHub schedules can lag).
- ⚠️ Sentry deploys cannot be deleted → tests use a throwaway release name, never a real SHA.

## 7. Dependencies / packages added
None yet. Planned: Node 22 script, zero npm dependencies; GitHub secrets above; Coolify env `SENTRY_RELEASE=$SOURCE_COMMIT` on the backend web + worker apps (user action).

## 8. Tests and verification
Built so far (2026-11-17): `scripts/release-tracking/` = `config.mjs`, `lib.mjs` (pure logic), `coolify.mjs` (read-only client), `git.mjs`, `run.mjs` (**dry-run only**, `--write` refuses), `release-tracking.test.mjs`. Run: `node --test scripts/release-tracking/release-tracking.test.mjs` (45 pass: 24 logic tests + 21 flow tests with SIMULATED Jira/Sentry/GitHub) and `node scripts/release-tracking/run.mjs --track-from <iso>`. Later the same day: Jira / Sentry / GitHub writers (`jira.mjs`, `sentry.mjs`, `github.mjs`), the orchestrator (`track.mjs`, `http.mjs`) and `.github/workflows/release-tracking.yml` were added; see §10.
- [x] Coolify status handling: finished / failed (real SHAs `9ef05c1`) / queued / in_progress / cancelled / skipped / unknown status (unit tests, real statuses)
- [x] Duplicate deployment records for one SHA (real backend `855b653`, deployed twice) → ONE release (logic only; Jira/Sentry side not built)
- [ ] Re-run the same window twice → 0 new Jira comments, 0 new Sentry records (needs the write code + real secrets; marker logic unit-tested)
- [x] Commit range with no Jira key (real `0e29d26..64094e7`), several keys in one commit, false positives (`ABCC-12`, `CC-007x`); [ ] key for a non-existent ticket (needs Jira)
- [x] Coolify down / 401 / 503 / network error: retried only when retryable, token never in the message, one app failing does not stop the others (unit tests + real dry-run with a wrong token and a dead port); [ ] Jira down / 429, Sentry down (needs the write code)
- [x] No-backfill baseline respected (`planReleases`, tested); `TRACK_FROM` in config must be set before any write run
- [x] Existing workflows byte-identical (`git diff` on `.github`, `package.json`, `pnpm-lock.yaml` is empty)
- [x] Positive control: breaking dedupe or counting `failed` as released makes the tests fail (checked, then restored)
- [x] Real dry-run on Oracle data: dashboard `6ac34b4` → CC-190; blog manual deploy `fcd57d3` covers 41 commits → CC-70/136/147/149/171; Hetzner apps skipped (placeholder creds), not failed
- [ ] **Not verified:** dashboard/blog deploy flow; backend `post_deployment_command` failure semantics; whether Sentry has the GitHub integration; Jira comment API scopes (official page unreadable, validate on a scratch ticket)

## 9. Next steps
1. User: put the real Hetzner panel URL + read-only token in `coolify-token` (landing + backend can then be dry-run too); answer D5.
2. User: create the Jira service-account token, Sentry org token and a GitHub token for `dalal-rohit/cc-new-backend` (GitHub repo secrets, never in chat); confirm the Sentry GitHub integration.
3. Then: backend commit range through the GitHub compare API, Jira writer (list comments, add ADF comment, skip when the marker exists), Sentry writer (`sentry-cli` 2.58.6: ensure release → `set-commits` → `finalize` → `deploys list` check → `deploys new`), `.github/workflows/release-tracking.yml` (schedule + manual dispatch, own concurrency group, per-integration `continue-on-error`), set `TRACK_FROM`.
4. First real write: a scratch Jira ticket and a throwaway Sentry release name (Sentry deploys cannot be deleted), never a real SHA.


## 10. Final status and go-live checklist (2026-11-17)

**Merged to `main` as `2a90177` and pushed on 2026-11-17.** The push redeployed nothing (checked in both Coolify instances). Writes are still OFF: no GitHub secrets exist yet and the repo variable `RELEASE_TRACKING_WRITE` is not set, so nothing has been written to Jira or Sentry by the tracker. Read-only check after the push: no `release-tracker` marker in any CC ticket comment, and no commits/deploys on any Sentry release.

**Built (all on branch `feat/release-tracking`, uncommitted):** `scripts/release-tracking/` (config, lib, coolify, git, github, http, jira, sentry, track, run, 2 test files), `.github/workflows/release-tracking.yml`, this doc, README row. No existing file was changed except `docs/phases/README.md` (one row).

**Tested:** 45/45 unit/flow tests · mutation controls (removing the Jira marker check, the Sentry deploy guard, or the Jira/Sentry isolation each makes tests fail) · real dry-run on all 4 apps against the live Coolify APIs · real wrong-token (HTTP 401) and dead-port failures · `--write` refuses without a tracking start and does nothing without Jira/Sentry secrets · workflow YAML parses · leak scan of every new file against the real Coolify tokens = 0 hits · `ci.yml`, `deploy*.yml`, `warm-blog-cache.yml`, `package.json`, lockfile unchanged.

**NOT verified (needs secrets or the workflow on `main`; do not enable writes before these):**
1. Jira, PARTLY verified 2026-11-17: the tracker's real comment body (built by `buildReleaseComment` from real release data: dashboard `6ac34b4`, 2 real CC-190 commits) was accepted by Jira on the scratch ticket **CC-194** (comment `10100`, label `release-tracking-test`) and came back unchanged (bold, links, bullet list and the marker text intact). That post went through the Atlassian MCP as the user, not through the tracker's own client. STILL NOT verified: the tracker's REST client (Basic auth `email:API token`, `POST /rest/api/3/issue/{key}/comment`), the service-account permissions, and the 429 behaviour. JQL `comment ~ "release-tracker"` did not return CC-194 right after the post (cause not confirmed, probably search-index delay); the tracker does not use JQL, it reads each ticket's comments and looks for the marker.
2. Sentry writes through `sentry-cli` 2.58.6: the `--commit OWNER/REPO@PREV..SHA` repo name must match a repository registered in Sentry (needs the Sentry GitHub integration), `SENTRY_URL` for the DE region (`https://de.sentry.io`), and that the REST release read returns `commitCount`/`deployCount`/`lastDeploy` as documented.
3. GitHub compare for the private backend repo: needs `RELEASE_GH_TOKEN`; the live public-repo check could not run (unauthenticated limit of 60/hour was exhausted), it is covered only by a simulated test.
4. The workflow itself on GitHub Actions (schedule runs only from the default branch; `workflow_dispatch` only for a workflow file that exists there).
5. Whether Coolify `finished` implies a healthy app: dashboard and landing have no health check (it means the container started); backend has `/up`. Backend `post_deployment_command` failure semantics unknown.

**Go-live checklist (needs the user's go-ahead for each outward step):**
1. Repo secrets in `MuhammadArslan-Dev/clearcut-turbo`: `ORACLE_COOLIFY_URL`, `ORACLE_COOLIFY_TOKEN`, `HETZNER_COOLIFY_URL`, `HETZNER_COOLIFY_TOKEN`, `JIRA_EMAIL`, `JIRA_API_TOKEN` (service account, "Add comments" on CC), `SENTRY_AUTH_TOKEN` (scope `org:ci`, per the Sentry API docs), `RELEASE_GH_TOKEN` (read `dalal-rohit/cc-new-backend`). Fresh tokens with expiry, not the ones used in chat.
2. Sentry GitHub integration installed for both repos (so `--commit` can resolve them).
3. Backend (Coolify web + worker): env `SENTRY_RELEASE=$SOURCE_COMMIT` (Coolify exposes `SOURCE_COMMIT` at runtime).
4. Merge `feat/release-tracking` to `main` (only `scripts/`, `docs/`, `.github/` change: none of them match the dashboard/landing Coolify watch paths, so no app redeploys; the blog is manual) — only when the user says so.
5. Dry-run on Actions: Run workflow with `write` unchecked; read the log.
6. Real write test on a scratch Jira ticket and a throwaway Sentry release name (Sentry deploys cannot be deleted) before touching real ones. CC-194 is the scratch ticket (it already holds the sample comment; reuse it or delete it).
7. Repository variables: `RELEASE_TRACKING_FROM` = go-live ISO time, then `RELEASE_TRACKING_WRITE=true`. Setting it to anything else stops all writes (kill switch).

**Cost:** cron `*/15` = 96 runs/day. GitHub private repos include $12 (Free) / $18 (Team) of Linux compute per month at $0.006/min (GitHub billing docs) ≈ 2,000 / 3,000 min. At an assumed ~45 s per run that is ≈ $13/month, near the Free allowance; `*/30` halves it. Public repo = free. Plan and repo visibility not checked.

**Known limitations:** a rollback to an older SHA is not recorded as a new release (the SHA was already released); when landing and blog deploy the same SHA, Sentry commits/deploy are recorded once per release (first app wins); blog path filter is an assumption (Coolify has none); Oracle's stale backend/worker copy is excluded pending D5; updates land up to ~15 min + deploy time after a deployment; a persistent Jira/Sentry failure keeps retrying every run and shows as a red run.
