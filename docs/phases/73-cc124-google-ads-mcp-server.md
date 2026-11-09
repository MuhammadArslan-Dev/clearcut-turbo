# Phase 73 — Google Ads MCP server (read + write) on Coolify

**Tickets:** CC-124 (build) → CC-126 (Ganesh testing). Sibling: CC-125 (GA4 MCP, next phase, reuses the same pattern/OAuth client)
**Repos:** CM — `apps/google-ads-mcp` inside this monorepo (Python app, vendored from upstream googleads/google-ads-mcp commit `9a78cbd`; no pnpm/turbo task) · deploy on Coolify `http://140.245.112.235:8000`
**Branch:** `feature/practice-test-flag` (current; move to its own branch before committing) — not committed, not pushed
**Created / start date:** 2026-10-31
**Status:** In Progress — local build done and tested (80 tests pass); not deployed. Waiting on Google-side prerequisites + Coolify deploy go-ahead (section 6)

> Ticket says Hetzner; user decided (2026-10-31) to deploy on the existing Coolify instance instead.

---

## 1. Problem / objective
Let the team query and change Google Ads from Claude (web/mobile/desktop) through a self-hosted remote MCP server. Per-user Google OAuth, so each person's own Google Ads access level (Read only / Standard / Admin) is enforced by Google on every call — no custom permission rules in our server. Evidence: Jira CC-124.

## 2. Scope
- **In:** (all under `apps/google-ads-mcp/`) read tools (upstream), write tools (Google Ads API mutate, each with `validate_only`), partial-failure handling, Google OAuth login restricted to team accounts, Docker image, Coolify deploy over HTTPS on `mcp-ads.clearcutoff.in`, health check, log rotation, README.
- **Out:** GA4 MCP (CC-125, next phase); our own audit log (use Google Ads Change history); user management via the API; any unofficial endpoint/workaround; tests of Standard/Read-only behaviour (CC-126, Ganesh).

## 3. Implementation plan
Findings (2026-10-31, read from github.com/googleads/google-ads-mcp `main`): upstream already ships FastMCP 4, a **FastMCP OAuth proxy** (`GOOGLE_ADS_MCP_OAUTH_CLIENT_ID/SECRET/BASE_URL`, switches to `streamable-http` on :8080 at `/mcp`), encrypted OAuth-state storage (`filetree`/redis/firestore), and `utils._create_credentials()` uses the *logged-in user's* FastMCP token for every Ads call. Tools are loaded by reflection from `ads_mcp/tools/` (`search`, `get_resource_metadata`, `list_accessible_customers`) and toggled by `tools_config.yaml`. Dockerfile exists. So we **extend, not rewrite**.

