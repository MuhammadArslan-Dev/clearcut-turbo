import { afterEach, describe, expect, it, vi } from "vitest";
import { BLOG_SERVER_KEY_HEADER, backendServerHeaders } from "./backend-headers";

afterEach(() => {
  delete process.env.BLOG_SERVER_KEY;
  vi.unstubAllGlobals();
});

describe("backendServerHeaders", () => {
  it("sends the in-code blog server key on the server", () => {
    // Long enough for the backend, which ignores keys under 32 characters.
    expect(backendServerHeaders()[BLOG_SERVER_KEY_HEADER]).toMatch(/^.{32,}$/);
  });

  it("lets the environment override the key", () => {
    process.env.BLOG_SERVER_KEY = "k".repeat(40);
    expect(backendServerHeaders()).toEqual({ [BLOG_SERVER_KEY_HEADER]: "k".repeat(40) });
  });

  it("never sends it from a browser", () => {
    process.env.BLOG_SERVER_KEY = "k".repeat(40);
    vi.stubGlobal("window", {});
    expect(backendServerHeaders()).toEqual({});
  });
});
