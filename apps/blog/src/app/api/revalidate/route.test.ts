import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isAuthorized, QUESTION_PAGE_PATTERNS, revalidationTargets } from "@/lib/question-bank/revalidate";

const cacheCalls = vi.hoisted(() => ({ tags: [] as unknown[][], paths: [] as unknown[][] }));
vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => cacheCalls.tags.push(args),
  revalidatePath: (...args: unknown[]) => cacheCalls.paths.push(args),
}));
const forgotten = vi.hoisted(() => ({ examIndex: [] as unknown[], search: [] as unknown[] }));
vi.mock("@/lib/seo/load-exam-index", () => ({ forgetExamIndex: (e: unknown) => forgotten.examIndex.push(e) }));
vi.mock("@/lib/question-bank/search-index", () => ({ forgetSearchIndex: (e: unknown) => forgotten.search.push(e) }));
// The route's secret comes from blog-server-key.ts (in-code value, env
// override); tests drive it through the env only.
vi.mock("@/lib/api/blog-server-key", () => ({ revalidateSecret: () => process.env.REVALIDATE_SECRET ?? "" }));

const { POST } = await import("./route");

const SECRET = "s".repeat(40);
const post = (body: string | undefined, auth?: string) =>
  POST(
    new Request("https://blog.test/api/revalidate", {
      method: "POST",
      headers: auth ? { Authorization: auth } : {},
      body,
    }),
  );

beforeEach(() => {
  cacheCalls.tags = [];
  cacheCalls.paths = [];
  forgotten.examIndex = [];
  forgotten.search = [];
  process.env.REVALIDATE_SECRET = SECRET;
});
afterEach(() => {
  delete process.env.REVALIDATE_SECRET;
});

describe("isAuthorized", () => {
  it("accepts only the exact Bearer secret", () => {
    expect(isAuthorized(`Bearer ${SECRET}`, SECRET)).toBe(true);
    expect(isAuthorized(`Bearer ${SECRET}x`, SECRET)).toBe(false);
    expect(isAuthorized(SECRET, SECRET)).toBe(false);
    expect(isAuthorized(null, SECRET)).toBe(false);
  });

  it("refuses everything when the secret is unset or too short", () => {
    expect(isAuthorized("Bearer short", "short")).toBe(false);
    expect(isAuthorized("Bearer ", undefined)).toBe(false);
  });
});

describe("revalidationTargets", () => {
  it("expires everything when no exams are named", () => {
    expect(revalidationTargets({})).toEqual({ exams: ["ctet", "htet"], tags: ["qb"], all: true });
    expect(revalidationTargets({ exams: [] })).toEqual({ exams: ["ctet", "htet"], tags: ["qb"], all: true });
  });

  it("expires only the named exams this app serves", () => {
    expect(revalidationTargets({ exams: ["CTET", "mahatet", "ctet"] })).toEqual({
      exams: ["ctet"],
      tags: ["qb:ctet"],
      all: false,
    });
  });

  it("rejects malformed bodies", () => {
    for (const body of [null, [], "ctet", { exams: "ctet" }, { exams: [1] }, { exams: Array(51).fill("ctet") }]) {
      expect(revalidationTargets(body)).toBeNull();
    }
  });
});

describe("POST /api/revalidate", () => {
  it("is closed when REVALIDATE_SECRET is not configured", async () => {
    delete process.env.REVALIDATE_SECRET;
    expect((await post("{}", "Bearer anything")).status).toBe(503);
    expect(cacheCalls.tags).toEqual([]);
  });

  it("rejects a missing or wrong secret without touching the cache", async () => {
    expect((await post("{}")).status).toBe(401);
    expect((await post("{}", "Bearer wrong")).status).toBe(401);
    expect(cacheCalls.tags).toEqual([]);
    expect(cacheCalls.paths).toEqual([]);
  });

  it("rejects malformed JSON", async () => {
    expect((await post("{", `Bearer ${SECRET}`)).status).toBe(400);
    expect((await post('{"exams":"ctet"}', `Bearer ${SECRET}`)).status).toBe(400);
    expect(cacheCalls.tags).toEqual([]);
  });

  it("expires one exam's tags, the question pages and that exam's memos", async () => {
    const res = await post('{"exams":["ctet"]}', `Bearer ${SECRET}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, exams: ["ctet"], tags: ["qb:ctet"] });
    expect(cacheCalls.tags).toEqual([["qb:ctet", { expire: 0 }]]);
    expect(cacheCalls.paths).toEqual(QUESTION_PAGE_PATTERNS.map((p) => [p, "page"]));
    expect(forgotten.examIndex).toEqual([["ctet"]]);
    expect(forgotten.search).toEqual([["ctet"]]);
  });

  it("expires everything for an empty body", async () => {
    expect((await post(undefined, `Bearer ${SECRET}`)).status).toBe(200);
    expect(cacheCalls.tags).toEqual([["qb", { expire: 0 }]]);
    expect(forgotten.examIndex).toEqual([undefined]);
  });

  it("does nothing (but succeeds) for exams this app doesn't serve", async () => {
    const res = await post('{"exams":["mahatet"]}', `Bearer ${SECRET}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ exams: [] });
    expect(cacheCalls.tags).toEqual([]);
    expect(cacheCalls.paths).toEqual([]);
  });
});
