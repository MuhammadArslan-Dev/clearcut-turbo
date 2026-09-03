export interface Env {
	// Cloudflare Pages deployment URL for apps/tools' static export, e.g.
	// "https://clearcut-tools.pages.dev". Set in wrangler.toml [vars].
	PAGES_ORIGIN: string;
}

const PREFIX = "/tools/resizer";
// Hindi's PUBLIC url is /hi/tools/resizer/* (locale outermost), but Next's
// basePath (next.config.ts) is still just "/tools/resizer" for the whole
// app — its /hi/* route tree (app/hi/...) is exported the same way any
// other route is, under that one basePath. So this maps the public HI url
// to the SAME upstream path the app already serves at /tools/resizer/hi/*;
// no separate build or basePath needed. The components render plain <a>
// tags (not next/link) for Hindi-locale navigation specifically because
// next/link would auto-prepend the "/tools/resizer" basePath to a "/hi/..."
// href, landing back on the old nested shape instead of this one — see
// LocaleSwitcher.tsx.
const HI_PREFIX = "/hi/tools/resizer";

// Matches "/tools/resizer(/...)" and "/hi/tools/resizer(/...)". Returns the
// upstream path to request from PAGES_ORIGIN, or null if this pathname
// isn't ours.
function matchPath(pathname: string): string | null {
	if (pathname === HI_PREFIX) return "/hi";
	if (pathname.startsWith(HI_PREFIX + "/")) return "/hi" + pathname.slice(HI_PREFIX.length);
	if (pathname === PREFIX) return "";
	if (pathname.startsWith(PREFIX + "/")) return pathname.slice(PREFIX.length);
	return null;
}

// Bare "/tools" has no app behind it — this Worker owns it directly and
// renders a tiny index card (styled to match the resizer hub's own "More
// tools" tiles in apps/tools/src/components/MoreTools.tsx) linking into the
// one real tool at /tools/resizer. Add a new <a> card here if a second
// standalone tool ever ships at its own /tools/* prefix.
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

		// Route is scoped to /tools, /tools/resizer(/*) and /hi/tools/resizer(/*) in
		// wrangler.toml, so this should always match — kept as a safety net.
		const rest = matchPath(url.pathname);
		if (rest === null) {
			return fetch(request);
		}

		// next.config.ts sets basePath: '/tools/resizer', which only prefixes
		// the *links/assets* Next emits — it does not move the static export
		// into a /tools/resizer folder. out/ mirrors routes with no prefix at
		// all: "/tools/resizer/htet" -> "/htet". Bare "/tools/resizer" (no
		// trailing segment) maps to the site root.
		const upstreamPath = rest === "" ? "/" : rest;

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
		// edge for cacheTtl, so only the first visitor in a region pays the
		// extra hop. Hashed /_next/static/* assets are cached for a year
		// (safe: the filename changes whenever the content does); HTML pages
		// get a short TTL so redeploys still show up quickly.
		const isHashedAsset = upstreamPath.startsWith("/_next/static/");

		const upstreamResponse = await fetch(upstreamUrl.toString(), {
			method: request.method,
			headers: upstreamHeaders,
			body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
			redirect: "manual",
			cf: {
				cacheEverything: true,
				cacheTtl: isHashedAsset ? 31536000 : 300,
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
