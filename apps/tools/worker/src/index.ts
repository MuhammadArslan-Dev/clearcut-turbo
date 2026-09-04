export interface Env {
	// Cloudflare Pages deployment URL for apps/tools' static export, e.g.
	// "https://clearcut-tools.pages.dev". Set in wrangler.toml [vars].
	PAGES_ORIGIN: string;
}

// Covers every tool this app serves (resizer at /tools/resizer/*, the age
// eligibility calculator at /tools/age-eligibility-calculator/*, ...) — the
// prefix matches Next's basePath (next.config.ts), and each tool's own
// route-folder name supplies the rest of the path, so a request like
// "/tools/resizer/htet" strips down to upstream "/resizer/htet", which
// mirrors that page's location in the Next app's route tree exactly.
const PREFIX = "/tools";
// Hindi is resizer-only right now, at public url /hi/tools/resizer/*
// (locale outermost) — the age calculator has no Hindi copy yet. Next's
// basePath is still just "/tools" for the whole app; its /hi/* route tree
// (app/hi/resizer/...) is exported the same way any other route is, under
// that one basePath. So this maps the public HI url to the upstream path
// the app already serves the export at, "/hi/resizer/*"; no separate build
// or basePath needed. The components render plain <a> tags (not next/link)
// for Hindi-locale navigation specifically because next/link would
// auto-prepend the "/tools" basePath to a "/hi/..." href, landing on
// "/tools/hi/..." instead of the public "/hi/tools/resizer/..." shape — see
// LocaleSwitcher.tsx.
const HI_PREFIX = "/hi/tools";

// Matches "/tools(/...)" and "/hi/tools(/...)". Returns the upstream path
// to request from PAGES_ORIGIN, or null if this pathname isn't ours.
function matchPath(pathname: string): string | null {
	if (pathname === HI_PREFIX) return "/hi";
	if (pathname.startsWith(HI_PREFIX + "/")) return "/hi" + pathname.slice(HI_PREFIX.length);
	// Bare "/tools" (pathname === PREFIX) is intercepted by the fetch handler
	// below before matchPath is ever called, so there's no branch for it
	// here — every reachable path has a "/tools/<tool-name>/..." shape.
	if (pathname.startsWith(PREFIX + "/")) return pathname.slice(PREFIX.length);
	return null;
}

