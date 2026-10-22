import { describe, expect, it } from "vitest";
import robots, { AI_TRAINING_BOTS } from "./robots";

describe("robots.txt", () => {
  const { rules } = robots();
  const list = Array.isArray(rules) ? rules : [rules];

  it("keeps search engines and AI search bots allowed", () => {
    const all = list.find((r) => r.userAgent === "*");
    expect(all?.allow).toBe("/");
    for (const bot of ["Googlebot", "Bingbot", "PerplexityBot", "OAI-SearchBot", "ChatGPT-User", "Applebot"]) {
      expect(AI_TRAINING_BOTS).not.toContain(bot);
    }
  });

  it("blocks AI training crawlers from the whole site", () => {
    const blocked = list.find((r) => Array.isArray(r.userAgent));
    expect(blocked?.userAgent).toEqual(AI_TRAINING_BOTS);
    expect(blocked?.disallow).toBe("/");
    expect(AI_TRAINING_BOTS).toEqual(expect.arrayContaining(["ClaudeBot", "GPTBot", "meta-externalagent", "Amazonbot"]));
  });
});
