// Run: node --test scripts/release-tracking/track.test.mjs
// The Jira / Sentry / GitHub services are SIMULATED here (fake fetch / fake sentry-cli runner) because the real tokens are
// not available yet; real-service validation is listed in docs/phases/117-release-tracking.md §8 as NOT verified.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createJiraClient } from "./jira.mjs";
import { createSentryClient, syncSentry } from "./sentry.mjs";
import { commitsInRangeGithub } from "./github.mjs";
import { processRelease, hasFailure } from "./track.mjs";
import { buildMarker, buildReleaseComment } from "./lib.mjs";
import { APPS } from "./config.mjs";

const app = APPS.find((a) => a.id === "dashboard");
const SHA = "6ac34b4ebdffb9d16fd3a73421016ef25b3a036a";
const PREV = "8d604a99d8be9a10b040c7a87d7a8664ae1a42c0";
const release = { sha: SHA, previousSha: PREV, finishedAt: "2026-11-16T09:41:40.000Z" };
const commits = [
  { sha: SHA, subject: "Merge fix/cc-190-daily-test-null-id: daily test ids (CC-190)", body: "" },
  { sha: "43d84c0".padEnd(40, "0"), subject: "CC-190: daily test ids that are null no longer call the API", body: "" },
];
const FINISHED_UNIX = Math.floor(Date.parse(release.finishedAt) / 1000);
const res = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });

// ---------------- fake Jira (in-memory, behaves like the real comment collection)
function fakeJira({ issues = ["CC-190"], preExisting = {}, failAdd = false, down = false } = {}) {
  const comments = { ...preExisting };
  const calls = [];
  const fetchImpl = async (url, opts = {}) => {
    const u = new URL(url);
    const m = u.pathname.match(/\/rest\/api\/3\/issue\/([^/]+)(\/comment)?$/);
    const method = opts.method ?? "GET";
    calls.push(`${method} ${u.pathname}`);
    if (down) return res({}, 503);
    const key = m[1];
    if (!issues.includes(key)) return res({ errorMessages: ["Issue does not exist"] }, 404);
    if (!m[2]) return res({ key, fields: { summary: "x" } });
    if (method === "POST") {
      if (failAdd) return res({}, 500);
      (comments[key] ??= []).push({ body: JSON.parse(opts.body).body });
      return res({ id: "1" }, 201);
    }
    const list = comments[key] ?? [];
    return res({ comments: list, total: list.length, startAt: 0, maxResults: 100 });
  };
  return { client: createJiraClient({ baseUrl: "https://x.atlassian.net", email: "bot@x", token: "TOK", fetchImpl, backoffMs: 1 }), comments, calls };
}

// ---------------- fake Sentry (REST state + CLI runner that mutates the state, like the real service)
function fakeSentry({ existing = null, apiDown = false, cliFails = null } = {}) {
  const state = { release: existing && { projects: [{ slug: app.sentryProject }], commitCount: 0, deployCount: 0, lastDeploy: null, dateReleased: null, ...existing } };
  const cliCalls = [];
  const runCli = (argv) => {
    cliCalls.push(argv.join(" "));
    if (cliFails && argv.join(" ").includes(cliFails)) throw new Error("sentry-cli failed");
    const [a, b] = argv;
    if (a === "releases" && b === "new") state.release = { projects: [{ slug: argv[argv.indexOf("-p") + 1] }], commitCount: 0, deployCount: 0, lastDeploy: null, dateReleased: null };
    if (a === "releases" && b === "set-commits") state.release.commitCount = 2;
    if (a === "deploys") {
      state.release.deployCount++;
      state.release.lastDeploy = { environment: argv[argv.indexOf("-e") + 1], name: argv[argv.indexOf("-n") + 1] };
    }
    if (a === "releases" && b === "finalize") state.release.dateReleased = "2026-11-16T09:41:40Z";
  };
  const fetchImpl = async () => (apiDown ? res({}, 503) : state.release ? res(state.release) : res({ detail: "not found" }, 404));
  return { client: createSentryClient({ baseUrl: "https://de.sentry.io", org: "clear-cutoff", token: "SENTRYTOK", fetchImpl, backoffMs: 1, runCli }), state, cliCalls };
}

