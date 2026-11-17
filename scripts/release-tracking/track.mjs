// Applies ONE release to Jira and Sentry (phase 117). Jira and Sentry are independent: a failure in one never stops the other,
// a failure on one ticket never stops the next ticket, and everything is re-checked on the next run (no state stored here).
import { extractJiraKeys, buildMarker, commentHasMarker, buildReleaseComment } from "./lib.mjs";
import { syncSentry } from "./sentry.mjs";

export async function processRelease({ app, release, commits, jira, jiraOffReason, sentry, environment, jiraProjectKeys, sentryWebUrl }) {
  const result = { jira: { commented: [], skipped: [], failed: [], notRun: null }, sentry: { did: [], skipped: [], warnings: [], error: null, notRun: null } };
  const marker = buildMarker(app.id, release.sha);
  const repoUrl = `https://github.com/${app.repo}`;

  // ---- Jira
  const keys = commits ? extractJiraKeys(commits.flatMap((c) => [c.subject, c.body]), jiraProjectKeys) : [];
  if (!jira) result.jira.notRun = jiraOffReason || "no Jira credentials";
  else if (commits === null) result.jira.notRun = "commits not available for this repo (no GitHub token)";
  else if (!keys.length) result.jira.notRun = "no ticket keys in this release";
  else {
    for (const key of keys) {
      try {
        const own = commits.filter((c) => extractJiraKeys([c.subject, c.body], jiraProjectKeys).includes(key));
        const issue = await jira.getIssue(key);
        if (!issue) {
          result.jira.skipped.push({ key, reason: "ticket not found or not visible" });
          continue;
        }
        const comments = await jira.listComments(key);
        if (comments.some((c) => commentHasMarker(c.body, marker))) {
          result.jira.skipped.push({ key, reason: "already commented (marker found)" });
          continue;
        }
        const body = buildReleaseComment({
          app,
          environment,
          sha: release.sha,
          previousSha: release.previousSha,
          finishedAt: release.finishedAt,
          commits: own,
          repoUrl,
          sentryUrl: sentryWebUrl ? `${sentryWebUrl}/releases/${release.sha}/` : undefined,
          marker,
        });
        await jira.addComment(key, body);
        result.jira.commented.push(key);
      } catch (e) {
        result.jira.failed.push({ key, error: e.message });
      }
    }
  }

  // ---- Sentry
  if (!sentry) result.sentry.notRun = "no Sentry credentials";
  else {
    try {
      const r = await syncSentry({ client: sentry, app, release, environment });
      result.sentry.did = r.did;
      result.sentry.skipped = r.skipped;
      result.sentry.warnings = r.warnings;
    } catch (e) {
      result.sentry.error = e.message;
    }
  }
  return result;
}

export const hasFailure = (r) => r.jira.failed.length > 0 || r.sentry.error !== null;
