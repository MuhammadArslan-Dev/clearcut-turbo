// Commits of a repo that is not checked out here (the backend), via GitHub's "compare two commits" REST API:
// GET /repos/{owner}/{repo}/compare/{base}...{head}?per_page=100&page=N (docs: capped at 250 commits without paging,
// per_page max 100, commits come oldest first). Without a previous release: GET /repos/{owner}/{repo}/commits/{sha}.
import { requestJson } from "./http.mjs";

const toCommit = (c) => {
  const [subject, ...rest] = String(c.commit?.message ?? "").split("\n");
  return { sha: c.sha, subject, body: rest.join("\n").trim() };
};

export async function commitsInRangeGithub({ repo, previousSha, sha, token, fetchImpl, backoffMs }) {
  const headers = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const get = (path) => requestJson(`https://api.github.com/repos/${repo}${path}`, { headers, retries: 2, fetchImpl, backoffMs });

  if (!previousSha) return [toCommit(await get(`/commits/${sha}`))];

  const commits = [];
  for (let page = 1; page <= 10; page++) {
    const data = await get(`/compare/${previousSha}...${sha}?per_page=100&page=${page}`);
    const batch = data?.commits ?? [];
    commits.push(...batch.map(toCommit));
    if (batch.length < 100 || commits.length >= (data.total_commits ?? commits.length)) break;
  }
  return commits.reverse(); // newest first, like `git log`
}
