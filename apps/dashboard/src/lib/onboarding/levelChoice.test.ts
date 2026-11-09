import { describe, expect, it } from "vitest";
import type { Level } from "@/lib/api/onboarding";
import {
  filterOptions,
  groupsToShow,
  initialPath,
  isPathComplete,
  leafCount,
  needsLevelChoice,
  pathAfterSelect,
} from "./levelChoice";

const L = (id: number, parent: number | null, name = `n${id}`) =>
  ({ id, parent_id: parent, name, translation: {} }) as unknown as Level;

// CTET-like: two papers; paper 2 has combos, each with two subjects.
const ctet = [
  L(1, null, "Paper 1"), L(11, 1, "EH"), L(12, 1, "HS"),
  L(2, null, "Paper 2"), L(21, 2, "EH2"), L(211, 21, "Social"), L(212, 21, "Maths"), L(22, 2, "HS2"), L(221, 22, "Social"),
];
// UP PGT-like: one paper, many subjects.
const pgt = [L(5, null, "PGT"), L(51, 5, "Hindi"), L(52, 5, "Physics"), L(53, 5, "Chemistry")];
// One leaf only.
const single = [L(9, null, "Only")];

describe("levelChoice", () => {
  it("counts leaves and decides whether a choice is needed", () => {
    expect(leafCount(ctet)).toBe(5);
    expect(needsLevelChoice(ctet)).toBe(true);
    expect(needsLevelChoice(pgt)).toBe(true);
    expect(needsLevelChoice(single)).toBe(false);
    expect(needsLevelChoice([])).toBe(false);
  });

  it("picks the paper itself only when the exam has exactly one", () => {
    expect(initialPath(ctet)).toEqual([]);
    expect(initialPath(pgt).map((l) => l.id)).toEqual([5]);
  });

  it("shows one group at a time and stops at the first unanswered level", () => {
    expect(groupsToShow(ctet, []).map((g) => g.depth)).toEqual([0]);
    const p1 = pathAfterSelect([], 0, ctet[3]); // Paper 2
    expect(groupsToShow(ctet, p1).map((g) => g.depth)).toEqual([0, 1]);
    const p2 = pathAfterSelect(p1, 1, ctet[4]); // EH2
    expect(groupsToShow(ctet, p2).map((g) => g.depth)).toEqual([0, 1, 2]);
    const p3 = pathAfterSelect(p2, 2, ctet[5]); // Social = leaf
    expect(groupsToShow(ctet, p3).map((g) => g.depth)).toEqual([0, 1, 2]);
  });

  it("changing an earlier choice drops the later ones", () => {
    const full = [ctet[3], ctet[4], ctet[5]];
    expect(pathAfterSelect(full, 1, ctet[7]).map((l) => l.id)).toEqual([2, 22]);
    expect(pathAfterSelect(full, 0, ctet[0]).map((l) => l.id)).toEqual([1]);
  });

  it("is complete only when the last pick is a leaf", () => {
    expect(isPathComplete(ctet, [])).toBe(false);
    expect(isPathComplete(ctet, [ctet[3]])).toBe(false);
    expect(isPathComplete(ctet, [ctet[3], ctet[4]])).toBe(false);
    expect(isPathComplete(ctet, [ctet[3], ctet[4], ctet[5]])).toBe(true);
    expect(isPathComplete(ctet, [ctet[0], ctet[1]])).toBe(true);
    expect(isPathComplete(pgt, initialPath(pgt))).toBe(false);
  });

  it("filters by name, ignores case and spaces, and keeps the selected option", () => {
    const opts = pgt.slice(1);
    const nameOf = (l: Level) => l.name;
    expect(filterOptions(opts, "  PHY ", nameOf).map((l) => l.name)).toEqual(["Physics"]);
    expect(filterOptions(opts, "zzz", nameOf)).toEqual([]);
    expect(filterOptions(opts, "", nameOf)).toHaveLength(3);
    expect(filterOptions(opts, "phy", nameOf, 53).map((l) => l.name)).toEqual(["Physics", "Chemistry"]);
  });

  it("copes with string ids from the API", () => {
    const mixed = [L(1, null), { ...L(2, 1), id: "2", parent_id: "1" } as unknown as Level];
    expect(leafCount(mixed)).toBe(1);
    expect(groupsToShow(mixed, [mixed[0]]).map((g) => g.options.length)).toEqual([1, 1]);
  });
});
