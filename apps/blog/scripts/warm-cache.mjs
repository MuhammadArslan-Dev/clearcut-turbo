#!/usr/bin/env node
// Warms the blog's page cache after a deploy: requests every URL in the
// sitemaps once, so no visitor or crawler is the first to hit a page (a page
// rendered on its first request takes 2-10 s; a cached one ~0.3 s).
//
//   node apps/blog/scripts/warm-cache.mjs https://clearcut-turbo-blog.vercel.app
//
// The sitemaps list absolute URLs on the public domain (NEXT_PUBLIC_SITE_URL);
// each is requested on the given base instead, so a deployment can be warmed
// before (or without) the domain pointing at it. Manual only
// (.github/workflows/warm-blog-cache.yml): a full run is ~300K Vercel ISR
// write units, more than the Hobby plan's monthly 200K.
// Env: WARM_CONCURRENCY (default 6), WARM_TIMEOUT_MS (default 60000).

const base = (process.argv[2] || process.env.WARM_BASE_URL || "").replace(/\/+$/, "");
if (!/^https?:\/\//.test(base)) {
  console.error("usage: warm-cache.mjs <base url>");
  process.exit(2);
}
const CONCURRENCY = Number(process.env.WARM_CONCURRENCY || 6);
const TIMEOUT_MS = Number(process.env.WARM_TIMEOUT_MS || 60000);
const HEADERS = { "User-Agent": "clearcut-cache-warmer", "Accept-Encoding": "gzip, br" };

const onBase = (url) => {
  const u = new URL(url);
  return `${base}${u.pathname}${u.search}`;
};

async function text(url) {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
}

const locs = (xml) => [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);

// sitemaps/index.xml lists every other sitemap.
const sitemapUrls = locs(await text(`${base}/sitemaps/index.xml`)).map(onBase);
const pages = new Set();
for (const sitemap of sitemapUrls) {
  try {
    for (const loc of locs(await text(sitemap))) pages.add(onBase(loc));
  } catch (err) {
    console.error(`sitemap failed: ${err.message}`);
  }
}
console.log(`${sitemapUrls.length} sitemaps, ${pages.size} pages, concurrency ${CONCURRENCY}`);

const queue = [...pages];
const stats = { HIT: 0, STALE: 0, MISS: 0, other: 0, failed: 0 };
const failures = [];
const started = Date.now();

async function worker() {
  for (let url = queue.shift(); url; url = queue.shift()) {
    try {
      const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(TIMEOUT_MS) });
      await res.arrayBuffer();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const cache = res.headers.get("x-vercel-cache") || "other";
      stats[cache in stats ? cache : "other"]++;
    } catch (err) {
      stats.failed++;
      failures.push(`${url} (${err.message})`);
    }
    const done = pages.size - queue.length;
    if (done % 200 === 0) console.log(`${done}/${pages.size} in ${Math.round((Date.now() - started) / 1000)} s`);
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log(`done in ${Math.round((Date.now() - started) / 1000)} s:`, stats);
if (failures.length) console.log(`failed (first 20):\n${failures.slice(0, 20).join("\n")}`);
// Warming is best effort: failures are reported but never fail the run.
