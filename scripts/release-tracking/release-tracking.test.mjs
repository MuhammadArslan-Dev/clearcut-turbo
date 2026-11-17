// Run: node --test scripts/release-tracking/
// Fixtures are REAL Coolify records read on 2026-11-17 (SHAs, statuses, flags); finished times of a few are rounded to the minute.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { classifyStatus, planReleases, extractJiraKeys, buildMarker, commentHasMarker, buildReleaseComment } from "./lib.mjs";
import { normalizeBase, loadCredentials, fetchDeployments } from "./coolify.mjs";
import { commitExists, commitsInRange } from "./git.mjs";
import { APPS } from "./config.mjs";

const REPO = fileURLToPath(new URL("../../", import.meta.url));
const dep = (commit, status, finished, o = {}) => ({
  commit,
  status,
  finished_at: finished,
  created_at: o.created ?? finished,
  is_webhook: o.webhook ?? true,
  deployment_uuid: o.uuid ?? `d-${commit.slice(0, 7)}-${finished}`,
});

// real backend history: 855b653 was deployed twice (webhook, then a manual redeploy)
const EE8 = "ee8d62f493fd855269324bc78d28d210138db140";
const S855 = "855b653e053a35517419cbedc3bda5d66d2a913e";
const A4A9 = "4a9c8f2a01958c87b3634eb7d8d3973417fd0288";
const backend = [
  dep(A4A9, "finished", "2026-11-12T15:19:35.000Z"),
  dep(S855, "finished", "2026-11-12T05:52:00.000Z", { webhook: false, uuid: "vpto4gjh6iv4zlwfkjzuzbhh" }),
  dep(S855, "finished", "2026-11-12T05:42:34.000Z", { uuid: "mxez4jmkpvlmswk0fmkuniia" }),
  dep(EE8, "finished", "2026-11-11T09:00:22.000Z"),
];

// real landing failures
const FAILED1 = "9ef05c1b1a26ae73c17bf3c46f1b0d4e3b13826a";
const OKBEFORE = "5d4c56d1f0043389a79b087511431b901ffb475b";
const OKAFTER = "add1762af36a081508891376a4e7e8964477afa7";

test("classifyStatus: every Coolify status value", () => {
  assert.equal(classifyStatus("finished"), "released");
  assert.equal(classifyStatus("queued"), "pending");
  assert.equal(classifyStatus("in_progress"), "pending");
  for (const s of ["failed", "cancelled-by-user", "skipped"]) assert.equal(classifyStatus(s), "not-released");
  assert.equal(classifyStatus("something-new"), "unknown");
});

test("a commit deployed twice is ONE release, stamped with its first finish", () => {
  const { releases } = planReleases(backend, { trackFrom: "2026-11-01T00:00:00Z" });
  assert.deepEqual(releases.map((r) => r.sha), [EE8, S855, A4A9]);
  const r = releases.find((x) => x.sha === S855);
  assert.equal(r.finishedAt, "2026-11-12T05:42:34.000Z");
  assert.equal(r.previousSha, EE8);
});

test("no backfill: older releases are not returned but still serve as previousSha", () => {
  const { releases } = planReleases(backend, { trackFrom: "2026-11-12T00:00:00Z" });
  assert.deepEqual(releases.map((r) => r.sha), [S855, A4A9]);
  assert.equal(releases[0].previousSha, EE8);
});

test("failed deployment creates no release and is not used as the previous release", () => {
  const landing = [
    dep(OKAFTER, "finished", "2026-11-12T17:38:00.000Z"),
    dep(FAILED1, "failed", "2026-11-12T05:47:24.000Z"),
    dep(OKBEFORE, "finished", "2026-11-12T05:30:00.000Z"),
  ];
  const plan = planReleases(landing, { trackFrom: "2026-11-12T00:00:00Z" });
  assert.deepEqual(plan.releases.map((r) => r.sha), [OKBEFORE, OKAFTER]);
  assert.equal(plan.releases[1].previousSha, OKBEFORE);
  assert.deepEqual(plan.notReleased, [{ sha: FAILED1, status: "failed", known: true }]);
});

test("queued / in_progress produce no release yet, only a waiting line", () => {
  const plan = planReleases([dep(S855, "in_progress", null), dep(A4A9, "queued", null)], { trackFrom: "2026-11-01T00:00:00Z" });
  assert.equal(plan.releases.length, 0);
  assert.equal(plan.pending.length, 2);
});

test("a deployment that finished but has no finished_at is never released", () => {
  assert.equal(planReleases([dep(S855, "finished", null)], { trackFrom: "2026-11-01T00:00:00Z" }).releases.length, 0);
});

