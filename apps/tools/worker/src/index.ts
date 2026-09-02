export interface Env {
	// Cloudflare Pages deployment URL for apps/tools' static export, e.g.
	// "https://clearcut-tools.pages.dev". Set in wrangler.toml [vars].
	PAGES_ORIGIN: string;
}

const PREFIX = "/tools/resizer";

// Matches "/tools/resizer" and "/tools/resizer/...".
function matchPath(pathname: string): string | null {
	if (pathname === PREFIX) return "";
	if (pathname.startsWith(PREFIX + "/")) return pathname.slice(PREFIX.length);
	return null;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		// Route is scoped to /tools/resizer and /tools/resizer/* in
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

		return response;
	},
} satisfies ExportedHandler<Env>;
