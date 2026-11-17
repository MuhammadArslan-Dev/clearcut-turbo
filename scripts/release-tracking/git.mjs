// Git access for the monorepo apps (phase 117). Read-only `git log`; nothing is fetched or changed.
import { execFileSync } from "node:child_process";

const SEP = "\u001f";
const END = "\u001e";

export function commitExists(sha, cwd) {
  try {
    execFileSync("git", ["cat-file", "-e", `${sha}^{commit}`], { cwd, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Commits released by `sha`: everything since `previousSha` (or just `sha` itself when there is no previous release),
 * limited to `paths`. --full-history keeps merge commits, whose subject carries the branch name and Jira key.
 */
export function commitsInRange({ previousSha, sha, paths, cwd }) {
  const args = ["log", "--full-history", `--format=%H${SEP}%s${SEP}%b${END}`];
  if (previousSha) args.push(`${previousSha}..${sha}`);
  else args.push("-1", sha);
  if (paths && paths.length) args.push("--", ...paths);
  const out = execFileSync("git", args, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return out
    .split(END)
    .map((chunk) => chunk.replace(/^\n/, ""))
    .filter(Boolean)
    .map((chunk) => {
      const [sha, subject, body] = chunk.split(SEP);
      return { sha, subject, body: (body ?? "").trim() };
    });
}
