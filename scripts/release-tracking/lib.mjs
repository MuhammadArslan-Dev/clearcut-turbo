// Pure release-tracking logic (phase 117): no network, no git, no clock. Everything here is unit-tested.

const PENDING = new Set(["queued", "in_progress"]);
const NOT_RELEASED = new Set(["failed", "cancelled-by-user", "skipped"]);

/** Coolify deployment status -> what the tracker does with it. Only "finished" is a successful deployment. */
export function classifyStatus(status) {
  if (status === "finished") return "released";
  if (PENDING.has(status)) return "pending";
  if (NOT_RELEASED.has(status)) return "not-released";
  return "unknown"; // a status we have never seen: treated like not-released, but reported
}

/**
 * Turns Coolify deployment records (any order, any page window) into releases.
 * - A release = the FIRST finished deployment of a commit SHA (a manual redeploy of the same SHA is not a second release).
 * - Only releases that finished at/after `trackFrom` are returned (no backfill); `previousSha` still looks further back.
 * - failed / cancelled / skipped / unknown / queued / in_progress produce NO release, only a report line.
 * `windowComplete` = false means older history may exist that was not fetched (the oldest release's previousSha is then unreliable).
 */
export function planReleases(deployments, { trackFrom, windowComplete = true }) {
  const from = Date.parse(trackFrom);
  if (Number.isNaN(from)) throw new Error("trackFrom must be an ISO-8601 date");

  const rows = deployments.map((d) => ({
    sha: d.commit,
    status: d.status,
    uuid: d.deployment_uuid,
    manual: !d.is_webhook,
    finishedAt: d.finished_at ? Date.parse(d.finished_at) : null,
    createdAt: d.created_at ? Date.parse(d.created_at) : null,
  }));

  const finished = rows
    .filter((r) => classifyStatus(r.status) === "released" && r.finishedAt !== null)
    .sort((a, b) => a.finishedAt - b.finishedAt);

  const firstFinishPerSha = new Map();
  for (const r of finished) if (!firstFinishPerSha.has(r.sha)) firstFinishPerSha.set(r.sha, r);
  const ordered = [...firstFinishPerSha.values()];

  const releases = [];
  ordered.forEach((r, i) => {
    if (r.finishedAt < from) return;
    const previous = i > 0 ? ordered[i - 1] : null;
    releases.push({
      sha: r.sha,
      finishedAt: new Date(r.finishedAt).toISOString(),
      deploymentUuid: r.uuid,
      manual: r.manual,
      previousSha: previous ? previous.sha : null,
      previousUnreliable: !previous && !windowComplete,
    });
  });

  const since = (r) => (r.finishedAt ?? r.createdAt ?? 0) >= from;
  const pending = rows.filter((r) => classifyStatus(r.status) === "pending").map((r) => ({ sha: r.sha, status: r.status }));
  const notReleased = rows
    .filter((r) => ["not-released", "unknown"].includes(classifyStatus(r.status)) && since(r))
    .map((r) => ({ sha: r.sha, status: r.status, known: classifyStatus(r.status) !== "unknown" }));

  return { releases, pending, notReleased };
}

/** Jira keys of the allowed projects found in free text (commit subjects, bodies, branch names). Sorted, unique, upper-case. */
export function extractJiraKeys(texts, projectKeys = ["CC"]) {
  const alternation = projectKeys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const re = new RegExp(`(?<![A-Za-z0-9])(${alternation})-(\\d+)(?![A-Za-z0-9])`, "gi");
  const found = new Map();
  for (const text of texts) {
    for (const m of String(text).matchAll(re)) {
      const key = `${m[1].toUpperCase()}-${Number(m[2])}`;
      found.set(key, [m[1].toUpperCase(), Number(m[2])]);
    }
  }
  return [...found.entries()]
    .sort((a, b) => a[1][0].localeCompare(b[1][0]) || a[1][1] - b[1][1])
    .map(([key]) => key);
}

/** One release of one app has exactly one marker; a ticket that already carries it is never commented twice. */
export function buildMarker(appId, sha) {
  return `release-tracker:v1 app=${appId} sha=${sha}`;
}

/** Works on an ADF object or a plain string: the marker text is stored verbatim in the comment. */
export function commentHasMarker(commentBody, marker) {
  const text = typeof commentBody === "string" ? commentBody : JSON.stringify(commentBody ?? "");
  return text.includes(marker);
}

export function formatIst(iso) {
  const stamp = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  return `${stamp} IST`;
}

const text = (value, marks) => (marks ? { type: "text", text: value, marks } : { type: "text", text: value });
const code = (value) => text(value, [{ type: "code" }]);
const link = (value, href) => text(value, [{ type: "link", attrs: { href } }]);
const strong = (value) => text(value, [{ type: "strong" }]);
const paragraph = (...content) => ({ type: "paragraph", content });

/** Jira comment body (Atlassian Document Format) for one ticket in one release. */
export function buildReleaseComment({ app, environment, sha, previousSha, finishedAt, commits, repoUrl, sentryUrl, marker }) {
  const content = [
    paragraph(strong(`Released to ${environment}: ${app.label}`)),
    paragraph(text(`Deployment finished ${formatIst(finishedAt)} · release `), link(sha.slice(0, 7), `${repoUrl}/commit/${sha}`), text(` (${sha})`)),
  ];
  // ADF rejects an empty bulletList, so the list is only added when there is something in it.
  if (commits.length) {
    content.push(paragraph(text("Commits in this release linked to this ticket:")));
    content.push({
      type: "bulletList",
      content: commits.map((c) => ({
        type: "listItem",
        content: [paragraph(link(c.sha.slice(0, 7), `${repoUrl}/commit/${c.sha}`), text(` ${c.subject}`))],
      })),
    });
  }
  if (previousSha) content.push(paragraph(link("All changes since the previous release", `${repoUrl}/compare/${previousSha}...${sha}`)));
  if (sentryUrl) content.push(paragraph(link("Sentry release", sentryUrl)));
  content.push(paragraph(text(marker)));
  return { type: "doc", version: 1, content };
}
