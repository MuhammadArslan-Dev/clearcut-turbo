// Starts the blog deploy workflow, which rebuilds and redeploys the whole
// site with fresh content. Every page is prerendered at build time and never
// re-rendered inside the Worker (Workers Free plan, 10 ms CPU per request), so
// this is how a question sync reaches the pages (app/api/revalidate).
//
// Worker configuration (production only; staging leaves it unset):
//  - GITHUB_DEPLOY_TOKEN  secret: a fine-grained GitHub token limited to this
//    repository with "Actions: Read and write" — `npx wrangler secret put
//    GITHUB_DEPLOY_TOKEN`.
//  - GITHUB_DEPLOY_REPO / GITHUB_DEPLOY_WORKFLOW / GITHUB_DEPLOY_REF optional
//    overrides of the defaults below.
// The workflow's concurrency group collapses back-to-back syncs into one build.

const DEFAULT_REPO = "MuhammadArslan-Dev/clearcut-turbo";
const DEFAULT_WORKFLOW = "deploy-blog-cloudflare.yml";
const DEFAULT_REF = "main";

export type RebuildResult = { status: "started" | "not-configured" | "failed" };

export async function triggerRebuild(reason: string): Promise<RebuildResult> {
  const token = process.env.GITHUB_DEPLOY_TOKEN;
  if (!token) {
    console.error(`blog rebuild not configured (GITHUB_DEPLOY_TOKEN unset); skipped: ${reason}`);
    return { status: "not-configured" };
  }
  const repo = process.env.GITHUB_DEPLOY_REPO || DEFAULT_REPO;
  const workflow = process.env.GITHUB_DEPLOY_WORKFLOW || DEFAULT_WORKFLOW;
  const ref = process.env.GITHUB_DEPLOY_REF || DEFAULT_REF;

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/${workflow}/dispatches`, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "clearcut-blog",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ ref }),
    });
    if (res.status === 204) return { status: "started" };
    console.error(`blog rebuild dispatch failed: HTTP ${res.status} ${await res.text()}`);
  } catch (err) {
    console.error("blog rebuild dispatch failed:", err);
  }
  return { status: "failed" };
}
