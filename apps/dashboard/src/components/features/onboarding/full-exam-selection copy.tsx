import React, { useState, useMemo, useEffect } from "react";
import { Card } from "@clearcut/ui/card";
import LevelSelectionCard from "./LevelSelectionCard";
import { useLevels } from "@/hooks/onboarding/useLevels";

type Level = {
    id: number;
    name: string;
    parent_id: number | null;
};

type SelectionState = {
    path: Level[];
    finalSelection: Level | null;
};

export default function FullExamSelection({ data }: { data: any }) {
    const { levels: levelsRaw = [], loading, error } = useLevels(data?.exam?.id);
    const levels = levelsRaw || [];

    // All root levels (no parent) – e.g., Paper 1, Paper 2
    const parentLevels = useMemo(
        () => levels.filter((item) => item.parent_id === null),
        [levels]
    );

    // Which root is currently being edited
    const [activeRootId, setActiveRootId] = useState<number | null>(null);

    // Per-root selection state: { [rootId]: { path: Level[], finalSelection: Level | null } }
    const [selectionState, setSelectionState] = useState<
        Record<number, SelectionState>
    >({});

    useEffect(() => {
        // Only run when we actually have at least one root
        if (parentLevels.length > 0) {
            const maindata = parentLevels[0]
            setActiveRootId(maindata.id)
            handleRootClick(maindata);
        }
    }, [parentLevels]);

    // When clicking a root (parent) level
    const handleRootClick = (root: Level) => {
        setActiveRootId(root.id);

        setSelectionState((prev) => {
            // If this root already has state, don’t override it
            if (prev[root.id]) return prev;

            const rootChildren = levels.filter((l) => l.parent_id === root.id);
            const isLeaf = rootChildren.length === 0;

            return {
                ...prev,
                [root.id]: {
                    path: [root],
                    finalSelection: isLeaf ? root : null,
                },
            };
        });
    };

    const activeState: SelectionState | undefined =
        activeRootId != null ? selectionState[activeRootId] : undefined;

    const selectedPath: Level[] = activeState?.path ?? [];

    const currentParentId: number | null =
        selectedPath.length > 0
            ? selectedPath[selectedPath.length - 1].id
            : activeRootId;

    const currentChildren: Level[] =
        activeRootId == null || currentParentId == null
            ? []
            : levels.filter((item) => item.parent_id === currentParentId);

    // Select a child node (go deeper)
    const handleSelect = (item: Level) => {
        if (activeRootId == null) return;

        const nextChildren = levels.filter((d) => d.parent_id === item.id);

        setSelectionState((prev) => {
            const existing = prev[activeRootId] || { path: [], finalSelection: null };
            const alreadyInPath = existing.path.some((p) => p.id === item.id);
            const newPath = alreadyInPath ? existing.path : [...existing.path, item];

            return {
                ...prev,
                [activeRootId]: {
                    path: newPath,
                    finalSelection: nextChildren.length === 0 ? item : null,
                },
            };
        });
    };

    // Click on a breadcrumb item to go back to that level
    const handleEdit = (id: number) => {
        if (activeRootId == null) return;

        setSelectionState((prev) => {
            const existing = prev[activeRootId];
            if (!existing) return prev;

            const index = existing.path.findIndex((item) => item.id === id);
            if (index === -1) return prev;

            const newPath = existing.path.slice(0, index + 1);

            return {
                ...prev,
                [activeRootId]: {
                    path: newPath,
                    finalSelection: null, // user is editing, so clear final
                },
            };
        });
    };

    // NEW: auto‑open the next root (level 2, 3, ...) when current root is completed
    useEffect(() => {
        if (!activeRootId) return;
        if (parentLevels.length === 0) return;

        const activeRootIndex = parentLevels.findIndex(
            (r) => r.id === activeRootId
        );
        if (activeRootIndex === -1) return;

        const activeRootState = selectionState[activeRootId];
        const isActiveCompleted = !!activeRootState?.finalSelection;
        if (!isActiveCompleted) return;

        // Find the next root after the current one that is not completed
        const nextRoot = parentLevels
            .slice(activeRootIndex + 1)
            .find((root) => {
                const st = selectionState[root.id];
                return !st || !st.finalSelection;
            });

        if (!nextRoot) return; // no more levels to open

        // Set next root as active
        setActiveRootId(nextRoot.id);

        // Initialize its state if not already set
        setSelectionState((prev) => {
            if (prev[nextRoot.id]) return prev;

            const children = levels.filter((l) => l.parent_id === nextRoot.id);
            const isLeaf = children.length === 0;

            return {
                ...prev,
                [nextRoot.id]: {
                    path: [nextRoot],
                    finalSelection: isLeaf ? nextRoot : null,
                },
            };
        });
    }, [selectionState, parentLevels, activeRootId, levels]);

    // Optional: aggregate selected data
    const selectedData = useMemo(() => {
        const result: Record<number, { pathIds: number[]; finalId: number }> = {};
        Object.entries(selectionState).forEach(([rootIdStr, state]) => {
            if (!state.finalSelection) return;
            const rootId = Number(rootIdStr);
            result[rootId] = {
                pathIds: state.path.map((l) => l.id),
                finalId: state.finalSelection.id,
            };
        });
        return result;
    }, [selectionState]);

    return (
        <div className="bg-white py-4">
            {/* List of all parent (root) levels */}
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {parentLevels.map((item) => {
                    const isActive = item.id === activeRootId;
                    const stateForThisRoot = selectionState[item.id];
                    const isCompleted = stateForThisRoot?.finalSelection != null;

                    return (
                        <Card
                            key={item.id}
                            onClick={() => handleRootClick(item)}
                            className={`cursor-pointer hover:shadow-lg transition border ${isActive ? "!border-blue-500" : "border-transparent"
                                }`}
                        >
                            <p className="font-medium">{item.name}</p>

                            {stateForThisRoot?.path && (
                                <p className="text-xs text-gray-600 mt-1">
                                    Final:{" "}
                                    {stateForThisRoot.path
                                        .slice(1)
                                        .map((lvl) => lvl.name)
                                        .join(" ")}
                                </p>
                            )}

                            {isCompleted && (
                                <p className="text-xs text-green-600 mt-1">Completed</p>
                            )}
                        </Card>
                    );
                })}
            </div>

            {/* Active root’s breadcrumb and children */}
            {activeRootId != null && (
                <div className="mt-6 border-t pt-4">
                    <div className="flex flex-col gap-2 mb-4">
                        {selectedPath.length > 0 &&
                            selectedPath.map((item) => (
                                <LevelSelectionCard
                                    key={item.id}
                                    iconColor="var(--color-success)"
                                    bg="var(--color-success-soft)"
                                    title={item.name}
                                    showEdit={true}
                                    onClick={() => handleEdit(item.id)}
                                />
                            ))}
                    </div>

                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {currentChildren.length > 0 ? (
                            currentChildren.map((item) => (
                                <Card
                                    key={item.id}
                                    onClick={() => handleSelect(item)}
                                    className="cursor-pointer hover:shadow-lg transition"
                                >
                                    <p className="font-medium">{item.name}</p>
                                </Card>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500" />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}