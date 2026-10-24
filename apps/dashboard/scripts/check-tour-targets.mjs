#!/usr/bin/env node
/**
 * Preparation page tour coverage guard.
 *
 * Fails when a tour target in startGuideIds.ts (PREP_TOUR):
 *   - has no step in prepTourSteps.ts, or
 *   - is not rendered by any component (`data-tour={PREP_TOUR.<key>}` or
 *     a `tourId={PREP_TOUR.<key>}` prop), or
 * when a step points at a key PREP_TOUR doesn't have, or a step's copy key
 * is missing from messages/{en,hi,mr}.json.
 *
 * A UI change that drops or renames a tour target therefore fails CI
 * instead of silently skipping a step. Run: pnpm --filter dashboard check:tour
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const COMPONENTS = join(root, "src/components/features/preparation/components");
const IDS_FILE = join(COMPONENTS, "startGuideIds.ts");
const STEPS_FILE = join(COMPONENTS, "prepTourSteps.ts");
const LOCALES = ["en", "hi", "mr"];

const read = (p) => readFileSync(p, "utf8");
const errors = [];

const idsSrc = read(IDS_FILE);
const idsBlock = idsSrc.match(/PREP_TOUR = \{([\s\S]*?)\} as const/);
if (!idsBlock) throw new Error("PREP_TOUR not found in startGuideIds.ts");
const keys = [...idsBlock[1].matchAll(/^\s*(\w+):\s*"([^"]+)"/gm)].map((m) => m[1]);

const stepsSrc = read(STEPS_FILE);
const steps = [...stepsSrc.matchAll(/\{\s*target:\s*"(\w+)"[^}]*?title:\s*"(\w+)"[^}]*?body:\s*"(\w+)"/g)].map(
  (m) => ({ target: m[1], title: m[2], body: m[3] }),
);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(name) && !/ copy( \d+)?\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}
const sources = walk(join(root, "src"))
  .filter((p) => p !== IDS_FILE && p !== STEPS_FILE)
  .map((p) => ({ p, src: read(p) }));

for (const key of keys) {
  if (!steps.some((s) => s.target === key)) errors.push(`PREP_TOUR.${key} has no step in prepTourSteps.ts`);
  const usage = new RegExp(`(data-tour|tourId)=\\{[^}]*PREP_TOUR\\.${key}\\b`);
  const renderedIn = sources.filter(({ src }) => usage.test(src)).map(({ p }) => relative(root, p));
  if (renderedIn.length === 0) errors.push(`PREP_TOUR.${key} is not rendered by any component`);
  else console.log(`  ${key.padEnd(12)} ${renderedIn.join(", ")}`);
}

for (const s of steps) {
  if (!keys.includes(s.target)) errors.push(`step target "${s.target}" is not in PREP_TOUR`);
}

for (const locale of LOCALES) {
  const guide = JSON.parse(read(join(root, `messages/${locale}.json`))).startGuide ?? {};
  for (const s of steps) {
    for (const k of [s.title, s.body]) {
      if (typeof guide[k] !== "string" || !guide[k].trim()) errors.push(`messages/${locale}.json startGuide.${k} missing`);
    }
  }
  for (const k of ["next", "skip", "done", "replay"]) {
    if (typeof guide[k] !== "string") errors.push(`messages/${locale}.json startGuide.${k} missing`);
  }
}

if (steps.length === 0) errors.push("no steps parsed from prepTourSteps.ts");

if (errors.length) {
  console.error(`\nTour check failed (${errors.length}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`\nTour check passed: ${keys.length} targets, ${steps.length} steps, ${LOCALES.join("/")} copy.`);