const run = (over = {}) => processRelease({ app, release, commits, environment: "production", jiraProjectKeys: ["CC"], sentryWebUrl: "https://clear-cutoff.sentry.io", ...over });

test("first run comments the ticket once and fully records the Sentry release", async () => {
  const j = fakeJira();
  const s = fakeSentry();
  const out = await run({ jira: j.client, sentry: s.client });
  assert.deepEqual(out.jira.commented, ["CC-190"]);
  assert.deepEqual(out.sentry.did, ["release created", "commits set", "deploy production created", "finalized"]);
  assert.equal(hasFailure(out), false);
  assert.equal(j.comments["CC-190"].length, 1);
  assert.match(s.cliCalls.find((c) => c.includes("set-commits")), new RegExp(`--commit MuhammadArslan-Dev/clearcut-turbo@${PREV}\\.\\.${SHA}`));
  assert.match(s.cliCalls.find((c) => c.startsWith("deploys")), new RegExp(`-r 6ac34b4.* -e production -n dashboard .*--finished ${FINISHED_UNIX}`));
});

test("RETRY: running the same release again creates NO second Jira comment and NO second Sentry record", async () => {
  const j = fakeJira();
  const s = fakeSentry();
  await run({ jira: j.client, sentry: s.client });
  const callsAfterFirst = s.cliCalls.length;
  const again = await run({ jira: j.client, sentry: s.client });
  assert.deepEqual(again.jira.commented, []);
  assert.equal(again.jira.skipped[0].reason, "already commented (marker found)");
  assert.deepEqual(again.sentry.did, []);
  assert.equal(s.cliCalls.length, callsAfterFirst, "no sentry-cli write on the second run");
  assert.equal(j.comments["CC-190"].length, 1);
});

test("a release the frontend build already created is reused, not recreated", async () => {
  const s = fakeSentry({ existing: {} });
  const out = await run({ sentry: s.client });
  assert.ok(!out.sentry.did.includes("release created"));
  assert.ok(!s.cliCalls.some((c) => c.startsWith("releases new")));
});

test("Sentry already has commits and a finalized release: only the missing deploy is added", async () => {
  const s = fakeSentry({ existing: { commitCount: 5, dateReleased: "2026-11-16T09:00:00Z" } });
  const out = await run({ sentry: s.client });
  assert.deepEqual(out.sentry.did, ["deploy production created"]);
});

test("a release that already has a production deploy never gets a second one", async () => {
  const s = fakeSentry({ existing: { deployCount: 1, lastDeploy: { environment: "production", name: "x" } } });
  const out = await run({ sentry: s.client });
  assert.ok(!s.cliCalls.some((c) => c.startsWith("deploys")));
  assert.ok(out.sentry.skipped.includes("deploy production already exists"));
});

test("deploys exist but the latest is another environment: skipped with a warning, never guessed", async () => {
  const s = fakeSentry({ existing: { deployCount: 1, lastDeploy: { environment: "staging", name: "x" } } });
  const out = await run({ sentry: s.client });
  assert.ok(!s.cliCalls.some((c) => c.startsWith("deploys")));
  assert.match(out.sentry.skipped.join("|"), /cannot prove no production duplicate/);
});

test("release exists in Sentry but not in this project: not touched, reported as an error", async () => {
  const s = fakeSentry({ existing: { projects: [{ slug: "some-other-project" }] } });
  const out = await run({ sentry: s.client });
  assert.match(out.sentry.error, /not in project clearcutoff-nextjs-app|not touching/);
  assert.equal(s.cliCalls.length, 0);
});

test("first release of an app has no previous commit: commits are skipped, the rest still happens", async () => {
  const s = fakeSentry();
  const out = await run({ sentry: s.client, release: { ...release, previousSha: null } });
  assert.match(out.sentry.skipped.join("|"), /no previous commit/);
  assert.ok(out.sentry.did.includes("deploy production created"));
});

