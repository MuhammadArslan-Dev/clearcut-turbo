import { describe, expect, it, vi } from "vitest";
import { getPhoneValidationError } from "@clearcut/auth/validators";
import { createFormInteractionTracker } from "@clearcut/auth/verification-events";

// `Authentication Form Interacted` on /start and the shared login modal (phase 134, fix 2). Lives in landing because
// packages/auth has no test runner; these are the pure pieces both screens call.

describe("getPhoneValidationError (same rules and order as validatePhone)", () => {
  it.each([
    ["", "empty"],
    ["5", "invalid_prefix"],
    ["51234", "invalid_prefix"],
    ["91", "country_code"],
    ["9198", "country_code"],
    ["98765", "too_short"],
    ["9123456", "too_short"], // 91 followed by 2: not the country-code pattern
    ["9999999999", "fake_number"],
    ["9898989898", "fake_number"],
  ])("%s -> %s", (digits, expected) => {
    expect(getPhoneValidationError(digits)).toBe(expected);
  });

  it("a real-looking 10-digit number is valid", () => {
    expect(getPhoneValidationError("9812345670")).toBeNull();
    expect(getPhoneValidationError("6398127450")).toBeNull();
  });
});

describe("createFormInteractionTracker", () => {
  it("phone_started on the first digit, phone_completed on the first valid number, each once, never the number", () => {
    const track = vi.fn();
    const t = createFormInteractionTracker(track);
    t.onPhoneInput("");
    expect(track).not.toHaveBeenCalled();
    t.onPhoneInput("9");
    t.onPhoneInput("98");
    t.onPhoneInput("981234567");
    t.onPhoneInput("9812345670");
    t.onPhoneInput("981234567");
    t.onPhoneInput("9812345670");
    expect(track).toHaveBeenCalledTimes(2);
    expect(track.mock.calls.map((c) => c[0])).toEqual([
      "Authentication Form Interacted",
      "Authentication Form Interacted",
    ]);
    expect(track.mock.calls[0][1]).toMatchObject({
      form_field: "input_phone_number",
      interaction: "phone_started",
      auth_method: "phone_otp",
    });
    expect(track.mock.calls[1][1]).toMatchObject({ interaction: "phone_completed" });
    expect(JSON.stringify(track.mock.calls)).not.toContain("9812345670");
  });

  it("a pasted full number sends started then completed", () => {
    const track = vi.fn();
    createFormInteractionTracker(track).onPhoneInput("9812345670");
    expect(track.mock.calls.map((c) => c[1].interaction)).toEqual(["phone_started", "phone_completed"]);
  });

  it("submit_invalid once, with the validation_error of the first blocked submit", () => {
    const track = vi.fn();
    const t = createFormInteractionTracker(track);
    t.onSubmitInvalid("98765");
    t.onSubmitInvalid("");
    expect(track).toHaveBeenCalledTimes(1);
    expect(track.mock.calls[0][1]).toMatchObject({ interaction: "submit_invalid", validation_error: "too_short" });
    expect(JSON.stringify(track.mock.calls)).not.toContain("98765");
  });

  it("no tracker passed (an app without analytics): nothing happens", () => {
    const t = createFormInteractionTracker(undefined);
    expect(() => {
      t.onPhoneInput("9812345670");
      t.onSubmitInvalid("1");
    }).not.toThrow();
  });
});
