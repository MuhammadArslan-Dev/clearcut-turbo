import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

type Redirect = { source: string; destination: string; statusCode?: number; permanent?: boolean };

// Mirrors how Next matches a redirect `source` closely enough for the
// patterns used here: `:name(regex)` groups and plain path segments.
function match(redirects: Redirect[], path: string): Redirect & { to: string } {
  for (const r of redirects) {
    const names: string[] = [];
    const pattern = r.source.replace(/:(\w+)\(([^)]+)\)|:(\w+)\*|:(\w+)/g, (_m, n1, re, n2, n3) => {
      names.push(n1 ?? n2 ?? n3);
      if (n1) return `(${re})`;
      if (n2) return "(.*)";
      return "([^/]+)";
    });
    const m = new RegExp(`^${pattern}$`).exec(path);
    if (!m) continue;
    let to = r.destination;
    names.forEach((n, i) => (to = to.replace(`:${n}`, m[i + 1] ?? "")));
    return { ...r, to };
  }
  throw new Error(`no redirect for ${path}`);
}

const redirects = (await nextConfig.redirects?.()) as Redirect[];

describe("landing redirects", () => {
  it("sends /resize-image to the Tools resizer with a 301, per locale", () => {
    expect(match(redirects, "/resize-image")).toMatchObject({ to: "/tools/resizer", statusCode: 301 });
    expect(match(redirects, "/hi/resize-image")).toMatchObject({ to: "/hi/tools/resizer", statusCode: 301 });
    expect(match(redirects, "/mr/resize-image")).toMatchObject({ to: "/mr/tools/resizer", statusCode: 301 });
  });

  it("sends a bare exam code to its single /exam/<code>-preparation page", () => {
    expect(match(redirects, "/exam/htet")).toMatchObject({ to: "/exam/htet-preparation", statusCode: 301 });
    expect(match(redirects, "/hi/exam/uppgt")).toMatchObject({ to: "/hi/exam/uppgt-preparation", statusCode: 301 });
    expect(() => match(redirects, "/exam/htet-preparation")).toThrow();
  });
});