// Bare "/tools" has no app behind it — this Worker owns it directly and
// renders a tiny index card (styled to match the resizer hub's own "More
// tools" tiles in apps/tools/src/components/MoreTools.tsx) linking into
// each real tool. Add a new <a> card here whenever another tool ships at
// its own /tools/* route.
const TOOLS_INDEX_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Free Tools | Clear Cutoff</title>
<meta name="description" content="Free browser-based tools for exam forms — photo &amp; signature resizing and more." />
<link rel="icon" href="https://clearcutoff.in/favicon.ico" />
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: #f7f8fa;
    color: #1a1d23;
  }
  header {
    display: flex;
    justify-content: center;
    padding: 24px 16px;
  }
  header img { height: 34px; }
  main {
    max-width: 720px;
    margin: 0 auto;
    padding: 24px 16px 64px;
    text-align: center;
  }
  h1 { font-size: 28px; font-weight: 700; margin: 0 0 8px; }
  p.lead { color: #5b6270; margin: 0 0 32px; font-size: 15px; }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    text-align: left;
  }
  a.card {
    display: block;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 20px;
    text-decoration: none;
    color: inherit;
    box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    transition: box-shadow 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
  }
  a.card:hover {
    border-color: #0083ff;
    box-shadow: 0 4px 18px rgba(0,0,0,0.06);
    transform: translateY(-2px);
  }
  .card-title { font-size: 16px; font-weight: 600; margin: 0 0 4px; }
  a.card:hover .card-title { color: #0083ff; }
  .card-desc { font-size: 14px; color: #5b6270; margin: 0; }
</style>
</head>
<body>
  <header>
    <a href="https://clearcutoff.in" aria-label="Clear Cutoff">
      <img src="https://clearcutoff.in/logos/main-logo.svg" alt="Clear Cutoff" />
    </a>
  </header>
  <main>
    <h1>Free Tools</h1>
    <p class="lead">Browser-based tools for your exam forms — nothing is ever uploaded.</p>
    <div class="grid">
      <a class="card" href="/tools/resizer">
        <p class="card-title">Photo &amp; Signature Resizer</p>
        <p class="card-desc">Resize and compress photos or signatures to any exam's exact size &amp; KB limit.</p>
      </a>
      <a class="card" href="/tools/age-eligibility-calculator">
        <p class="card-title">Age Eligibility Calculator</p>
        <p class="card-desc">Check your exact age and eligibility for CTET, HTET, UPTET, REET &amp; HPTET.</p>
      </a>
    </div>
  </main>
</body>
</html>`;

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		// Bare "/tools" — serve the tools index directly, no redirect.
		if (url.pathname === "/tools") {
			return new Response(TOOLS_INDEX_HTML, {
				headers: {
					"content-type": "text/html; charset=utf-8",
					"cache-control": "public, max-age=300",
				},
			});
		}

		// Route is scoped to /tools, /tools/<tool>(/*) and /hi/tools/<tool>(/*)
		// per-tool patterns in wrangler.toml, so this should always match —
		// kept as a safety net.
		const rest = matchPath(url.pathname);
		if (rest === null) {
			return fetch(request);
		}

		// next.config.ts sets basePath: '/tools', which only prefixes the
		// *links/assets* Next emits — it does not move the static export into
		// a /tools folder. out/ mirrors routes with no prefix at all:
		// "/tools/resizer/htet" -> "/resizer/htet".
		const upstreamPath = rest;

		const upstreamUrl = new URL(env.PAGES_ORIGIN);
		upstreamUrl.pathname = upstreamPath;
		upstreamUrl.search = url.search;

		// Host must NOT be forwarded as-is — it would still read
		// "clearcutoff.in", which the Pages origin doesn't serve. Let fetch()
		// set the correct Host from upstreamUrl instead.
		const upstreamHeaders = new Headers(request.headers);
		upstreamHeaders.delete("host");

		// Every request here is a live subrequest to the Pages origin —
		// without this, that round-trip repeats for every visitor on every
		// request. cacheEverything caches this subrequest's response at the
		// edge, so only the first visitor in a region pays the extra hop.
		// Hashed /_next/static/* assets are cached for a year (safe: the
		// filename changes whenever the content does); HTML pages get a
		// short TTL so redeploys still show up quickly.
		//
		// cacheTtlByStatus (not a flat cacheTtl) is deliberate: cacheEverything
		// caches non-2xx responses too, and a flat long TTL previously cached a
		// transient 404 (from a route added to this file before its matching
		// wrangler.toml pattern had been deployed) for a full year — every
		// visitor kept hitting that cached 404 long after the real fix shipped.
		// Only successful responses get the long/short TTL now; everything
		// else is cached for a few seconds at most, so a transient upstream
		// error can't strand every visitor behind a stale cached failure.
		const isHashedAsset = upstreamPath.startsWith("/_next/static/");
		const okTtl = isHashedAsset ? 31536000 : 300;

		const upstreamResponse = await fetch(upstreamUrl.toString(), {
			method: request.method,
			headers: upstreamHeaders,
			body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
			redirect: "manual",
			cf: {
				cacheEverything: true,
				cacheTtlByStatus: { "200-299": okTtl, "300-599": 10 },
			},
		});

		const response = new Response(upstreamResponse.body, upstreamResponse);

		// public/_headers on the Pages side sets X-Robots-Tag: noindex so the
		// *.pages.dev URL itself doesn't get indexed as duplicate content.
		// That header would otherwise ride along on every proxied response
		// here too and de-index the real, indexable clearcutoff.in/tools/
		// resizer/* pages — strip it.
		response.headers.delete("X-Robots-Tag");

		// Cloudflare Pages sends "Cache-Control: public, s-maxage=604800" on
		// every HTML response by default. Left as-is, that header rides along
		// to the CLIENT and governs clearcutoff.in's own edge cache too — a
		// completely separate cache from the cacheTtl above (which only
		// covers this Worker's own subrequest to PAGES_ORIGIN) — so a page
		// cached at this zone's edge before a redeploy could keep serving
		// the old HTML for up to 7 days. Override it to match the intended
		// short TTL; hashed /_next/static/* assets keep the long cache since
		// their filename changes whenever the content does.
		if (!isHashedAsset) {
			response.headers.set("Cache-Control", "public, max-age=60, s-maxage=300, must-revalidate");
		}

		return response;
	},
} satisfies ExportedHandler<Env>;
