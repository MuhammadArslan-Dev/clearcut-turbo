# Phase 60 — CC-138 + CC-139: SEO — one canonical host, and the leftover test page

**Status:** CC-139 **done and verified live** (2026-10-28). CC-138 **not done** — `https://www.clearcutoff.in/` still answers 200; needs a Cloudflare Redirect Rule (not a repo change).
**Jira:** [CC-139](https://clear-cutoff.atlassian.net/browse/CC-139), [CC-138](https://clear-cutoff.atlassian.net/browse/CC-138) (related: CC-151)
**Repos:** none for the code (host/edge settings); CM `apps/landing` only for the canonical/sitemap checks
**Size:** small

## CC-139 — remove `/conponent-testing`

Checked on 2026-10-28 with `curl`:

| URL | Result |
|---|---|
| `https://clearcutoff.in/conponent-testing` | 404 |
| `https://www.clearcutoff.in/conponent-testing` | 404 |
| `https://clearcutoff.in/sitemap.xml` | no `conponent` and no `www.` entries |

The route string appears nowhere in `apps/`, `packages/` or `docs/` of this repo, so there is nothing left to remove in code.

Still open from the ticket (not code):
- Request temporary removal in Google Search Console → Removals.
- Add a comment on the ticket listing other leftover test/demo routes (grep route files for `test`, `testing`, `demo`, `sandbox`, `dummy`).

## CC-138 — 301 `www` → non-www

Checked on 2026-10-28:

| URL | Result | Wanted |
|---|---|---|
| `https://www.clearcutoff.in/` | 200 | 301 → `https://clearcutoff.in/` |
| `https://www.clearcutoff.in/teaching/htet` | 200 | 301 → same path on non-www |
| `http://www.clearcutoff.in/` | 301 → `https://www.clearcutoff.in/` (a second hop is then needed) | one hop to `https://clearcutoff.in/` |

`www` sits behind Cloudflare (`Server: cloudflare`), so the fix is one **Cloudflare Redirect Rule** (dashboard → clearcutoff.in → Rules → Redirect Rules), not app code:

- When: Hostname equals `www.clearcutoff.in`
- Then: Dynamic redirect, expression `concat("https://clearcutoff.in", http.request.uri.path)`, status **301**, **preserve query string** on
- Do not touch `academy.clearcutoff.in`.
- Do not add `noindex` to `www` (Google must be able to follow the 301s).

After the rule is live, the ticket's acceptance checks are:

```sh
curl -sI https://www.clearcutoff.in/            # 301, Location: https://clearcutoff.in/
curl -sI https://www.clearcutoff.in/teaching/htet
curl -sI https://www.clearcutoff.in/hi
curl -sI http://www.clearcutoff.in/             # one hop straight to https://clearcutoff.in/
```

Then confirm `<link rel="canonical">` on the homepage and three teaching pages is the non-www https URL, `sitemap.xml` has no `www` URLs (already true), and re-check GSC after 2–3 weeks.

## Verification log
- 2026-10-28: `curl` checks above (read-only). No production change made by Claude.
