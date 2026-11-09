# ClearCutOff Google Analytics (GA4) MCP (CC-125)

Lives in the `clearcut-master` monorepo as `apps/google-analytics-mcp` (a Python app, not part of pnpm/turbo). It vendors the tool functions of [googleanalytics/google-analytics-mcp](https://github.com/googleanalytics/google-analytics-mcp) (Apache-2.0, upstream commit `a7b483f`) but **replaces its server layer**: upstream is stdio-only (ADK, ADC credentials), ours is a remote FastMCP 4 server with Google OAuth. Sister app: `apps/google-ads-mcp` (same pattern).

| File | What |
|---|---|
| `analytics_mcp/tools/reporting/*`, `tools/admin/info.py`, `tools/utils.py` | Upstream read tools (unchanged) |
| `analytics_mcp/tools/client.py` | Clients built from the **signed-in user's token** (ADC only as local-dev fallback) |
| `analytics_mcp/tools/admin/write.py` | Our write tools (below) |
| `analytics_mcp/coordinator.py`, `server.py` | FastMCP server, OAuth proxy, tool registration |
| `analytics_mcp/allowlist.py`, `auth_storage.py`, `health.py` | Team allowlist, encrypted OAuth state, `/health` (copied from the Ads app) |

## How access works
Each person signs in with **their own Google account**; every API call uses **their** token, so GA4 enforces their role on every call (Viewer: reports/settings; Analyst: + shared assets; Marketer: + audiences, key events, attribution; Editor: full property edit; Administrator: + users). Change a role in GA4 > Admin > Property access management; no server change needed.

- Scopes: `analytics.readonly` and `analytics.edit` only. `analytics.manage.users` is **never** requested (a test guards this). A Viewer holding the edit scope still cannot change anything.
- Sign-in is limited to `ALLOWED_EMAILS` (emails and/or `@domain`); OAuth on with no allowlist = server refuses to start. Unauthenticated `/mcp` = `401`.
- Audit trail: GA4 > Admin > Property change history, under the person who made the change.

## Tools
Read (read-only annotation): `get_account_summaries`, `list_google_ads_links`, `get_property_details`, `list_property_annotations`, `get_custom_dimensions_and_metrics`, `run_report`, `run_realtime_report`, `run_funnel_report`, `run_conversions_report`.

Write (all take `dry_run`, **default True** = returns the exact request, changes nothing; apply with `dry_run=False` after the user confirmed):

| Tool | Role needed | Admin API |
|---|---|---|
| `create_property_annotation` (upstream) | Marketer+ | v1alpha (alpha) |
| `create_key_event` | Marketer+ | v1beta |
| `create_audience` | Marketer+ | v1alpha (**alpha**, may change) |
| `create_custom_dimension` | Editor | v1beta |
| `create_custom_metric` | Editor | v1beta |
| `update_data_retention_settings` | Editor | v1beta |

Not built (ticket says "e.g."): data streams, product links.

## Run locally
```sh
cd apps/google-analytics-mcp
uv venv --python 3.13 && uv pip install -e . pyfakefs
.venv/Scripts/python -m unittest discover --buffer -s tests -p "*_test.py"   # Windows; .venv/bin/python elsewhere
```

## Deploy (Coolify, Docker Compose build pack)
Base directory in Coolify: `/apps/google-analytics-mcp` (compose file `docker-compose.yml`). Do not use the repo-root `nixpacks.toml`, it belongs to the dashboard.
1. Set the secrets from `.env.example` in Coolify (never commit them).
2. Domain `https://mcp-ga.clearcutoff.in` -> service `analytics-mcp`, port `8080` (Coolify's proxy handles TLS).
3. Google Cloud: enable **Google Analytics Admin API** and **Google Analytics Data API**; add redirect URI `https://mcp-ga.clearcutoff.in/auth/callback` to the OAuth client (can be the same client as the Ads MCP).
4. Claude: Settings > Connectors > Add custom connector > `https://mcp-ga.clearcutoff.in/mcp`.

Restart: Coolify > the app > Restart. Logs rotate at 5 x 10 MB. OAuth state lives in the `oauth-state` volume (encrypted with `GA_MCP_STORAGE_ENCRYPTION_KEY`); losing the key or volume only forces everyone to sign in again.

## Rotating secrets
- OAuth client secret: create a new secret in Google Cloud, update `GA_MCP_OAUTH_CLIENT_SECRET`, redeploy, delete the old one.
- `GA_MCP_JWT_SIGNING_KEY` / `GA_MCP_STORAGE_ENCRYPTION_KEY`: change and redeploy; everyone signs in again.

## Updating from upstream
Upstream history is not kept here. Diff the upstream `analytics_mcp/tools/` since `a7b483f` against ours and copy changes in by hand (our edits: `tools/client.py` replaced, `tools/admin/write.py` new); then run the tests.
