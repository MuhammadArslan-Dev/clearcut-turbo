#!/usr/bin/env node
// Release tracker (phase 117). Default = DRY-RUN: reads Coolify + git, prints what it WOULD do, writes nothing.
//   node scripts/release-tracking/run.mjs [--app dashboard] [--track-from 2026-11-16T00:00:00Z] [--write]
// --write needs: a tracking start (RELEASE_TRACKING_FROM / --track-from / config TRACK_FROM) and the secrets below.
//   Coolify : <HOST>_COOLIFY_URL / <HOST>_COOLIFY_TOKEN   (HOST = ORACLE, HETZNER)
//   Jira    : JIRA_EMAIL, JIRA_API_TOKEN, [JIRA_BASE_URL = https://clear-cutoff.atlassian.net]
//   Sentry  : SENTRY_AUTH_TOKEN, [SENTRY_ORG = clear-cutoff], [SENTRY_URL = https://de.sentry.io], [SENTRY_WEB_URL]
//   GitHub  : RELEASE_GH_TOKEN (read access to the backend repo; secret names cannot start with GITHUB_)
import { APPS, TRACK_FROM, JIRA_PROJECT_KEYS, ENVIRONMENT } from "./config.mjs";
import { loadCredentials, fetchDeployments } from "./coolify.mjs";
import { commitExists, commitsInRange } from "./git.mjs";
import { commitsInRangeGithub } from "./github.mjs";
import { planReleases, extractJiraKeys, buildMarker } from "./lib.mjs";
import { createJiraClient } from "./jira.mjs";
import { createSentryClient } from "./sentry.mjs";
import { processRelease, hasFailure } from "./track.mjs";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const WRITE = args.includes("--write");
const ci = process.env.GITHUB_ACTIONS === "true";
const warn = (msg) => console.log(ci ? `::warning::${msg}` : `   WARNING: ${msg}`);

const onlyApps = args.flatMap((a, i) => (a === "--app" ? [args[i + 1]] : []));
const apps = onlyApps.length ? APPS.filter((a) => onlyApps.includes(a.id)) : APPS;
if (onlyApps.length && apps.length !== onlyApps.length) {
  console.error(`Unknown app. Known: ${APPS.map((a) => a.id).join(", ")}`);
  process.exit(2);
}

let trackFrom = flag("--track-from") || process.env.RELEASE_TRACKING_FROM || TRACK_FROM;
if (!trackFrom) {
  if (WRITE) {
    console.error("Refusing to write: no tracking start. Set RELEASE_TRACKING_FROM (ISO date of go-live) so old releases are never touched.");
    process.exit(2);
  }
  trackFrom = new Date(Date.now() - 7 * 86_400_000).toISOString();
  console.log(`NOTE: no tracking start configured; dry-run looks at the last 7 days (since ${trackFrom}).`);
}

const env = process.env;
// Jira is OFF while there is no Atlassian API token (documented blocker, phase doc section 10) or when RELEASE_TRACKING_JIRA=off.
// It is never skipped silently: the reason is printed for every release and as a GitHub warning in CI.
const jiraOffReason = env.RELEASE_TRACKING_JIRA === "off" ? "disabled on purpose (RELEASE_TRACKING_JIRA=off)" : !(env.JIRA_EMAIL && env.JIRA_API_TOKEN) ? "no Jira credentials (JIRA_EMAIL / JIRA_API_TOKEN)" : null;
const jira = WRITE && !jiraOffReason ? createJiraClient({ baseUrl: env.JIRA_BASE_URL || "https://clear-cutoff.atlassian.net", email: env.JIRA_EMAIL, token: env.JIRA_API_TOKEN }) : null;
const sentry = WRITE && env.SENTRY_AUTH_TOKEN ? createSentryClient({ baseUrl: env.SENTRY_URL || "https://de.sentry.io", org: env.SENTRY_ORG || "clear-cutoff", token: env.SENTRY_AUTH_TOKEN }) : null;
const sentryWebUrl = env.SENTRY_WEB_URL || "https://clear-cutoff.sentry.io";
const ghToken = env.RELEASE_GH_TOKEN || "";

console.log(`${WRITE ? "WRITE MODE" : "DRY-RUN"}, environment=${ENVIRONMENT}, releases that finished at/after ${trackFrom}`);
if (WRITE) {
  console.log(`integrations: Jira ${jira ? "on" : `OFF (${jiraOffReason})`}, Sentry ${sentry ? "on" : "OFF (no SENTRY_AUTH_TOKEN)"}`);
  if (!jira) warn(`Jira updates are OFF: ${jiraOffReason}`);
}
console.log("");

