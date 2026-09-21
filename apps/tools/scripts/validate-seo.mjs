#!/usr/bin/env node
// SEO gate for the static export. Run after `pnpm --filter tools build`:
//
//   pnpm --filter tools seo:check
//
// Reads apps/tools/out (the exact files that get deployed) and fails (exit 1)
// if any indexable page or sitemap breaks the rules in apps/tools/SEO.md:
// unique title/description, single self-referencing canonical, og/twitter tags,
// complete + reciprocal hreflang, valid JSON-LD (Google's applicationCategory
// list, no invented ratings, FAQ text visible on the page, breadcrumb shape),
// and sitemap <-> page parity (every indexable canonical URL is in exactly one
// sitemap file, in scope, with the same hreflang set as the page).
// No dependencies — plain Node.

import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve(import.meta.dirname, "..", "out");
const ORIGIN = "https://clearcutoff.in";
const LOCALES = ["en", "hi", "mr"];
const PREFIX = { en: "", hi: "/hi", mr: "/mr" };
const SECTIONS = ["core", "resizer-exams", "resizer-categories", "age-calculators"];
const APP_CATEGORIES = new Set([
  "GameApplication", "SocialNetworkingApplication", "TravelApplication", "ShoppingApplication", "SportsApplication",
  "LifestyleApplication", "BusinessApplication", "DesignApplication", "DeveloperApplication", "DriverApplication",
  "EducationalApplication", "HealthApplication", "FinanceApplication", "SecurityApplication", "BrowserApplication",
  "CommunicationApplication", "DesktopEnhancementApplication", "EntertainmentApplication", "MultimediaApplication",
  "HomeApplication", "UtilitiesApplication", "ReferenceApplication",
]);

if (!fs.existsSync(OUT)) {
  console.error(`No build output at ${OUT} — run the build first.`);
  process.exit(2);
}

const problems = new Map(); // rule -> messages
const warnings = new Map();
const add = (map, rule, msg) => (map.get(rule) ?? map.set(rule, []).get(rule)).push(msg);
const fail = (rule, msg) => add(problems, rule, msg);
const warn = (rule, msg) => add(warnings, rule, msg);

const decode = (s) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'");

function* htmlFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "_next") continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(p);
    else if (entry.name.endsWith(".html") && !["404.html", "_not-found.html"].includes(entry.name)) yield p;
  }
}

// Removes <script>/<style> blocks by scanning (regexes on multi-hundred-KB RSC payloads are slow).
function stripBlocks(html, tag) {
  let out = "";
  let i = 0;
  for (;;) {
    const a = html.indexOf(`<${tag}`, i);
    if (a < 0) return out + html.slice(i);
    out += html.slice(i, a);
    const b = html.indexOf(`</${tag}>`, a);
    if (b < 0) return out;
    i = b + tag.length + 3;
  }
}