test("unknown future status is reported, not released", () => {
  const plan = planReleases([dep(S855, "weird", "2026-11-12T05:42:34.000Z")], { trackFrom: "2026-11-01T00:00:00Z" });
  assert.equal(plan.releases.length, 0);
  assert.equal(plan.notReleased[0].known, false);
});

test("incomplete history window flags the oldest release's previousSha as unreliable", () => {
  const plan = planReleases(backend, { trackFrom: "2026-11-01T00:00:00Z", windowComplete: false });
  assert.equal(plan.releases[0].previousUnreliable, true);
  assert.equal(plan.releases[1].previousUnreliable, false);
});

test("trackFrom must be a date", () => {
  assert.throws(() => planReleases(backend, { trackFrom: "not-a-date" }), /ISO-8601/);
});

test("extractJiraKeys: real subjects", () => {
  assert.deepEqual(extractJiraKeys(["Merge fix/cc-190-daily-test-null-id: daily test ids null/undefined in the URL no longer call the API (CC-190)"]), ["CC-190"]);
  assert.deepEqual(extractJiraKeys(["Merge Phase 27 (CC-71, CC-59, CC-49): one order per attempt; paid orders always activate"]), ["CC-49", "CC-59", "CC-71"]);
  assert.deepEqual(extractJiraKeys(["Phase 116: MCQ options layout follows the option text length (dashboard + blog)"]), []);
});

test("extractJiraKeys: false positives, duplicates, other projects", () => {
  assert.deepEqual(extractJiraKeys(["ABCC-12 xcc-5 CC-007x CC- CC-"]), []);
  assert.deepEqual(extractJiraKeys(["cc-12 and CC-12 and fix/cc-12-x"]), ["CC-12"]);
  assert.deepEqual(extractJiraKeys(["CC-007"]), ["CC-7"]);
  assert.deepEqual(extractJiraKeys(["DEV-5"]), []);
  assert.deepEqual(extractJiraKeys(["DEV-5 CC-2"], ["CC", "DEV"]), ["CC-2", "DEV-5"]);
  assert.deepEqual(extractJiraKeys([]), []);
});

test("Jira comment carries the marker; the marker is per app AND per SHA (retries never duplicate)", () => {
  const app = APPS.find((a) => a.id === "dashboard");
  const marker = buildMarker(app.id, S855);
  const body = buildReleaseComment({
    app,
    environment: "production",
    sha: S855,
    previousSha: EE8,
    finishedAt: "2026-11-12T05:42:34.000Z",
    commits: [{ sha: S855, subject: "Target gauge card: weekly meter trend" }],
    repoUrl: "https://github.com/MuhammadArslan-Dev/clearcut-turbo",
    sentryUrl: "https://clear-cutoff.sentry.io/releases/" + S855 + "/",
    marker,
  });
  assert.equal(body.type, "doc");
  assert.equal(body.version, 1);
  assert.ok(commentHasMarker(body, marker));
  assert.ok(!commentHasMarker(body, buildMarker("dashboard", A4A9)), "other SHA is not a duplicate");
  assert.ok(!commentHasMarker(body, buildMarker("blog", S855)), "other app is not a duplicate");
  assert.ok(commentHasMarker("text before " + marker + " text after", marker));
  assert.ok(!commentHasMarker(undefined, marker));
  assert.match(JSON.stringify(body), /12 Nov 2026, 11:12 IST/, "05:42 UTC is 11:12 IST");
});

test("normalizeBase strips /mcp and /api/v1 and trailing slashes", () => {
  assert.equal(normalizeBase("http://140.245.112.235:8000/mcp"), "http://140.245.112.235:8000");
  assert.equal(normalizeBase("https://c.example.com/api/v1/"), "https://c.example.com");
  assert.equal(normalizeBase(" https://c.example.com "), "https://c.example.com");
});

test("loadCredentials: placeholders and missing values mean 'no credentials', never a call", () => {
  const dir = mkdtempSync(join(tmpdir(), "rt-"));
  const file = join(dir, "coolify-token");
  writeFileSync(file, "# c\nORACLE_COOLIFY_URL=http://x:8000/mcp\nORACLE_COOLIFY_TOKEN=REPLACE_ME_TOKEN\nHETZNER_COOLIFY_URL=https://h\nHETZNER_COOLIFY_TOKEN=abc\n");
  assert.equal(loadCredentials("oracle", { env: {}, file }), null);
  assert.deepEqual(loadCredentials("hetzner", { env: {}, file }), { baseUrl: "https://h", token: "abc" });
  assert.deepEqual(loadCredentials("oracle", { env: { ORACLE_COOLIFY_TOKEN: "real" }, file }), { baseUrl: "http://x:8000", token: "real" });
  assert.equal(loadCredentials("hetzner", { env: {}, file: join(dir, "missing") }), null);
});

const json = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });

