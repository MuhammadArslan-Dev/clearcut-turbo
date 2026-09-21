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
// Hindi and Marathi cover both the resizer and the age eligibility
// calculator, at public urls /hi/tools/<tool>/* and /mr/tools/<tool>/*
// (locale outermost). Next's basePath is still just "/tools" for the whole
// app; its /hi/* and /mr/* route trees (app/hi/resizer/..., app/mr/resizer/...)
// are exported the same way any other route is, under that one basePath. So
// this maps each public locale url to the upstream path the app already
// serves the export at, "/hi/resizer/*" or "/mr/resizer/*"; no separate
// build or basePath needed. The components render plain <a> tags (not
// next/link) for non-English navigation specifically because next/link
// would auto-prepend the "/tools" basePath to a "/hi/..." or "/mr/..."
// href, landing on "/tools/hi/..." instead of the public
// "/hi/tools/resizer/..." shape — see LocaleSwitcher.tsx.
const HI_PREFIX = "/hi/tools";
const MR_PREFIX = "/mr/tools";

// Matches "/tools(/...)", "/hi/tools(/...)" and "/mr/tools(/...)". Returns
// the upstream path to request from PAGES_ORIGIN, or null if this pathname
// isn't ours.
function matchPath(pathname: string): string | null {
	for (const [prefix, upstreamRoot] of [
		[HI_PREFIX, "/hi"],
		[MR_PREFIX, "/mr"],
	] as const) {
		if (pathname === prefix) return upstreamRoot;
		if (pathname.startsWith(prefix + "/")) return upstreamRoot + pathname.slice(prefix.length);
	}
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
<link rel="canonical" href="https://clearcutoff.in/tools" />
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Clear Cutoff" />
<meta property="og:title" content="Free Tools | Clear Cutoff" />
<meta property="og:description" content="Free browser-based tools for exam forms — photo &amp; signature resizing and more." />
<meta property="og:url" content="https://clearcutoff.in/tools" />
<meta property="og:locale" content="en_IN" />
<meta property="og:image" content="https://clearcutoff.in/tools/og/clear-cutoff-tools.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Free Tools | Clear Cutoff" />
<meta name="twitter:description" content="Free browser-based tools for exam forms — photo &amp; signature resizing and more." />
<meta name="twitter:image" content="https://clearcutoff.in/tools/og/clear-cutoff-tools.png" />
<script type="application/ld+json">{"@context": "https://schema.org", "@graph": [{"@type": "CollectionPage", "name": "Free Tools", "description": "Free browser-based tools for exam forms — photo & signature resizing and more.", "url": "https://clearcutoff.in/tools", "inLanguage": "en", "isPartOf": {"@type": "WebSite", "name": "Clear Cutoff", "url": "https://clearcutoff.in"}, "mainEntity": {"@type": "ItemList", "numberOfItems": 3, "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Photo & Signature Resizer", "url": "https://clearcutoff.in/tools/resizer"}, {"@type": "ListItem", "position": 2, "name": "Age Eligibility Calculator", "url": "https://clearcutoff.in/tools/age-eligibility-calculator"}, {"@type": "ListItem", "position": 3, "name": "Syllabus Tracker", "url": "https://clearcutoff.in/tools/syllabus-tracker"}]}}, {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Home", "item": "https://clearcutoff.in"}, {"@type": "ListItem", "position": 2, "name": "Free Tools", "item": "https://clearcutoff.in/tools"}]}]}</script>
<link rel="icon" href="https://clearcutoff.in/favicon.ico" />
<style>
  /* Every literal colour this page uses is defined exactly once here,
     mirroring packages/design-tokens/tokens.css's values (--color-brand,
     --color-success, --color-gray-*, --color-background-gray-subtle, ...) —
     this Worker runs at the edge as a plain string, with no build step to
     @import the real tokens.css, so the values are copied rather than
     referenced. --color-purple-* has no equivalent in the real design
     system; it exists only for this page's third trust-badge illustration. */
  :root {
    color-scheme: light;
    --color-bg: #f7f8fa;
    --color-text: #1a1d23;
    --color-text-muted: #5b6270;
    --color-border: #e5e7eb;
    --color-brand: #0083ff;
    --color-brand-soft: #e6f0fa;
    --color-success: #00a251;
    --color-success-soft: #e7f6e5;
    --color-purple: #6d5ce8;
    --color-purple-soft: #ece9fc;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: var(--color-bg);
    color: var(--color-text);
  }
  header {
    display: flex;
    justify-content: center;
    padding: 24px 16px;
  }
  header img { height: 34px; }
  main {
    max-width: 1040px;
    margin: 0 auto;
    padding: 24px 16px 64px;
    text-align: center;
  }
  h1 { font-size: clamp(32px, 5vw, 44px); font-weight: 800; margin: 0 0 12px; letter-spacing: -0.01em; }
  p.lead { color: var(--color-text-muted); margin: 0 0 32px; font-size: 16px; }

  .badges {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 20px;
    margin: 0 0 40px;
  }
  .badge { display: flex; align-items: center; gap: 10px; text-align: left; }
  .badge-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 999px;
    flex-shrink: 0;
  }
  .badge-icon.blue { background: var(--color-brand-soft); color: var(--color-brand); }
  .badge-icon.green { background: var(--color-success-soft); color: var(--color-success); }
  .badge-icon.purple { background: var(--color-purple-soft); color: var(--color-purple); }
  .badge-title { font-size: 14px; font-weight: 700; margin: 0; }
  .badge-sub { font-size: 13px; color: var(--color-text-muted); margin: 0; }
  .badge-divider { width: 1px; height: 32px; background: var(--color-border); }
  @media (max-width: 640px) { .badge-divider { display: none; } }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 20px;
    text-align: left;
  }
  a.card {
    display: flex;
    flex-direction: column;
    background: #fff;
    border: 1px solid var(--color-border);
    border-radius: 18px;
    padding: 24px;
    text-decoration: none;
    color: inherit;
    box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    transition: box-shadow 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
  }
  a.card:hover {
    border-color: var(--color-brand);
    box-shadow: 0 8px 24px rgba(0,0,0,0.07);
    transform: translateY(-2px);
  }
  .card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
  .card-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 16px;
  }
  .card-icon.blue { background: var(--color-brand-soft); color: var(--color-brand); }
  .card-icon.green { background: var(--color-success-soft); color: var(--color-success); }
  .card-icon.purple { background: var(--color-purple-soft); color: var(--color-purple); }
  .chevron { color: var(--color-text-muted); font-size: 20px; line-height: 1; margin-top: 16px; transition: transform 0.15s ease; }
  a.card:hover .chevron { transform: translateX(3px); color: var(--color-brand); }
  .card-title { font-size: 20px; font-weight: 700; margin: 0 0 8px; }
  a.card:hover .card-title { color: var(--color-brand); }
  .card-desc { font-size: 14.5px; line-height: 1.5; color: var(--color-text-muted); margin: 0 0 20px; flex-grow: 1; }
  .tags { display: flex; flex-wrap: wrap; gap: 8px; }
  .tag {
    display: inline-block;
    padding: 5px 12px;
    border-radius: 999px;
    font-size: 12.5px;
    font-weight: 600;
  }
  .tag.blue { background: var(--color-brand-soft); color: var(--color-brand); }
  .tag.green { background: var(--color-success-soft); color: var(--color-success); }
  .tag.purple { background: var(--color-purple-soft); color: var(--color-purple); }
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

    <div class="badges">
      <div class="badge">
        <span class="badge-icon blue">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z"/></svg>
        </span>
        <div>
          <p class="badge-title">100% Private</p>
          <p class="badge-sub">Stays in your browser</p>
        </div>
      </div>
      <span class="badge-divider"></span>
      <div class="badge">
        <span class="badge-icon green">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>
        </span>
        <div>
          <p class="badge-title">Fast &amp; Easy</p>
          <p class="badge-sub">Get results instantly</p>
        </div>
      </div>
      <span class="badge-divider"></span>
      <div class="badge">
        <span class="badge-icon purple">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>
        </span>
        <div>
          <p class="badge-title">Works on Any Device</p>
          <p class="badge-sub">Mobile, tablet or desktop</p>
        </div>
      </div>
    </div>

    <div class="grid">
      <a class="card" href="/tools/resizer">
        <div class="card-top">
          <span class="card-icon blue">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          </span>
          <span class="chevron">&rsaquo;</span>
        </div>
        <p class="card-title">Photo &amp; Signature Resizer</p>
        <p class="card-desc">Resize and compress photos or signatures to any exam's exact size &amp; KB limit.</p>
        <div class="tags">
          <span class="tag blue">Resize</span>
          <span class="tag blue">Compress</span>
          <span class="tag blue">Exact Size</span>
          <span class="tag blue">KB Limit</span>
        </div>
      </a>
      <a class="card" href="/tools/age-eligibility-calculator">
        <div class="card-top">
          <span class="card-icon green">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>
          </span>
          <span class="chevron">&rsaquo;</span>
        </div>
        <p class="card-title">Age Eligibility Calculator</p>
        <p class="card-desc">Check your exact age and eligibility for CTET, HTET, UPTET, REET &amp; HPTET.</p>
        <div class="tags">
          <span class="tag green">Age Calculation</span>
          <span class="tag green">Eligibility Check</span>
          <span class="tag green">Multiple Exams</span>
        </div>
      </a>
      <a class="card" href="/tools/syllabus-tracker">
        <div class="card-top">
          <span class="card-icon purple">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.5c-1.5-1-4-1.5-6-1v13c2 0 4.5.5 6 1.5M12 6.5c1.5-1 4-1.5 6-1v13c-2 0-4.5.5-6 1.5M12 6.5v14"/></svg>
          </span>
          <span class="chevron">&rsaquo;</span>
        </div>
        <p class="card-title">Syllabus Tracker</p>
        <p class="card-desc">Pick your exam and level, then check off chapters as you study them.</p>
        <div class="tags">
          <span class="tag purple">Chapter Checklist</span>
          <span class="tag purple">Progress Tracking</span>
          <span class="tag purple">Any Exam</span>
        </div>
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
