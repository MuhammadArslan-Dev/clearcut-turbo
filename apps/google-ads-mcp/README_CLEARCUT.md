# ClearCutOff Google Ads MCP (CC-124)

Lives in the `clearcut-master` monorepo as `apps/google-ads-mcp` (a Python app, not part of pnpm/turbo). Vendored copy of [googleads/google-ads-mcp](https://github.com/googleads/google-ads-mcp) (Apache-2.0, upstream commit `9a78cbd`), run remotely so the team can use Google Ads from Claude. Upstream files are left as-is wherever possible; our additions are:

| File | What |
|---|---|
| `ads_mcp/tools/mutate.py` | Write tools `write_mutate`, `write_set_campaign_status`, `write_update_campaign_budget` |
| `ads_mcp/allowlist.py` + `coordinator.py` | Team-only sign-in (`ALLOWED_EMAILS`), fail-closed |
| `ads_mcp/health.py` | `GET /health` for health checks |
| `docker-compose.yml`, `.env.example` | Deploy config (Coolify) |

## How access works
Each person signs in with **their own Google account**; every Ads call uses **their** token, so Google enforces their Google Ads access level (Read only / Standard / Admin). Change someone's rights in Google Ads > Admin > Access and security; no server change is needed. Every change appears in Google Ads > Change history under that person.

- Sign-in is limited to `ALLOWED_EMAILS` (emails and/or `@domain`). With OAuth on and no allowlist the server refuses to start.
- Unauthenticated requests to `/mcp` get `401`.
- Write tools default to `validate_only=True` (Google validates, nothing changes). Apply with `validate_only=False` only after the user confirms the preview. Partial failure is on, so a bad operation is reported instead of failing silently.
- Writes are limited to campaigns, budgets, ad groups, ads, keywords/criteria, bid modifiers, assets and audiences. Account settings and user access are not exposed.

## Run locally (no Google account needed for the tests)
```sh
cd apps/google-ads-mcp
uv venv --python 3.13 && uv pip install -e ".[dev]" pyfakefs
.venv/Scripts/python -m unittest discover --buffer -s tests -p "*_test.py"   # Windows; .venv/bin/python elsewhere
```

## Deploy (Coolify, Docker Compose build pack)
Base directory in Coolify: `/apps/google-ads-mcp` (compose file `docker-compose.yml`). Do not use the repo-root `nixpacks.toml`, that is the dashboard's.
1. Set the secrets from `.env.example` in Coolify (never commit them).
2. Domain `https://mcp-ads.clearcutoff.in` -> service `google-ads-mcp`, port `8080` (Coolify's proxy handles TLS).
3. In Google Cloud add redirect URI `https://mcp-ads.clearcutoff.in/auth/callback` to the OAuth client.
4. In Claude: Settings > Connectors > Add custom connector > `https://mcp-ads.clearcutoff.in/mcp`.

Restart: Coolify > the app > Restart. Logs rotate at 5 x 10 MB. OAuth state lives in the `oauth-state` volume (encrypted with `GOOGLE_ADS_MCP_STORAGE_ENCRYPTION_KEY`); losing the key or volume only forces everyone to sign in again.

## Rotating secrets
- OAuth client secret: create a new secret in Google Cloud, update `GOOGLE_ADS_MCP_OAUTH_CLIENT_SECRET`, redeploy, delete the old one.
- Developer token: shown in Google Ads > Tools > API Center; update `GOOGLE_ADS_DEVELOPER_TOKEN`, redeploy.
- `GOOGLE_ADS_MCP_JWT_SIGNING_KEY` / `..._ENCRYPTION_KEY`: change and redeploy; everyone signs in again.

## Updating from upstream
Upstream history is not kept here. Diff the files in the upstream repo since `9a78cbd` against `ads_mcp/` and copy the changes in by hand (our files: the table above plus the small edits in `coordinator.py`, `config.py`, `server.py`, `tools_config.yaml`), then run the tests. Upstream pins FastMCP 4 and patches it in the Dockerfile; re-read its release notes first.