test("fetchDeployments pages with skip/take until the whole history is read", async () => {
  const calls = [];
  const all = [1, 2, 3, 4, 5].map((n) => ({ commit: String(n) }));
  const fetchImpl = async (url) => {
    calls.push(url);
    const skip = Number(new URL(url).searchParams.get("skip"));
    return json({ count: 5, deployments: all.slice(skip, skip + 2) });
  };
  const r = await fetchDeployments({ baseUrl: "http://c", token: "t", uuid: "u", take: 2, fetchImpl });
  assert.equal(r.deployments.length, 5);
  assert.equal(r.complete, true);
  assert.deepEqual(calls.map((u) => new URL(u).searchParams.get("skip")), ["0", "2", "4"]);
});

test("fetchDeployments stops early when enough, and reports the window as incomplete", async () => {
  const fetchImpl = async () => json({ count: 100, deployments: [{ commit: "a" }, { commit: "b" }] });
  const r = await fetchDeployments({ baseUrl: "http://c", token: "t", uuid: "u", take: 2, enough: () => true, fetchImpl });
  assert.equal(r.complete, false);
});

test("fetchDeployments retries a 503 and succeeds; the Coolify outage case", async () => {
  let n = 0;
  const fetchImpl = async () => (++n < 3 ? json({}, 503) : json({ count: 1, deployments: [{ commit: "a" }] }));
  const r = await fetchDeployments({ baseUrl: "http://c", token: "t", uuid: "u", fetchImpl, backoffMs: 1 });
  assert.equal(n, 3);
  assert.equal(r.deployments.length, 1);
});

test("fetchDeployments gives up after the retry budget on a persistent 503", async () => {
  let n = 0;
  const fetchImpl = async () => (n++, json({}, 503));
  await assert.rejects(fetchDeployments({ baseUrl: "http://c", token: "t", uuid: "u", fetchImpl, backoffMs: 1 }), /HTTP 503/);
  assert.equal(n, 3, "1 try + 2 retries");
});

test("a 401 is never retried and the token never appears in the error", async () => {
  let n = 0;
  const secret = "9|SUPERSECRETTOKEN";
  const fetchImpl = async () => (n++, json({ message: "Unauthenticated." }, 401));
  await assert.rejects(fetchDeployments({ baseUrl: "http://c", token: secret, uuid: "u", fetchImpl, backoffMs: 1 }), (e) => {
    assert.ok(!e.message.includes(secret));
    assert.match(e.message, /HTTP 401/);
    return true;
  });
  assert.equal(n, 1);
});

test("a network error is retried, then reported without the token", async () => {
  let n = 0;
  const secret = "9|SUPERSECRETTOKEN";
  const fetchImpl = async () => {
    n++;
    throw new TypeError("fetch failed");
  };
  await assert.rejects(fetchDeployments({ baseUrl: "http://c", token: secret, uuid: "u", fetchImpl, backoffMs: 1 }), (e) => !e.message.includes(secret));
  assert.equal(n, 3);
});

// ---- git: real history of this repo (skipped on a shallow clone that lacks these commits)
const full = (short) => {
  try {
    return execFileSync("git", ["rev-parse", "--verify", `${short}^{commit}`], { cwd: REPO, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
};
const dash = APPS.find((a) => a.id === "dashboard");
const [P8D6, P6AC, P0E2, P640] = ["8d604a9", "6ac34b4", "0e29d26", "64094e7"].map(full);
const haveHistory = [P8D6, P6AC, P0E2, P640].every(Boolean) && [P8D6, P6AC, P0E2, P640].every((s) => commitExists(s, REPO));

test("real range 8d604a9..6ac34b4 (dashboard paths) finds CC-190", { skip: !haveHistory }, () => {
  const commits = commitsInRange({ previousSha: P8D6, sha: P6AC, paths: dash.paths, cwd: REPO });
  assert.equal(commits.length, 2);
  assert.deepEqual(extractJiraKeys(commits.flatMap((c) => [c.subject, c.body])), ["CC-190"]);
});

test("real range 0e29d26..64094e7 has commits but no Jira key -> nothing to comment", { skip: !haveHistory }, () => {
  const commits = commitsInRange({ previousSha: P0E2, sha: P640, paths: dash.paths, cwd: REPO });
  assert.ok(commits.length > 0);
  assert.deepEqual(extractJiraKeys(commits.flatMap((c) => [c.subject, c.body])), []);
});

test("first release (no previous) lists exactly its own commit", { skip: !haveHistory }, () => {
  const commits = commitsInRange({ previousSha: null, sha: P6AC, paths: dash.paths, cwd: REPO });
  assert.equal(commits.length, 1);
  assert.equal(commits[0].sha, P6AC);
});

test("commitExists is false for an unknown SHA", () => {
  assert.equal(commitExists("0".repeat(40), REPO), false);
});
