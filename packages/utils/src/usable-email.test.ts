import { describe, expect, it } from "vitest";
import { usableEmail } from "./usable-email";

describe("usableEmail (CC-113)", () => {
  it.each([
    ["Student.Name@Gmail.com", "student.name@gmail.com"],
    ["  rahul123@yahoo.in ", "rahul123@yahoo.in"],
    ["a.b+c@outlook.com", "a.b+c@outlook.com"],
  ])("%s → %s", (raw, want) => expect(usableEmail(raw)).toBe(want));

  it.each([
    [null],
    [undefined],
    [""],
    ["   "],
    ["not-an-email"],
    ["a@b"],
    ["9876543210@razorpay.com"],
    ["+919876543210@paytm.in"],
    ["test@gmail.com"],
    ["test123@gmail.com"],
    ["noreply@clearcutoff.in"],
    ["no-reply@clearcutoff.in"],
    ["someone@example.com"],
    [42],
  ])("%s → null", (raw) => expect(usableEmail(raw)).toBeNull());
});
