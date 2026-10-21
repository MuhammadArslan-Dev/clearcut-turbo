import { describe, expect, it } from "vitest";
import { clampDob, maxDob } from "./dobSelection";

describe("clampDob", () => {
  it("leaves everything alone when no year is picked", () => {
    expect(clampDob("", 11, 31)).toEqual({ month: 11, day: 31 });
  });

  it("keeps a valid date as is", () => {
    expect(clampDob(1990, 0, 31)).toEqual({ month: 0, day: 31 });
  });

  it("clamps the day to the month's length", () => {
    expect(clampDob(1990, 1, 31)).toEqual({ month: 1, day: 28 });
    expect(clampDob(1992, 1, 31)).toEqual({ month: 1, day: 29 }); // leap year
    expect(clampDob(1990, 3, 31)).toEqual({ month: 3, day: 30 });
  });

  it("keeps empty month/day empty", () => {
    expect(clampDob(1990, "", 31)).toEqual({ month: "", day: 31 });
    expect(clampDob(1990, 1, "")).toEqual({ month: 1, day: "" });
  });

  it("pulls month and day back under the 18-years-old ceiling", () => {
    const cap = maxDob();
    const year = cap.getFullYear();
    const { month, day } = clampDob(year, 11, 31);
    expect(month).toBe(cap.getMonth());
    // Day is clamped against the CLAMPED month: never past the ceiling date.
    expect(day).toBeLessThanOrEqual(cap.getDate());
    expect(new Date(year, month as number, day as number).getTime()).toBeLessThanOrEqual(cap.getTime());
  });
});
