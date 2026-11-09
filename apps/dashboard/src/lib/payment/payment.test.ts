import { describe, expect, it } from "vitest";
import { metaContentParams } from "./payment";

describe("metaContentParams (CC-173)", () => {
  it("passes the exam through when the backend sent it", () => {
    expect(metaContentParams({ content_category: "HTET", content_ids: ["3"] })).toEqual({
      content_category: "HTET",
      content_ids: ["3"],
    });
  });

  it("adds nothing for an older backend or an unknown exam", () => {
    expect(metaContentParams({})).toEqual({});
    expect(metaContentParams({ content_category: "", content_ids: [] })).toEqual({});
  });
});