const visibleText = (html) =>
  decode(stripBlocks(stripBlocks(html.slice(html.indexOf("<body")), "script"), "style").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ");

const metaContent = (head, attr, name) => {
  const m = head.match(new RegExp(`<meta[^>]+${attr}="${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*content="([^"]*)"`)) ??
    head.match(new RegExp(`<meta[^>]+content="([^"]*)"[^>]+${attr}="${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  return m ? decode(m[1]) : null;
};

function jsonLdBlocks(html) {
  const blocks = [];
  const re = /<script[^>]*application\/ld\+json[^>]*>/g;
  let m;
  while ((m = re.exec(html))) {
    const end = html.indexOf("</script>", re.lastIndex);
    blocks.push(html.slice(re.lastIndex, end));
  }
  return blocks;
}

// ── load pages ─────────────────────────────────────────────────────────────
const pages = [];
for (const file of htmlFiles(OUT)) {
  const html = fs.readFileSync(file, "utf8");
  const rel = "/" + path.relative(OUT, file).replaceAll("\\", "/");
  const head = html.slice(0, html.indexOf("</head>"));
  const canonicals = [...head.matchAll(/<link rel="canonical" href="([^"]*)"/g)].map((m) => m[1]);
  const hreflang = Object.fromEntries(
    [...head.matchAll(/<link rel="alternate" hrefLang="([^"]*)" href="([^"]*)"/gi)].map((m) => [m[1], m[2]]),
  );
  const robots = metaContent(head, "name", "robots");
  const ld = [];
  for (const raw of jsonLdBlocks(html)) {
    try {
      const j = JSON.parse(raw);
      ld.push(...(j["@graph"] ?? [j]));
    } catch (e) {
      fail("jsonld-invalid-json", `${rel}: ${e.message}`);
    }
  }
  pages.push({
    rel,
    html,
    head,
    canonicals,
    hreflang,
    robots,
    ld,
    noindex: !!robots && /noindex/i.test(robots),
    title: (head.match(/<title>([^<]*)<\/title>/) ?? [])[1] ? decode(head.match(/<title>([^<]*)<\/title>/)[1]) : null,
    titleCount: (head.match(/<title>/g) ?? []).length,
    desc: metaContent(head, "name", "description"),
    descCount: (head.match(/<meta name="description"/g) ?? []).length,
    og: Object.fromEntries(["title", "description", "url", "type", "site_name", "image", "locale"].map((k) => [k, metaContent(head, "property", `og:${k}`)])),
    tw: Object.fromEntries(["card", "image"].map((k) => [k, metaContent(head, "name", `twitter:${k}`)])),
    h1: (html.match(/<h1/g) ?? []).length,
    links: new Set([...html.matchAll(/<a [^>]*href="([^"#?]+)/g)].map((m) => m[1])),
  });
}

const indexable = pages.filter((p) => !p.noindex);
const byCanonical = new Map(indexable.filter((p) => p.canonicals.length).map((p) => [p.canonicals[0], p]));

// ── per-page rules ─────────────────────────────────────────────────────────
for (const p of indexable) {
  if (!p.title) fail("title-missing", p.rel);
  if (p.titleCount !== 1) fail("title-count", `${p.rel}: ${p.titleCount}`);
  if (!p.desc) fail("description-missing", p.rel);
  if (p.descCount !== 1) fail("description-count", `${p.rel}: ${p.descCount}`);
  if (p.canonicals.length !== 1) fail("canonical-count", `${p.rel}: ${JSON.stringify(p.canonicals)}`);
  else if (!p.canonicals[0].startsWith(`${ORIGIN}/`) || p.canonicals[0].endsWith("/") || p.canonicals[0].includes("?"))
    fail("canonical-shape", `${p.rel}: ${p.canonicals[0]}`);
  for (const k of ["title", "description", "url", "type", "site_name", "image", "locale"]) if (!p.og[k]) fail(`og-missing-${k}`, p.rel);
  if (p.og.url !== p.canonicals[0]) fail("og-url-vs-canonical", `${p.rel}: ${p.og.url}`);
  if (p.tw.card !== "summary_large_image") fail("twitter-card", `${p.rel}: ${p.tw.card}`);
  if (!p.tw.image) fail("twitter-image", p.rel);
  if (p.h1 < 1) fail("no-h1", p.rel);
  if (p.ld.length === 0) fail("no-jsonld", p.rel);
}

for (const field of ["title", "desc"]) {
  const seen = new Map();
  for (const p of indexable) if (p[field]) seen.set(p[field], [...(seen.get(p[field]) ?? []), p.rel]);
  for (const [v, list] of seen) if (list.length > 1) fail(`duplicate-${field}`, `${list.length}x "${v.slice(0, 70)}" e.g. ${list.slice(0, 2).join(", ")}`);
}

// ── hreflang: complete, self-referencing, reciprocal, x-default ────────────
for (const p of indexable) {
  const keys = Object.keys(p.hreflang).sort().join(",");
  if (keys !== "en,hi,mr,x-default") {
    fail("hreflang-set", `${p.rel}: ${keys || "none"}`);
    continue;
  }
  if (!Object.values(p.hreflang).includes(p.canonicals[0])) fail("hreflang-no-self", p.rel);
  for (const [lang, url] of Object.entries(p.hreflang)) {
    const other = byCanonical.get(url);
    if (!other) {
      fail("hreflang-target-missing", `${p.rel} -> ${lang} ${url}`);
      continue;
    }
    if (JSON.stringify(other.hreflang) !== JSON.stringify(p.hreflang)) fail("hreflang-not-reciprocal", `${p.rel} vs ${other.rel}`);
  }
}

// ── JSON-LD rules ──────────────────────────────────────────────────────────
const nodeTypes = {};
for (const p of indexable) {
  const texts = () => (p._text ??= visibleText(p.html));
  for (const node of p.ld) {
    const t = node["@type"];
    nodeTypes[t] = (nodeTypes[t] ?? 0) + 1;
    if (t === "WebApplication") {
      for (const req of ["name", "offers", "applicationCategory", "url"]) if (!(req in node)) fail(`webapp-missing-${req}`, p.rel);
      if (!APP_CATEGORIES.has(node.applicationCategory)) fail("webapp-category", `${p.rel}: ${node.applicationCategory}`);
      if ("aggregateRating" in node || "review" in node) fail("webapp-invented-rating", p.rel);
      if (node.url !== p.canonicals[0]) fail("webapp-url-vs-canonical", p.rel);
    } else if (t === "BreadcrumbList") {
      const items = node.itemListElement ?? [];
      if (items.length < 2) fail("breadcrumb-count", p.rel);
      if (items.some((it, i) => it.position !== i + 1)) fail("breadcrumb-positions", p.rel);
      if (items.some((it) => !it.name || !String(it.item ?? "").startsWith("https://"))) fail("breadcrumb-item", p.rel);
      if (items.at(-1)?.item !== p.canonicals[0]) fail("breadcrumb-last-vs-canonical", p.rel);
    } else if (t === "FAQPage") {
      const qs = node.mainEntity ?? [];
      if (qs.length === 0) fail("faq-empty", p.rel);
      for (const q of qs) {
        if (q["@type"] !== "Question" || !q.acceptedAnswer?.text) fail("faq-shape", p.rel);
        if (q.name && !texts().includes(q.name.slice(0, 60))) fail("faq-not-visible", `${p.rel}: ${q.name.slice(0, 50)}`);
      }
    } else if (t === "CollectionPage") {
      const list = node.mainEntity?.itemListElement ?? [];
      if (node.mainEntity?.numberOfItems !== list.length) fail("itemlist-count", p.rel);
      for (const it of list) if (!byCanonical.has(it.url)) fail("itemlist-url-not-a-page", `${p.rel}: ${it.url}`);
    }
  }
}

// ── sitemaps: index -> files -> pages ──────────────────────────────────────
const readXml = (file) => (fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null);
const locs = (xml, tag) => [...xml.matchAll(new RegExp(`<${tag}>\\s*<loc>([^<]+)</loc>`, "g"))].map((m) => m[1]);

const indexXml = readXml(path.join(OUT, "sitemap-index.xml"));
const inSitemap = new Map();
let sitemapFiles = 0;
if (!indexXml) fail("sitemap-index-missing", "out/sitemap-index.xml");
else {
  const listed = locs(indexXml, "sitemap");
  const expected = LOCALES.flatMap((l) => SECTIONS.map((s) => `${ORIGIN}${PREFIX[l]}/tools/sitemap/${s}.xml`));
  if (JSON.stringify([...listed].sort()) !== JSON.stringify([...expected].sort())) fail("sitemap-index-contents", `expected ${expected.length} files, got ${listed.length}`);
  if (/<lastmod>|<priority>|<changefreq>/.test(indexXml)) fail("sitemap-index-extra-tags", "unexpected lastmod/priority/changefreq");

  for (const url of listed) {
    const rel = url.replace(ORIGIN, "").replace(/^(\/(?:hi|mr))?\/tools\//, "$1/");
    const xml = readXml(path.join(OUT, rel));
    if (!xml) {
      fail("sitemap-file-missing", `${url} (out${rel})`);
      continue;
    }
    sitemapFiles++;
    const locale = url.startsWith(`${ORIGIN}/hi/`) ? "hi" : url.startsWith(`${ORIGIN}/mr/`) ? "mr" : "en";
    const scope = `${ORIGIN}${PREFIX[locale]}/tools`;
    if (/<lastmod>|<priority>|<changefreq>/.test(xml)) fail("sitemap-extra-tags", url);
    for (const entry of xml.match(/<url>[\s\S]*?<\/url>/g) ?? []) {
      const loc = entry.match(/<loc>([^<]+)<\/loc>/)[1];
      inSitemap.set(loc, (inSitemap.get(loc) ?? 0) + 1);
      if (!(loc === scope || loc.startsWith(`${scope}/`))) fail("sitemap-scope", `${url} lists ${loc}`);
      if (loc === `${ORIGIN}/tools`) continue; // the Worker-rendered index page: not in this build
      const page = byCanonical.get(loc);
      if (!page) {
        fail("sitemap-url-not-an-indexable-page", loc);
        continue;
      }
      const alts = Object.fromEntries([...entry.matchAll(/hreflang="([^"]+)"\s+href="([^"]+)"/g)].map((m) => [m[1], m[2]]));
      if (JSON.stringify(alts) !== JSON.stringify(page.hreflang)) fail("sitemap-hreflang-vs-page", loc);
    }
  }
}
for (const [canonical] of byCanonical) if ((inSitemap.get(canonical) ?? 0) !== 1) fail("page-not-in-exactly-one-sitemap", `${canonical} (${inSitemap.get(canonical) ?? 0})`);
for (const [loc, n] of inSitemap) if (n > 1) fail("sitemap-duplicate-url", loc);

// ── internal links (warning only) ──────────────────────────────────────────
const inbound = new Map();
for (const p of indexable) {
  const seen = new Set();
  for (const raw of p.links) {
    const href = (raw.startsWith("/") ? ORIGIN + raw : raw).replace(/\/$/, "");
    if (byCanonical.has(href) && byCanonical.get(href) !== p) seen.add(href);
  }
  for (const href of seen) inbound.set(href, (inbound.get(href) ?? 0) + 1);
}
// The tool hubs are linked from the /tools index page, which the Worker renders (not part of this build).
const LINKED_FROM_WORKER_INDEX = new Set(["/tools/resizer", "/tools/age-eligibility-calculator", "/tools/syllabus-tracker"].map((p) => ORIGIN + p));
for (const [canonical] of byCanonical) if (!inbound.has(canonical) && !LINKED_FROM_WORKER_INDEX.has(canonical)) warn("no-inbound-link", canonical);

// ── report ─────────────────────────────────────────────────────────────────
console.log(`pages: ${pages.length} (${indexable.length} indexable, ${pages.length - indexable.length} noindex) | sitemap files: ${sitemapFiles} | urls in sitemaps: ${inSitemap.size}`);
console.log(`JSON-LD nodes: ${JSON.stringify(nodeTypes)}`);
for (const [rule, list] of warnings) console.log(`warning ${rule}: ${list.length} e.g. ${list.slice(0, 3).join(" | ")}`);
if (problems.size === 0) {
  console.log("SEO check passed.");
} else {
  for (const [rule, list] of problems) console.error(`FAIL ${rule}: ${list.length} e.g. ${list.slice(0, 3).join(" | ")}`);
  process.exit(1);
}
