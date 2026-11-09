import { afterEach, describe, expect, it, vi } from "vitest";
import { metaContentParams } from "./payment";

describe("metaContentParams (CC-173)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("sends nothing while the switch is off (the default)", () => {
    expect(metaContentParams({ content_category: "HTET", content_ids: ["3"] })).toEqual({});
  });

  it("passes the exam through when the switch is on and the backend sent it", () => {
    vi.stubEnv("NEXT_PUBLIC_META_CONTENT_PARAMS", "true");
    expect(metaContentParams({ content_category: "HTET", content_ids: ["3"] })).toEqual({
      content_category: "HTET",
      content_ids: ["3"],
    });
  });

  it("adds nothing for an older backend or an unknown exam", () => {
    vi.stubEnv("NEXT_PUBLIC_META_CONTENT_PARAMS", "true");
    expect(metaContentParams({})).toEqual({});
    expect(metaContentParams({ content_category: "", content_ids: [] })).toEqual({});
  });
});
