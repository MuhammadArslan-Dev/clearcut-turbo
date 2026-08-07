#!/usr/bin/env node
/**
 * Design-token guard: fails CI when new hardcoded colours are introduced.
 *
 *   node scripts/check-hardcoded-colors.mjs            # gate against the baseline
 *   node scripts/check-hardcoded-colors.mjs --report   # human-readable audit
 *   node scripts/check-hardcoded-colors.mjs --update   # re-baseline (review the diff!)
 *
 * Why a baseline instead of zero-tolerance: the audit found ~1000 pre-existing
 * literals across the three apps. Blocking on all of them would mean nobody
 * could merge anything. The baseline pins today's count per package so the
 * number can only go DOWN — new hardcoded colours fail the build, and paying
 * down existing ones is rewarded rather than punished.
 *
 * Exceptions are matched by intent (brand logos, chart palettes, inline SVG
 * assets, third-party SDK colours) and reported separately — see EXCEPTIONS.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE_FILE = path.join(ROOT, "scripts", "hardcoded-colors-baseline.json");

const SCAN_ROOTS = ["apps", "packages"];
const SKIP_DIRS = new Set([
  "node_modules", ".next", ".turbo", ".git", "build", "dist", "coverage", "out", "lhout",
]);
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".scss", ".mjs", ".cjs"]);

/** The single source of truth. Colours defined here are, by definition, fine. */
const TOKEN_SOURCE = "packages/design-tokens/tokens.css";

const PATTERNS = [
  ["hex", /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g],
  ["rgb", /\brgba?\(\s*[\d.]+%?\s*[, ]\s*[\d.]+%?\s*[, ]\s*[\d.]+%?\s*(?:[,/]\s*[\d.%]+\s*)?\)/g],
  ["hsl", /\bhsla?\(\s*[\d.]+(?:deg)?\s*[, ]\s*[\d.]+%\s*[, ]\s*[\d.]+%\s*(?:[,/]\s*[\d.%]+\s*)?\)/g],
  ["oklch", /\boklch\(\s*[^)]+\)/g],
];
const TW_ARBITRARY =
  /\b(?:bg|text|border|ring|fill|stroke|shadow|outline|decoration|divide|from|via|to|accent|caret|placeholder)-\[([^\]]+)\]/g;

/**
 * Intentional, documented exceptions. A brand mark must not shift when the
 * palette is retuned; chart series need their own categorical scale; third-party
 * SDKs and inline SVG illustrations carry their own colours.
 */
const EXCEPTIONS = [
  [/\/icons?\//i, "icon asset"],
  [/icon\.tsx?$/i, "icon asset"],
  [/logo/i, "brand logo"],
  [/chart|recharts/i, "chart palette"],
  [/sentry|amplitude|gtm|pixel|facebook|instagram|linkedin|youtube|telegram/i, "third-party"],
];

function walk(dir, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(p, out);
    } else if (EXTS.has(path.extname(e.name))) out.push(p);
  }
  return out;
}

function exceptionFor(rel, line, lines, idx) {
  for (const [re, label] of EXCEPTIONS) {
    if (re.test(rel)) return label;
  }
  if (/<svg|viewBox|data:image\/svg/i.test(line)) return "inline SVG asset";
  // An <svg> element's fill/stroke attributes are usually spread over several
  // lines, so a same-line check misses them (e.g. the inline StarIcon in
  // packages/auth/src/screens/otp-screen.tsx). Treat a colour as SVG artwork if
  // an unclosed <svg> opens shortly above it. Vector artwork is deliberately NOT
  // tokenised: illustrations and marks should keep their own colours so a
  // palette change can never distort them.
  const WINDOW = 12;
  for (let i = idx; i >= Math.max(0, idx - WINDOW); i--) {
    if (/<\/svg>/i.test(lines[i]) && i !== idx) break;
    if (/<svg[\s>]/i.test(lines[i])) return "inline SVG asset";
  }
  return null;
}

function scan() {
  const findings = [];
  for (const root of SCAN_ROOTS) {
    for (const file of walk(path.join(ROOT, root))) {
      const rel = path.relative(ROOT, file).split(path.sep).join("/");
      if (rel === TOKEN_SOURCE) continue;
      const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
      lines.forEach((text, i) => {
        const trimmed = text.trim();
        // skip comment-only lines: documenting a hex is not using one
        if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) return;
        const hits = [];
        for (const [kind, re] of PATTERNS) {
          re.lastIndex = 0;
          let m;
          while ((m = re.exec(text))) hits.push({ raw: m[0], kind });
        }
        TW_ARBITRARY.lastIndex = 0;
        let m;
        while ((m = TW_ARBITRARY.exec(text))) {
          const inner = m[1];
          if (/^var\(/.test(inner)) continue; // already tokenised
          if (/^(?:#|rgba?\(|hsla?\(|oklch\()/.test(inner)) hits.push({ raw: inner, kind: "tw-arbitrary" });
        }
        for (const h of hits) {
          findings.push({ file: rel, line: i + 1, ...h, exception: exceptionFor(rel, text, lines, i) });
        }
      });
    }
  }
  return findings;
}

function tally(findings) {
  const counts = {};
  for (const f of findings) {
    if (f.exception) continue;
    const pkg = f.file.split("/").slice(0, 2).join("/");
    counts[pkg] = (counts[pkg] || 0) + 1;
  }
  return counts;
}

const findings = scan();
const counts = tally(findings);
const mode = process.argv.includes("--update")
  ? "update"
  : process.argv.includes("--report")
    ? "report"
    : "gate";

if (mode === "report") {
  const excepted = findings.filter((f) => f.exception).length;
  console.log(`hardcoded colour literals (excluding ${excepted} intentional exceptions):\n`);
  Object.entries(counts).sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => console.log(`  ${String(v).padStart(5)}  ${k}`));
  console.log(`\n  ${String(Object.values(counts).reduce((a, b) => a + b, 0)).padStart(5)}  TOTAL`);
  process.exit(0);
}

if (mode === "update") {
  fs.writeFileSync(BASELINE_FILE, JSON.stringify(counts, null, 2) + "\n");
  console.log("baseline written to scripts/hardcoded-colors-baseline.json");
  console.log(JSON.stringify(counts, null, 2));
  process.exit(0);
}

// gate
if (!fs.existsSync(BASELINE_FILE)) {
  console.error("No baseline found. Run: node scripts/check-hardcoded-colors.mjs --update");
  process.exit(1);
}
const baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, "utf8"));
let failed = false;
const improvements = [];

for (const pkg of new Set([...Object.keys(counts), ...Object.keys(baseline)])) {
  const now = counts[pkg] || 0;
  const was = baseline[pkg] ?? 0;
  if (now > was) {
    failed = true;
    console.error(`✗ ${pkg}: ${now} hardcoded colours, baseline ${was} (+${now - was})`);
  } else if (now < was) {
    improvements.push(`✓ ${pkg}: ${now} (was ${was}, -${was - now})`);
  }
}

improvements.forEach((l) => console.log(l));

if (failed) {
  console.error(
    "\nNew hardcoded colours were introduced. Use a token from " +
      "@clearcut/design-tokens instead, e.g. bg-[var(--color-brand)].\n" +
      "If the colour is a genuine exception (brand logo, chart series, inline SVG),\n" +
      "put it in a path the guard already excepts, or extend EXCEPTIONS in\n" +
      "scripts/check-hardcoded-colors.mjs with a justification.\n" +
      "If you intentionally paid down debt elsewhere, re-baseline with --update.",
  );
  process.exit(1);
}

console.log("\n✓ no new hardcoded colours");