- [x] 1. Vendor upstream into `apps/google-ads-mcp/` (commit `9a78cbd`), keep upstream files untouched where possible. (First built as a separate repo; moved into the monorepo 2026-10-31 on user instruction — no separate projects.)
- [x] 2. Add `ads_mcp/tools/mutate.py` (new file, auto-loaded) with write tools via the official `google-ads` client: pause/enable campaign, update campaign budget, plus ad group / ad / keyword status, bids, audiences, assets as the ticket lists. Every tool takes `validate_only` (default **true**), uses `partial_failure`, and calls only supported mutate services. Register in `tools_config.yaml`.
- [x] 3. Team-only sign-in: restrict by Google account domain/allowlist (env `ALLOWED_EMAILS` / hosted domain) inside the OAuth proxy token verification; unauthenticated → 401 (FastMCP default, verify).
- [x] 4. Dockerfile (upstream's) + `docker-compose`/Coolify config: `restart: unless-stopped`, healthcheck, json-file log rotation, persistent volume for OAuth state, encrypted storage key.
- [ ] 5. Coolify: new project, Docker Compose app from this monorepo (base dir `/apps/google-ads-mcp`), domain `mcp-ads.clearcutoff.in` (Coolify's Traefik gives automatic TLS — no Caddy/Nginx needed), env vars as Coolify secrets. **User runs/approves prod actions; I give exact steps.**
- [x] 6. README: restart, where secrets live, token rotation, how to change a person's access (Google Ads → Admin → Access and security).
- [ ] 7. Verify against acceptance criteria (CC-124), then hand to CC-126.

## 4. Progress / completed changes
- 2026-10-31: read CC-124/CC-125 in Jira; confirmed Coolify at 140.245.112.235:8000 is logged in, no projects yet, `localhost` server Ready; read upstream repo (above). Nothing implemented.

- 2026-10-31: built locally (nothing committed/pushed), then moved into `apps/google-ads-mcp`; the temporary separate repo folder was deleted; 80 tests re-run green in the new location, `pnpm check:colors` clean: `ads_mcp/tools/mutate.py` (tools `write_mutate` generic MutateOperation JSON limited to an allowed resource list, `write_set_campaign_status`, `write_update_campaign_budget`; all `validate_only=True` by default + partial_failure), `ads_mcp/allowlist.py` (`ALLOWED_EMAILS`, verified email required, wired in `coordinator.py`; server refuses to start with OAuth on and no allowlist), `ads_mcp/health.py` (`/health`), `docker-compose.yml` (healthcheck, log rotation, oauth-state volume), `.env.example`, `README_CLEARCUT.md`, tests `tests/tools/mutate_test.py` + `tests/allowlist_test.py`; `config.py`/`tools_config.yaml` register namespace `mutate` with prefix `write`; one upstream test env updated for the allowlist.
- Verified in-process with dummy OAuth creds: `/mcp` without auth → 401, OAuth metadata served, `/health` 200, 6 tools mounted. NOT verified against real Google (needs creds, step 7).
- Decision: Coolify's Traefik does TLS, so no Caddy/Nginx; compose build pack used so healthcheck + log rotation live in the repo.

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-10-31 | Separate repo? | No — keep everything inside clearcut-master, no new projects (user) |
| 2026-10-31 | Where to deploy? | Existing Coolify (140.245.112.235), not Hetzner (user) |
| 2026-10-31 | Which first? | Google Ads (CC-124) before GA4 (CC-125) (user) |

## 6. Blockers / risks
- 🛑 **Google-side prerequisites (user, I can't do these):** Google Cloud project with **Google Ads API** enabled; OAuth client (type *Web application*) with redirect URI `https://mcp-ads.clearcutoff.in/auth/callback` (exact path confirmed from FastMCP when built); **developer token — apply for Basic access now** (test token can't touch production, approval takes days); manager (MCC) login-customer-id if used; OAuth consent screen (Internal if the Google Workspace allows, else External + test users).
- 🛑 DNS: A record `mcp-ads` → 140.245.112.235 (user).
- 🛑 Which Google accounts are "the team" (list or domain)?
- ⚠️ Upstream is Google's repo (Apache-2.0), young and moving fast (FastMCP 4): pin versions, expect merge work on updates.
- ⚠️ Claude custom connectors need public HTTPS; port 8000 Coolify UI shouldn't be exposed more than it is.
- ⚠️ Google Ads has no read-only OAuth scope: read-only-ness for a Read-only user comes from Google's access level, not the scope.
- ⚠️ Write tools can spend real ad money → `validate_only` defaults to true; real runs need explicit `validate_only=false`.
- Oracle/Coolify instance size unknown (CC-140): check RAM before deploy.

## 7. Dependencies / packages added
`fastmcp>=4.0.6,<5`, `mcp[cli]>=2.0.0,<3`, `google-ads` (all via upstream `pyproject.toml`). Env vars: `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_LOGIN_CUSTOMER_ID`, `GOOGLE_ADS_MCP_OAUTH_CLIENT_ID/SECRET`, `GOOGLE_ADS_MCP_BASE_URL=https://mcp-ads.clearcutoff.in`, `GOOGLE_ADS_MCP_JWT_SIGNING_KEY`, `GOOGLE_ADS_MCP_STORAGE_TYPE=filetree` + `_PATH` + `_ENCRYPTION_KEY`, `ALLOWED_EMAILS` (ours). Services: Google Cloud, Google Ads API, Coolify, DNS.

## 8. Tests and verification
- [x] Unit tests: 80 pass (`python -m unittest discover --buffer -s tests -p "*_test.py"`), incl. validate_only default, mask/resource names, disallowed resources, allowlist, fail-closed start
- [x] In-process HTTP check: 401 without auth, `/health` 200, tools mounted
- [ ] Local run with test developer token: read tools work, `validate_only` returns without change
- [ ] Non-team Google account rejected (real login)
- [ ] Read-only user: write rejected by Google; Standard user: pause/enable campaign + budget change visible in Ads UI and Change history
- [ ] Container restarts after reboot

## 9. Next steps
Done locally. Next: user supplies Google creds/token/DNS/team list (section 6) → create `.env`, run against a Google Ads test account locally, then Coolify deploy (I give exact steps, user runs them).

Old next-steps note: User reviews this plan and answers section 6 (prerequisites + team list). Then step 1–2 (repo + write tools) can be built and run locally without prod.
