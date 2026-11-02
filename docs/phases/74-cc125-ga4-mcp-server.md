# Phase 74 — Google Analytics (GA4) MCP server (read + write) on Coolify

**Tickets:** CC-125 (build) → CC-127 (Ganesh testing). Sibling of phase 73 (Google Ads MCP, CC-124): same pattern, same Google Cloud project / OAuth client / Coolify.
**Repos:** CM — `apps/google-analytics-mcp` inside this monorepo (Python app, vendored from googleanalytics/google-analytics-mcp commit `a7b483f`; no pnpm/turbo task) · deploy on Coolify `http://140.245.112.235:8000`
**Branch:** `feature/practice-test-flag` (current; move to its own branch before committing) — not committed, not pushed
**Created / start date:** 2026-10-31
**Status:** In Progress — local build done and tested (21 tests pass); not deployed. Waiting on Google-side prerequisites + Coolify deploy go-ahead

> User decisions (2026-10-31): deploy on the existing Coolify (not Hetzner); everything inside clearcut-master (no separate repo); build GA4 "the same way" as Google Ads.

---

## 1. Problem / objective
Let the team query and configure GA4 from Claude through a self-hosted remote MCP server. Per-user Google OAuth, so each person's own GA4 role (Viewer / Analyst / Marketer / Editor / Administrator) is enforced by Google on every call. Evidence: Jira CC-125.

## 2. Scope
- **In** (all under `apps/google-analytics-mcp/`): read tools (upstream: reports, realtime, funnel, conversions, metadata, account/property info), write tools on the Admin API, Google OAuth login limited to the team, Docker/compose, `/health`, README.
- **Out:** user management (`analytics.manage.users` is never requested); our own audit log (use GA4 Property change history); product links and data streams write tools (not built yet — ticket says "e.g.", can be added later); Coolify deploy until the user gives the go-ahead.

## 3. Implementation plan
Findings (2026-10-31): unlike the Ads upstream, `googleanalytics/google-analytics-mcp` is **stdio-only** (low-level MCP server + Google ADK, ADC credentials, `--allow-write` flag). It has no HTTP transport and no OAuth. Its tool functions in `analytics_mcp/tools/**` are plain async functions, so we vendor those and replace the server layer.

- [x] 1. Vendor upstream tools (`tools/admin`, `tools/reporting`, `tools/utils.py`, license) into `apps/google-analytics-mcp/`; drop ADK (`google-adk`) and the stdio server/coordinator.
- [x] 2. New FastMCP 4 server (same stack as `apps/google-ads-mcp`): `GoogleProvider` OAuth proxy, `streamable-http` on `:8080/mcp`, encrypted OAuth-state storage. `tools/client.py` builds the API clients from the signed-in user's token (ADC only as local-dev fallback), so Google applies that user's GA4 role.
- [x] 3. Scopes: `analytics.readonly` + `analytics.edit` (+ openid/email/profile). Never `analytics.manage.users`.
- [x] 4. Read tools registered with read-only annotations; descriptions from upstream's `_run_*_description()`.
- [x] 5. Write tools (Admin API; alpha/beta noted in README): `create_property_annotation` (upstream), `create_key_event`, `create_custom_dimension`, `create_custom_metric`, `create_audience` (alpha), `update_data_retention_settings`. Every write tool has `dry_run=True` by default (GA Admin API has no validate_only: dry run returns the exact request without sending it). Google rejects writes from users without the role.
- [x] 6. Team allowlist (`ALLOWED_EMAILS`, verified email, fail-closed at start), `/health`, `docker-compose.yml` (healthcheck, log rotation, oauth-state volume), `.env.example`, `README_CLEARCUT.md`.
- [x] 7. Tests (unit, mocked clients) + in-process HTTP check (401 / `/health` / tools mounted).
- [ ] 8. Real-Google verification and Coolify deploy → hand to CC-127 (needs user prerequisites).

## 4. Progress / completed changes
- 2026-10-31: read CC-125 and the upstream repo; built locally in `apps/google-analytics-mcp` (nothing committed/pushed): vendored upstream `analytics_mcp/tools/{admin/info.py,reporting/*,utils.py}` unchanged; `tools/client.py` replaced (user token, ADC fallback); new `tools/admin/write.py` (`create_key_event`, `create_custom_dimension`, `create_custom_metric`, `create_audience`, `update_data_retention_settings`, all `dry_run=True` default; upstream's `create_property_annotation` registered as a write tool); new `coordinator.py`/`server.py` (FastMCP 4 + GoogleProvider, scopes read+edit only, fail-closed allowlist); copied from the Ads app `allowlist.py`, `auth_storage.py` (env prefix `GA_MCP_*`), `health.py`; `Dockerfile`, `docker-compose.yml`, `.env.example`, `.dockerignore`, `README_CLEARCUT.md`; tests `write_test.py`, `server_test.py`, `allowlist_test.py` plus trimmed upstream `annotations_test.py`/`utils_test.py` (21 pass).
- Also added `.dockerignore` to `apps/google-ads-mcp` (without it `COPY . .` would copy a local `.venv` into the image).
- Dropped upstream's `google-adk` dependency, stdio server and `--allow-write` flag (write tools are always registered; Google enforces the role).

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-10-31 | Where / how | Coolify, inside clearcut-master, same way as Google Ads (user) |
| 2026-10-31 | Write tools get `dry_run=True` by default | Mirrors Ads' validate_only; not required by ticket CC-125 — flag to user |

## 6. Blockers / risks
- 🛑 Google-side prerequisites (user): enable **Google Analytics Admin API** and **Google Analytics Data API** in the same Cloud project as phase 73; the OAuth client can be the **same** one — add redirect URI `https://mcp-ga.clearcutoff.in/auth/callback` to it; consent screen must list the analytics scopes. No developer token needed for GA.
- 🛑 DNS (user): A record `mcp-ga` → 140.245.112.235. Team accounts list (same as phase 73).
- ⚠️ Some Admin API features exist only in v1alpha/v1beta (annotations, audiences): may change without notice. Listed in the README.
- ⚠️ Upstream is a stdio server: our server layer is new code, not a thin wrapper; upstream tool functions are vendored (bug fixes there must be merged by hand).
- ⚠️ Python duplication between the two MCP apps (allowlist, auth storage, health, coordinator compat shim) — deliberate, avoids a shared Python package for two small apps.

## 7. Dependencies / packages added
`fastmcp>=4.0.6,<5`, `mcp[cli]>=2.0.0,<3`, `google-analytics-data`, `google-analytics-admin`, `google-auth`, `httpx` (no `google-adk`). Env vars: `GOOGLE_ANALYTICS_MCP_*`-style names mirrored from the Ads app (see `.env.example`), `ALLOWED_EMAILS`. Services: Google Cloud APIs, Coolify, DNS.

## 8. Tests and verification
- [x] Unit tests (mocked): 21 pass: clients use the signed-in user's token, dry_run default, allowlist, fail-closed start, manage.users scope never requested
- [x] In-process HTTP check: 401 without auth, `/health` 200, tools mounted (`tests/server_test.py`)
- [ ] Real Google: Viewer reports OK + write rejected; Marketer key event/audience; Editor custom dimension; all in Property change history; outsider cannot sign in
- [ ] Container restarts after reboot

## 9. Next steps
Steps 1–7 done locally. Next: user supplies prerequisites (section 6) → real-Google test on a GA4 property → Coolify deploy (exact steps given, user runs them) → hand to CC-127.
