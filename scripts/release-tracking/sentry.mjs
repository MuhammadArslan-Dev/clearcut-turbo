// Sentry side of release tracking (phase 117).
// State is READ through the documented REST endpoint GET /api/0/organizations/{org}/releases/{version}/
// (fields used: projects[].slug, commitCount, deployCount, lastDeploy.environment, dateReleased).
// Writes go through the official sentry-cli (flags verified against the installed 2.58.6 help):
//   releases new -p PROJECT VERSION · releases set-commits VERSION --commit REPO@PREV..SHA
//   deploys new -r VERSION -e ENV -n NAME -u URL --finished TS · releases finalize VERSION --released TS
// Every step first checks the state, so a re-run never creates a second record. Deploys cannot be deleted in Sentry,
// so a deploy is created only when the release has NO deploy yet; if deploys exist but the latest is not for this
// environment the tracker cannot prove there is no duplicate and skips it with a warning.
import { execFileSync } from "node:child_process";
import { requestJson } from "./http.mjs";

export const SENTRY_CLI_VERSION = "2.58.6";

export function createSentryClient({ baseUrl, org, token, fetchImpl, backoffMs, runCli }) {
  const origin = String(baseUrl).replace(/\/+$/, "");
  // SENTRY_CLI_BIN = path to the sentry-cli JS wrapper (used for local runs on Windows, where spawning `npx` fails);
  // otherwise `npx @sentry/cli@<pinned version>` (GitHub Actions / Linux).
  const [bin, binArgs] = process.env.SENTRY_CLI_BIN ? [process.execPath, [process.env.SENTRY_CLI_BIN]] : ["npx", ["--yes", `@sentry/cli@${SENTRY_CLI_VERSION}`]];
  const cli =
    runCli ??
    ((args) =>
      execFileSync(bin, [...binArgs, ...args], {
        env: { ...process.env, SENTRY_AUTH_TOKEN: token, SENTRY_ORG: org, SENTRY_URL: origin, SENTRY_DISABLE_TELEMETRY: "1" },
        stdio: ["ignore", "pipe", "pipe"],
        encoding: "utf8",
        timeout: 120_000,
      }));

  return {
    /** null when the release does not exist (404). */
    async getRelease(version) {
      try {
        return await requestJson(`${origin}/api/0/organizations/${encodeURIComponent(org)}/releases/${encodeURIComponent(version)}/`, {
          headers: { Authorization: `Bearer ${token}` },
          retries: 2,
          fetchImpl,
          backoffMs,
        });
      } catch (e) {
        if (e.status === 404) return null;
        throw e;
      }
    },
    createRelease: (version, project) => cli(["releases", "new", "-p", project, version]),
    setCommits: (version, spec, project) => cli(["releases", "set-commits", "-p", project, version, "--commit", spec]),
    createDeploy: (version, { environment, name, url, finishedUnix }) =>
      cli(["deploys", "new", "-r", version, "-e", environment, "-n", name, ...(url ? ["-u", url] : []), "--finished", String(finishedUnix)]),
    finalize: (version, releasedUnix) => cli(["releases", "finalize", version, "--released", String(releasedUnix)]),
    /** Only for the self-test (throwaway release); the tracker itself never deletes anything. */
    deleteRelease: (version, project) => cli(["releases", "delete", "-p", project, version]),
  };
}

/** Brings the Sentry release of one app deployment to the final state; returns what it did / skipped. */
export async function syncSentry({ client, app, release, environment }) {
  const version = release.sha;
  const did = [];
  const skipped = [];
  const warnings = [];
  const finishedUnix = Math.floor(Date.parse(release.finishedAt) / 1000);

  let state = await client.getRelease(version);
  if (!state) {
    await client.createRelease(version, app.sentryProject);
    did.push("release created");
    state = { projects: [{ slug: app.sentryProject }], commitCount: 0, deployCount: 0, lastDeploy: null, dateReleased: null };
  } else if (!(state.projects ?? []).some((p) => p.slug === app.sentryProject)) {
    throw new Error(`Sentry release ${version.slice(0, 7)} exists but not in project ${app.sentryProject}; not touching it`);
  }

  if ((state.commitCount ?? 0) > 0) skipped.push("commits already set");
  else if (!release.previousSha) skipped.push("commits: first release of this app has no previous commit (Sentry needs one)");
  else {
    // NON-FATAL: Sentry can only link commits of repositories its GitHub integration knows (today only the Clear-Cutoff org).
    // A failure here must not stop the deploy record and the finalize below; it is retried (and warned about) on the next run.
    try {
      await client.setCommits(version, `${app.repo}@${release.previousSha}..${release.sha}`, app.sentryProject);
      did.push("commits set");
    } catch (e) {
      const lines = String(e.stderr || e.message || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const errLines = lines.filter((l) => /^error:|sentry reported an error/i.test(l));
      const detail = (errLines.length ? errLines : lines.slice(-2)).join(" | ").slice(0, 240);
      warnings.push(`commits NOT set for ${app.repo} (release continues without them): ${detail}`);
    }
  }

  if ((state.deployCount ?? 0) === 0) {
    await client.createDeploy(version, { environment, name: app.id, url: app.url, finishedUnix });
    did.push(`deploy ${environment} created`);
  } else if (state.lastDeploy?.environment === environment) skipped.push(`deploy ${environment} already exists`);
  else skipped.push(`deploy NOT created: release already has deploys but the latest is for "${state.lastDeploy?.environment}", cannot prove no ${environment} duplicate`);

  if (state.dateReleased) skipped.push("already finalized");
  else {
    await client.finalize(version, finishedUnix);
    did.push("finalized");
  }
  return { did, skipped, warnings };
}