async function commitsFor(app, release) {
  if (app.gitSource === "local") {
    if (!commitExists(release.sha) || (release.previousSha && !commitExists(release.previousSha))) throw new Error("commit not in the local clone (checkout needs fetch-depth: 0)");
    return commitsInRange({ previousSha: release.previousSha, sha: release.sha, paths: app.paths });
  }
  if (!ghToken) return null;
  return commitsInRangeGithub({ repo: app.repo, previousSha: release.previousSha, sha: release.sha, token: ghToken });
}

let failures = 0;
for (const app of apps) {
  console.log(`== ${app.label} (${app.id}, Coolify ${app.host})`);
  const creds = loadCredentials(app.host);
  if (!creds) {
    console.log(`   SKIPPED: no ${app.host.toUpperCase()}_COOLIFY_URL / _TOKEN\n`);
    continue;
  }
  try {
    const from = Date.parse(trackFrom);
    const enough = (rows) => rows.some((d) => d.status === "finished" && d.finished_at && Date.parse(d.finished_at) < from);
    const { deployments, complete } = await fetchDeployments({ ...creds, uuid: app.uuid, enough });
    const plan = planReleases(deployments, { trackFrom, windowComplete: complete });

    for (const p of plan.pending) console.log(`   waiting: ${p.sha.slice(0, 7)} is ${p.status} (checked again next run)`);
    for (const n of plan.notReleased) console.log(`   no release: ${n.sha.slice(0, 7)} ${n.status}${n.known ? "" : " (UNKNOWN status, please report)"}`);
    if (!plan.releases.length) console.log("   no new successful deployments in this window");

    for (const r of plan.releases) {
      console.log(`   RELEASE ${r.sha.slice(0, 7)}  finished ${r.finishedAt}  ${r.manual ? "(manual deploy)" : "(webhook)"}  previous=${r.previousSha ? r.previousSha.slice(0, 7) : "none"}${r.previousUnreliable ? " (older history not read)" : ""}`);
      console.log(`     marker: ${buildMarker(app.id, r.sha)}`);
      let commits = null;
      try {
        commits = await commitsFor(app, r);
      } catch (e) {
        failures++;
        warn(`${app.id} ${r.sha.slice(0, 7)}: cannot read commits: ${e.message}`);
      }
      if (commits === null) console.log(`     commits/tickets: not available${app.gitSource === "github" && !ghToken ? " (set RELEASE_GH_TOKEN to read " + app.repo + ")" : ""}`);
      else console.log(`     commits in release: ${commits.length}`);

      if (!WRITE) {
        const keys = commits ? extractJiraKeys(commits.flatMap((c) => [c.subject, c.body]), JIRA_PROJECT_KEYS) : [];
        if (commits && !keys.length) console.log("     Jira: no ticket keys found -> no Jira comment");
        for (const key of keys) console.log(`     Jira ${key}: would add 1 comment (skipped if the marker already exists)`);
        console.log(`     Sentry (${app.sentryProject}): would create the release if missing, set commits, create deploy "${ENVIRONMENT}" if none, finalize (each only if not already done)`);
        continue;
      }

      const res = await processRelease({ app, release: r, commits, jira, jiraOffReason, sentry, environment: ENVIRONMENT, jiraProjectKeys: JIRA_PROJECT_KEYS, sentryWebUrl });
      const j = res.jira;
      console.log(`     Jira: ${j.notRun ? `not run (${j.notRun})` : `commented ${j.commented.join(", ") || "-"}; skipped ${j.skipped.map((s) => `${s.key} (${s.reason})`).join(", ") || "-"}`}`);
      for (const f of j.failed) warn(`${app.id} ${r.sha.slice(0, 7)} Jira ${f.key}: ${f.error} (retried next run)`);
      const s = res.sentry;
      console.log(`     Sentry: ${s.notRun ? `not run (${s.notRun})` : s.error ? "FAILED" : `did [${s.did.join("; ") || "-"}] skipped [${s.skipped.join("; ") || "-"}]`}`);
      for (const w of s.warnings ?? []) warn(`${app.id} ${r.sha.slice(0, 7)} Sentry: ${w}`);
      if (s.error) warn(`${app.id} ${r.sha.slice(0, 7)} Sentry: ${s.error} (retried next run)`);
      if (hasFailure(res)) failures++;
    }
    console.log("");
  } catch (e) {
    failures++;
    warn(`${app.id}: ${e.message}`);
    console.log("");
  }
}
process.exit(failures ? 1 : 0);
