#!/usr/bin/env node
// Real-Sentry self-test (phase 117). Uses a THROWAWAY release name, never a real SHA, and deletes it at the end.
//   node scripts/release-tracking/sentry-selftest.mjs [--keep]
// Needs SENTRY_AUTH_TOKEN (+ optional SENTRY_ORG, SENTRY_URL) in the environment or in the git-ignored local file `coolify-token`.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { APPS } from "./config.mjs";
import { createSentryClient, syncSentry } from "./sentry.mjs";

const fileVals = {};
if (existsSync("coolify-token")) {
  for (const line of readFileSync("coolify-token", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith("#")) fileVals[m[1]] = m[2];
  }
}
const pick = (k, d = "") => process.env[k] || fileVals[k] || d;
const token = pick("SENTRY_AUTH_TOKEN");
const org = pick("SENTRY_ORG", "clear-cutoff");
const baseUrl = pick("SENTRY_URL", "https://de.sentry.io");
if (!token) {
  console.error("No SENTRY_AUTH_TOKEN available (env or local coolify-token file).");
  process.exit(2);
}
if (!process.env.SENTRY_CLI_BIN) {
  const pnpm = "node_modules/.pnpm";
  const dir = existsSync(pnpm) ? readdirSync(pnpm).find((d) => d.startsWith("@sentry+cli@2.58.6")) : null;
  const bin = dir ? join(pnpm, dir, "node_modules/@sentry/cli/bin/sentry-cli") : null;
  if (bin && existsSync(bin)) process.env.SENTRY_CLI_BIN = bin;
}

const keep = process.argv.includes("--keep");
const dash = APPS.find((a) => a.id === "dashboard");
const version = `release-tracking-selftest-${Date.now()}`;
const environment = "release-tracking-selftest";
const release = { sha: version, previousSha: "8d604a99d8be9a10b040c7a87d7a8664ae1a42c0", finishedAt: new Date().toISOString() };
const client = createSentryClient({ baseUrl, org, token });
let failed = 0;
const check = (ok, label, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${extra ? "  -> " + extra : ""}`);
  if (!ok) failed++;
};
const show = (r) => `did=[${r.did.join("; ")}] skipped=[${r.skipped.join("; ")}] warnings=${r.warnings.length}`;

console.log(`Sentry self-test: org=${org} url=${baseUrl} project=${dash.sentryProject} throwaway release=${version}\n`);

// 0. a wrong token is a real 401, reported without the token and without crashing
const bad = createSentryClient({ baseUrl, org, token: "sntrys_not-a-real-token", backoffMs: 1 });
try {
  await bad.getRelease(version);
  check(false, "wrong token is rejected");
} catch (e) {
  check(/HTTP 401|HTTP 403/.test(e.message) && !e.message.includes("sntrys_"), "wrong token -> real Sentry rejects it, error carries no token", e.message);
}

// 1. the throwaway release does not exist yet
check((await client.getRelease(version)) === null, "throwaway release does not exist before the run (REST 404 handled as null)");

// 2. first run: creates release, deploy, finalize; commits fail for real (repo not known to Sentry) and must not stop the rest
const r1 = await syncSentry({ client, app: dash, release, environment });
console.log("run 1:", show(r1));
for (const w of r1.warnings) console.log("  warning:", w);
check(r1.did.includes("release created"), "run 1: release created");
check(r1.did.includes(`deploy ${environment} created`), "run 1: deploy created");
check(r1.did.includes("finalized"), "run 1: release finalized");

// 3. state as Sentry really holds it (documented REST fields)
const s1 = await client.getRelease(version);
check(!!s1 && s1.version === version, "Sentry returns the release by its exact version (the full-SHA naming works the same way)");
check((s1?.projects ?? []).some((p) => p.slug === dash.sentryProject), `release is attached to project ${dash.sentryProject}`);
check(s1?.deployCount === 1 && s1?.lastDeploy?.environment === environment, "exactly 1 deploy, environment recorded", `deployCount=${s1?.deployCount} env=${s1?.lastDeploy?.environment} name=${s1?.lastDeploy?.name}`);
check(!!s1?.dateReleased, "release has a release date (finalized)", String(s1?.dateReleased));
console.log(`  commitCount=${s1?.commitCount} (0 is expected here: Sentry's GitHub integration does not know ${dash.repo})`);

// 4. DUPLICATE PREVENTION / RETRY: the same release again must not create a second deploy or touch finalize
const r2 = await syncSentry({ client, app: dash, release, environment });
console.log("run 2:", show(r2));
check(!r2.did.some((d) => d.startsWith("deploy")) && !r2.did.includes("finalized") && !r2.did.includes("release created"), "run 2 (retry): nothing re-created");
const s2 = await client.getRelease(version);
check(s2?.deployCount === 1, "still exactly 1 deploy after the retry (no duplicate)", `deployCount=${s2?.deployCount}`);

// 5. a third run, same result (idempotent, not just once)
const r3 = await syncSentry({ client, app: dash, release, environment });
check(!r3.did.some((d) => d.startsWith("deploy")), "run 3: still no second deploy");
check((await client.getRelease(version))?.deployCount === 1, "deployCount still 1 after three runs");

// 6. cleanup of the throwaway release
if (keep) console.log(`\n--keep: leaving ${version} in Sentry`);
else {
  let deleted = false;
  try {
    await client.deleteRelease(version, dash.sentryProject);
    deleted = true;
  } catch (e) {
    const why = String(e.stderr || e.message).split(/\r?\n/).find((l) => /permission|error/i.test(l)) ?? "delete failed";
    console.log(`NOTE: the self-test token cannot delete releases (${why.trim().slice(0, 160)}).`);
    console.log(`      MANUAL CLEANUP NEEDED: archive/delete release "${version}" in Sentry (Releases page).`);
  }
  if (deleted) check((await client.getRelease(version)) === null, "throwaway release deleted again (nothing left behind in Sentry)");
}

console.log(`\n${failed ? `${failed} CHECK(S) FAILED` : "ALL CHECKS PASSED"}`);
process.exit(failed ? 1 : 0);