test("MISSING JIRA KEYS: no ticket keys -> no Jira call at all; Sentry still recorded", async () => {
  const j = fakeJira();
  const s = fakeSentry();
  const out = await run({ jira: j.client, sentry: s.client, commits: [{ sha: SHA, subject: "Phase 116: MCQ options layout", body: "" }] });
  assert.equal(out.jira.notRun, "no ticket keys in this release");
  assert.equal(j.calls.length, 0);
  assert.ok(out.sentry.did.length > 0);
});

test("a key for a ticket that does not exist is skipped, the other ticket is still commented", async () => {
  const j = fakeJira({ issues: ["CC-190"] });
  const out = await run({ jira: j.client, commits: [...commits, { sha: "b".repeat(40), subject: "CC-999999: ghost", body: "" }] });
  assert.deepEqual(out.jira.commented, ["CC-190"]);
  assert.deepEqual(out.jira.skipped, [{ key: "CC-999999", reason: "ticket not found or not visible" }]);
});

test("INTEGRATION FAILURE: Jira down -> Sentry still runs, failure reported for retry", async () => {
  const j = fakeJira({ down: true });
  const s = fakeSentry();
  const out = await run({ jira: j.client, sentry: s.client });
  assert.equal(out.jira.failed.length, 1);
  assert.match(out.jira.failed[0].error, /HTTP 503/);
  assert.ok(out.sentry.did.includes("finalized"));
  assert.equal(hasFailure(out), true);
});

test("INTEGRATION FAILURE: Sentry down -> Jira still commented, error reported", async () => {
  const j = fakeJira();
  const s = fakeSentry({ apiDown: true });
  const out = await run({ jira: j.client, sentry: s.client });
  assert.deepEqual(out.jira.commented, ["CC-190"]);
  assert.match(out.sentry.error, /HTTP 503/);
});

test("INTEGRATION FAILURE: Jira write fails (500) -> not retried inside the run (no duplicate risk), no comment stored", async () => {
  const j = fakeJira({ failAdd: true });
  const out = await run({ jira: j.client });
  assert.equal(out.jira.failed.length, 1);
  assert.equal(j.calls.filter((c) => c.startsWith("POST")).length, 1, "exactly one POST attempt");
  assert.equal(j.comments["CC-190"], undefined);
});

test("partial Sentry failure (deploy step fails) leaves state that the next run completes without repeating done steps", async () => {
  const s = fakeSentry({ cliFails: "deploys new" });
  const first = await run({ sentry: s.client });
  assert.match(first.sentry.error, /sentry-cli failed/);
  assert.equal(s.state.release.commitCount, 2, "release + commits were written before the failure");
  const s2 = { ...s, client: createSentryClient({ baseUrl: "https://de.sentry.io", org: "clear-cutoff", token: "T", fetchImpl: async () => res(s.state.release), backoffMs: 1, runCli: (argv) => { s.cliCalls.push(argv.join(" ")); const [a, b] = argv; if (a === "deploys") { s.state.release.deployCount++; s.state.release.lastDeploy = { environment: "production" }; } if (b === "finalize") s.state.release.dateReleased = "x"; } }) };
  const before = s.cliCalls.length;
  const second = await run({ sentry: s2.client });
  assert.deepEqual(second.sentry.did, ["deploy production created", "finalized"]);
  assert.ok(!s.cliCalls.slice(before).some((c) => c.includes("releases new") || c.includes("set-commits")));
});

test("no credentials: both integrations report 'not run' and nothing throws", async () => {
  const out = await run({});
  assert.match(out.jira.notRun, /no Jira credentials/);
  assert.match(out.sentry.notRun, /no Sentry credentials/);
});

test("commits unavailable (backend without GitHub token): Jira is 'not run', Sentry still works", async () => {
  const s = fakeSentry();
  const out = await run({ jira: fakeJira().client, sentry: s.client, commits: null });
  assert.match(out.jira.notRun, /no GitHub token/);
  assert.ok(out.sentry.did.length > 0);
});

