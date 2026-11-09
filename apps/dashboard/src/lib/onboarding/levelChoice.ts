// CC-81 (phase 86): the paper -> combination/subject choice inside onboarding.
// Pure helpers, so the rules are testable without React.
//
// The tree comes from `GET /v1/exam/all-levels/{id}`. Content only exists on LEAF nodes, and the leaves are
// alternatives (a CTET Paper 2 track, one HTET subject): a student picks ONE path from a paper down to a leaf.
import type { Level } from "@/lib/api/onboarding";

/** A group with more options than this gets a search box. */
export const SEARCH_MIN_OPTIONS = 8;

const sameId = (a: Level["id"] | null | undefined, b: Level["id"] | null | undefined) => String(a) === String(b);

export function childrenOf(levels: Level[], parentId: Level["id"] | null): Level[] {
  return parentId === null
    ? levels.filter((l) => l.parent_id === null || l.parent_id === undefined)
    : levels.filter((l) => l.parent_id !== null && l.parent_id !== undefined && sameId(l.parent_id, parentId));
}

export function leafCount(levels: Level[]): number {
  return levels.filter((l) => childrenOf(levels, l.id).length === 0).length;
}

/** More than one leaf = the student has a real choice to make. One leaf (or none) = nothing to ask. */
export function needsLevelChoice(levels: Level[]): boolean {
  return leafCount(levels) > 1;
}

/** A single paper is picked for the student (an exam with one paper has nothing to choose, CC-111). */
export function initialPath(levels: Level[]): Level[] {
  const roots = childrenOf(levels, null);
  return roots.length === 1 ? [roots[0]] : [];
}

/** Choosing at `depth` replaces that choice and everything below it. */
export function pathAfterSelect(path: Level[], depth: number, item: Level): Level[] {
  return [...path.slice(0, depth), item];
}

/** Complete = the last picked node is a leaf. */
export function isPathComplete(levels: Level[], path: Level[]): boolean {
  const last = path[path.length - 1];
  return Boolean(last) && childrenOf(levels, last.id).length === 0;
}

/** The option lists to show: one per depth, stopping at the first level the student has not answered yet. */
export function groupsToShow(levels: Level[], path: Level[]): { depth: number; options: Level[] }[] {
  const groups: { depth: number; options: Level[] }[] = [];
  for (let depth = 0; ; depth++) {
    const options = depth === 0 ? childrenOf(levels, null) : childrenOf(levels, path[depth - 1]?.id ?? null);
    if (depth > 0 && !path[depth - 1]) break;
    if (options.length === 0) break;
    groups.push({ depth, options });
    if (!path[depth]) break;
  }
  return groups;
}

/** Case-insensitive match on the shown name; the selected option never disappears from the list. */
export function filterOptions(
  options: Level[],
  query: string,
  nameOf: (level: Level) => string,
  selectedId?: Level["id"],
): Level[] {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  return options.filter((o) => (selectedId !== undefined && sameId(o.id, selectedId)) || nameOf(o).toLowerCase().includes(q));
}
