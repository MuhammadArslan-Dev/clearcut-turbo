import React, { useState, useMemo, useEffect } from "react";
import LevelSelectionCard from "./LevelSelectionCard";
import { useLevels } from "@/hooks/onboarding/useLevels";
import { motion } from "framer-motion";
import Button from "@mui/joy/Button";
import {
  ChevronDoubleRightIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { Level, purchaseLevels } from "@/lib/api/onboarding";
import ButtonShimmerOverlay from "@/components/ui/button-shimmer-overlay";
import ShimmerButton from "@/components/ui/button/shimmer-button";
import useButtonArrowAnimation from "@/hooks/useButtonArrowAnimation";
import { useTranslations } from "next-intl";
import DotsLoader from "@/components/ui/loader/DotsLoader";
import OptionCard from "./option-card";
import { getAuthTokenClient } from "@/lib/auth-token-client";

type SelectionState = {
  path: Level[];
  finalSelection: Level | null;
};

export default function FullExamSelection({ data }: { data: any }) {
  const { levels: levelsRaw = [], loading, error } = useLevels(data?.exam?.id);
  const levels = levelsRaw || [];
  const [childRenderLoader, setChildRenderLoader] = useState(false);

  const t = useTranslations();

  // All root levels (no parent) – e.g., Paper 1, Paper 2
  const parentLevels = useMemo(
    () => levels.filter((item) => item.parent_id === null),
    [levels]
  );

  // Which root is currently being edited
  const [activeRootId, setActiveRootId] = useState<number | string | null>(
    null
  );

  // Per-root selection state: { [rootId]: { path: Level[], finalSelection: Level | null } }
  const [selectionState, setSelectionState] = useState<
    Record<number | string, SelectionState>
  >({});

  useEffect(() => {
    // Only run when we actually have at least one root
    if (parentLevels.length > 0) {
      const maindata = parentLevels[0];
      setActiveRootId(maindata.id);
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

  const currentParentId: number | string | null =
    selectedPath.length > 0
      ? selectedPath[selectedPath.length - 1].id
      : activeRootId;

  const currentChildren: Level[] | [] =
    activeRootId == null || currentParentId == null
      ? []
      : levels.filter((item) => item.parent_id === currentParentId);

  // Select a child node (go deeper)
  const handleSelect = (item: Level) => {
    setChildRenderLoader(true);

    setTimeout(() => {
      if (activeRootId == null) return;

      const nextChildren = levels.filter((d) => d.parent_id === item.id);

      setSelectionState((prev) => {
        const existing = prev[activeRootId] || {
          path: [],
          finalSelection: null,
        };
        const alreadyInPath = existing.path.some((p) => p.id === item.id);
        const newPath = alreadyInPath
          ? existing.path
          : [...existing.path, item];

        return {
          ...prev,
          [activeRootId]: {
            path: newPath,
            finalSelection: nextChildren.length === 0 ? item : null,
          },
        };
      });
      setChildRenderLoader(false);
    }, 1000);
  };

  // Click on a breadcrumb item to go back to that level
  const handleEdit = (id: number | string) => {
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
    const nextRoot = parentLevels.slice(activeRootIndex + 1).find((root) => {
      const st = selectionState[root.id];
      return !st || !st.finalSelection;
    });

    if (!nextRoot) return; // no more levels to open

    // Set next root as active
    setActiveRootId(nextRoot?.id || null);

    // Initialize its state if not already set
    setSelectionState((prev) => {
      if (prev[nextRoot?.id]) return prev;

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
    const result: Record<
      number | string,
      { pathIds: (number | string)[]; finalId: number | string }
    > = {};
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

  const handlePurchase = async () => {
    const selections: Record<number | string, (number | string)[]> = {};

    Object.entries(selectedData).map(([rootId, step]) => {
      const selectedIds = step.pathIds;
      selections[rootId] = [...selectedIds];
    });

    const formData = { exam_id: data?.exam?.id, selections };
    const req = await purchaseLevels(formData);


    // if (req?.status === "success") {
    //     localStorage.removeItem('onboarding-storage')
    //     localStorage.removeItem('ONBOARDING_START')

    //     window.location.href = `https://app.clearcutoff.in/prepration/${req?.data?.uuid}?token=${getAuthTokenClient()}`
    // }

    // console.log('req', req)
    // console.log('formData', formData)
  };
  // ✅ NEW: decide when "Continue" should be enabled
  // Here: enable only when every root that has children has a finalSelection
  const isAllSelected = useMemo(() => {
    if (parentLevels.length === 0) return false;

    return parentLevels.every((root) => {
      const hasChildren = levels.some((l) => l.parent_id === root.id);
      if (!hasChildren) return true; // ignore roots that don't require selection

      const state = selectionState[root.id];
      return !!state?.finalSelection;
    });
  }, [parentLevels, levels, selectionState]);
  const { buttonPhase } = useButtonArrowAnimation({
    data: isAllSelected ? true : false,
  });

  return (
    <>
      <div className="bg-white py-2 mb-18 md:mb-0">
        {/* List of all parent (root) levels */}
        <div className="grid grid-cols-1 gap-2">
          {parentLevels.map((item) => {
            const isActive = item.id === activeRootId;
            const stateForThisRoot = selectionState[item.id];
            const isCompleted = stateForThisRoot?.finalSelection != null;

            return (
              <>
                {!isActive && (
                  <motion.div
                    className="cursor-pointer"
                    onClick={() => handleRootClick(item)}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                  >
                    <LevelSelectionCard
                      key={item.id}
                      // iconColor="var(--color-success)"
                      bg="var(--color-primary-subtle)"
                      title={item.name}
                      // subtitle={item.name}
                      showEdit={true}
                      onClick={() => handleRootClick(item)}
                    />
                  </motion.div>
                )}

                {/* Active root’s breadcrumb and children */}
                {activeRootId != null && item.id === activeRootId && (
                  <div className="">
                    <div className="flex flex-col gap-2 ">
                      {selectedPath.length > 0 &&
                        selectedPath.map((item, index) => (
                          <motion.div
                            key={item.id}
                            className="cursor-pointer"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            onClick={() =>
                              handleEdit(
                                item.parent_id ? item.parent_id : item.id
                              )
                            }
                          >
                            <LevelSelectionCard
                              iconColor="var(--color-success)"
                              bg="var(--color-success-soft)"
                              title={index === 0 ? item.name : item.group}
                              subtitle={index === 0 ? null : item.name}
                              showEdit={index === 0 ? false : true}
                              onClick={() =>
                                handleEdit(
                                  item.parent_id ? item.parent_id : item.id
                                )
                              }
                            />
                          </motion.div>
                        ))}
                    </div>

                    {childRenderLoader && (
                      <div className="p-4 flex items-center justify-center">
                        <DotsLoader />
                      </div>
                    )}

                    {!childRenderLoader && currentChildren.length > 0 && (
                      <div className="px-3 pt-4 flex flex-col gap-3">
                        <motion.div
                          className=""
                          initial={{ scale: 0.96, opacity: 0, y: 20 }}
                          animate={{ scale: 1, opacity: 1, y: 0 }}
                          exit={{ scale: 0.96, opacity: 0, y: -20 }}
                          transition={{ delay: 0.09 }}
                        >
                          <p className="heading-medium !font-semibold">
                            {currentChildren[0]?.group}
                          </p>
                        </motion.div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {currentChildren.map((item) => (
                            <motion.div
                              key={item.id}
                              initial={{ scale: 0.96, opacity: 0, y: 20 }}
                              animate={{ scale: 1, opacity: 1, y: 0 }}
                              exit={{ scale: 0.96, opacity: 0, y: -20 }}
                              transition={{ delay: 0.09 }}
                              whileTap={{ scale: 0.96 }}
                            >
                              <OptionCard
                                key={item.id}
                                onClick={() => handleSelect(item)}
                                text={item.name}
                              />
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            );
          })}
        </div>
      </div>
      <div className="py-2 px-4 bg-white fixed bottom-0 left-0 right-0 md:static md:bottom-auto md:left-auto md:right-auto">
        <ShimmerButton
          text={t("actions.continue")}
          disabled={!isAllSelected || loading}
          shimmer={buttonPhase === "shimmer"}
          icon={
            <motion.span
              className="flex items-center"
              animate={buttonPhase === "icon" ? { x: 6 } : { x: 0 }}
              transition={
                buttonPhase === "icon"
                  ? {
                      duration: 0.8,
                      repeat: Infinity,
                      repeatType: "reverse", // smooth 0 → 6 → 0 → 6...
                      ease: "easeInOut",
                    }
                  : {
                      duration: 0.18, // smooth return to 0 when phase changes
                      ease: "easeOut",
                    }
              }
            >
              <ChevronDoubleRightIcon strokeWidth={3} width={16} />
            </motion.span>
          }
          iconPosition="right"
          onClick={handlePurchase}
        />
      </div>
    </>
  );
}