test("the Jira comment body is valid ADF: no empty list, marker present, links are https", () => {
  const marker = buildMarker(app.id, SHA);
  const body = buildReleaseComment({ app, environment: "production", sha: SHA, previousSha: PREV, finishedAt: release.finishedAt, commits, repoUrl: "https://github.com/MuhammadArslan-Dev/clearcut-turbo", sentryUrl: "https://clear-cutoff.sentry.io/releases/" + SHA + "/", marker });
  const nodes = JSON.stringify(body);
  assert.ok(nodes.includes(marker));
  for (const href of nodes.match(/"href":"[^"]+"/g)) assert.match(href, /"href":"https:\/\//);
  const noCommits = buildReleaseComment({ app, environment: "production", sha: SHA, previousSha: null, finishedAt: release.finishedAt, commits: [], repoUrl: "https://github.com/x/y", marker });
  assert.ok(!JSON.stringify(noCommits).includes("bulletList"), "an empty bulletList would be rejected by Jira");
});

test("Jira auth header is Basic base64(email:token) and the token is never in an error", async () => {
  let seen;
  const fetchImpl = async (url, opts) => ((seen = opts.headers.Authorization), res({}, 401));
  const jira = createJiraClient({ baseUrl: "https://x.atlassian.net", email: "bot@x.com", token: "SECRETTOKEN", fetchImpl });
  await assert.rejects(jira.listComments("CC-1"), (e) => !e.message.includes("SECRETTOKEN") && /HTTP 401/.test(e.message));
  assert.equal(seen, "Basic " + Buffer.from("bot@x.com:SECRETTOKEN").toString("base64"));
});

test("Jira comment pagination reads every page", async () => {
  const all = Array.from({ length: 250 }, (_, i) => ({ id: String(i), body: "x" }));
  const fetchImpl = async (url) => {
    const startAt = Number(new URL(url).searchParams.get("startAt"));
    return res({ comments: all.slice(startAt, startAt + 100), total: 250, startAt });
  };
  const jira = createJiraClient({ baseUrl: "https://x.atlassian.net", email: "a", token: "b", fetchImpl });
  assert.equal((await jira.listComments("CC-1")).length, 250);
});

test("sentry-cli argv: exact flags (verified against the installed 2.58.6 help)", async () => {
  const s = fakeSentry();
  await syncSentry({ client: s.client, app, release, environment: "production" });
  assert.deepEqual(s.cliCalls, [
    `releases new -p clearcutoff-nextjs-app ${SHA}`,
    `releases set-commits -p clearcutoff-nextjs-app ${SHA} --commit MuhammadArslan-Dev/clearcut-turbo@${PREV}..${SHA}`,
    `deploys new -r ${SHA} -e production -n dashboard -u https://app.clearcutoff.in --finished ${FINISHED_UNIX}`,
    `releases finalize ${SHA} --released ${FINISHED_UNIX}`,
  ]);
});

test("GitHub compare: pages through >100 commits, newest first; first release uses the single-commit endpoint", async () => {
  const mk = (n) => ({ sha: String(n).padStart(40, "0"), commit: { message: `subject ${n}\n\nbody ${n}` } });
  const all = Array.from({ length: 130 }, (_, i) => mk(i + 1));
  const urls = [];
  const fetchImpl = async (url) => {
    urls.push(url);
    const u = new URL(url);
    if (u.pathname.includes("/compare/")) {
      const page = Number(u.searchParams.get("page"));
      return res({ total_commits: 130, commits: all.slice((page - 1) * 100, page * 100) });
    }
    return res(mk(7));
  };
  const out = await commitsInRangeGithub({ repo: "o/r", previousSha: "a", sha: "b", token: "T", fetchImpl });
  assert.equal(out.length, 130);
  assert.equal(out[0].subject, "subject 130");
  assert.equal(out[0].body, "body 130");
  assert.equal(urls.length, 2);
  const single = await commitsInRangeGithub({ repo: "o/r", previousSha: null, sha: "b", fetchImpl });
  assert.equal(single.length, 1);
  assert.match(urls.at(-1), /\/commits\/b$/);
});
