// utils/findLeafNodes.ts

type Doc = {
    id: number | string;
    exam_id: string;
    parent_id: number | string | null;
    name: string;
    group: string;
    status: string;
    flag_course: string;
    flag_tests: string;
    updatedAt: string;
    createdAt: string;
};

export function findLeafNodes(docs: Doc[], selected: number | string): Doc[] {
    if (!docs?.length) return [];

    // Normalize everything to string for consistent comparison
    const normalize = (v: string) => (v === null || v === undefined ? '' : String(v));

    // 1️⃣ Find the selected node (by ID or Name)
    const selectedDoc =
        typeof selected === 'number' || /^\d+$/.test(selected as string)
            ? docs.find((d) => normalize(d.id) === normalize(selected))
            : docs.find(
                (d) => d.name.toLowerCase().trim() === (selected as string).toLowerCase().trim()
            );

    if (!selectedDoc) {
        console.warn('No matching item found for:', selected);
        return [];
    }

    // 2️⃣ Build parent → children map
    const childrenMap = new Map<string, Doc[]>();
    for (const doc of docs) {
        const parent = normalize(doc.parent_id);
        if (!childrenMap.has(parent)) {
            childrenMap.set(parent, []);
        }
        childrenMap.get(parent)!.push(doc);
    }

    // 3️⃣ Recursive function to collect all *leaf* nodes
    const leafNodes: Doc[] = [];

    function collectLeaves(id: string) {
        const children = childrenMap.get(id);
        if (!children || children.length === 0) {
            const leaf = docs.find((d) => normalize(d.id) === id);
            if (leaf) leafNodes.push(leaf);
            return;
        }

        for (const child of children) {
            collectLeaves(normalize(child.id));
        }
    }

    // 4️⃣ Start recursion from the selected node
    collectLeaves(normalize(selectedDoc.id));
      // ✅ Make unique by name
  const uniqueLeafNodes = leafNodes.filter(
    (node, index, self) =>
      index === self.findIndex((n) => n.name === node.name)
  );

    return uniqueLeafNodes;
}
