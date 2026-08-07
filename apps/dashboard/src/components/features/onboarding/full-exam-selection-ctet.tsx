import React, { useState, useMemo, useEffect } from "react";
import { Card } from "@clearcut/ui/card";
import LevelSelectionCard from "./LevelSelectionCard";
import { useLevels } from "@/hooks/onboarding/useLevels";
import { motion, AnimatePresence, scale } from "framer-motion";
import { Button } from "@clearcut/ui/button";
import {
  ChevronDoubleRightIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { Level, purchaseLevels } from "@/lib/api/onboarding";
import ButtonShimmerOverlay from "@/components/ui/button-shimmer-overlay";
import DotsLoader from "@/components/ui/loader/DotsLoader";
import OptionCard from "./option-card";
import { getAuthTokenClient } from "@/lib/auth-token-client";
import { trackEvent } from "@/lib/analytics/browser";
import { trackFacebookEvent } from "@/lib/analytics/facebook-pixel";
import { AppLanguageCode } from "@/lib/analytics/events/onboarding";
import useButtonArrowAnimation from "@/hooks/useButtonArrowAnimation";
import ShimmerButton from "@/components/ui/button/shimmer-button";
import { useTranslations } from "next-intl";

type SelectionState = {
  path: Level[];
  finalSelection: Level | null;
};

export default function FullExamSelectionCtet({ data }: { data: any }) {
  const { levels: levelsRaw = [], loading, error } = useLevels(data?.exam?.id);
  const levels = levelsRaw || [];
  const [childRenderLoader, setChildRenderLoader] = useState(false);
  const [submiting, setSubmiting] = useState(false);
  const t = useTranslations();

  // All root levels (Paper 1, Paper 2, etc.)
  const parentLevels = levels.filter((item) => item.parent_id === null);

  const [activeRootId, setActiveRootId] = useState<number | null>(null);
  const [selectionState, setSelectionState] = useState<
    Record<number, SelectionState>
  >({});

  // -------- AUTO‑SELECT LEVEL‑2 LANGUAGE BY SLUG FOR EVERY ROOT --------
  // Adjust to your actual field, e.g. data.language.slug / data.language_slug
  const preselectedLanguageSlug: string | undefined = data?.language_slug;

  useEffect(() => {
    if (!preselectedLanguageSlug || levels.length === 0) return;

    const roots = levels.filter((l) => l.parent_id === null);

    setSelectionState((prev) => {
      const next: Record<number, SelectionState> = { ...prev };
      let changed = false;

      roots.forEach((root) => {
        // Don't override if this root already has a selection
        if (next[root.id]) return;

        // Find this language under THIS root
        const langNode = levels.find(
          (l) => l.parent_id === root.id && l.slug === preselectedLanguageSlug
        );
        if (!langNode) return;

        const langChildren = levels.filter((l) => l.parent_id === langNode.id);
        const isLeaf = langChildren.length === 0;

        next[root.id] = {
          path: [root, langNode],
          finalSelection: isLeaf ? langNode : null,
        };
        changed = true;

        // If no root is active yet, make this one active
        if (activeRootId == null) {
          setActiveRootId(root.id);
        }
      });

      return changed ? next : prev;
    });
  }, [preselectedLanguageSlug, levels, activeRootId]);
  // ---------------- END AUTO‑SELECT LOGIC ----------------

  const activeState: SelectionState | undefined =
    activeRootId != null ? selectionState[activeRootId] : undefined;

  const selectedPath: Level[] = activeState?.path ?? [];

  const currentParentId: number | null =
    selectedPath.length > 0
      ? selectedPath[selectedPath.length - 1].id
      : activeRootId;

  const currentChildren =
    activeRootId == null || currentParentId == null
      ? []
      : levels.filter((item) => item.parent_id === currentParentId);

  useEffect(() => {
    // Only run when we actually have at least one root
    if (parentLevels.length > 0) {
      const maindata = parentLevels[1];
      setActiveRootId(maindata.id);
      handleRootClick(maindata);
    }
  }, [parentLevels]);

  // When clicking a root (Paper 1 / Paper 2)
  const handleRootClick = (root: Level) => {
    setActiveRootId(root.id);

    setSelectionState((prev) => {
      if (prev[root.id]) return prev; // keep existing selection

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

  // Apply a language (by slug) to ALL roots (Level 1, Level 2, etc.)
  const applySlugToAllRoots = (slug: string) => {
    const roots = levels.filter((l) => l.parent_id === null);

    setSelectionState((prev) => {
      const next: Record<number, SelectionState> = { ...prev };

      roots.forEach((root) => {
        const langNode = levels.find(
          (l) => l.parent_id === root.id && l.slug === slug
        );
        if (!langNode) return;

        const langChildren = levels.filter((l) => l.parent_id === langNode.id);
        const isLeaf = langChildren.length === 0;

        next[root.id] = {
          path: [root, langNode],
          finalSelection: isLeaf ? langNode : null,
        };
      });

      return next;
    });
  };

  // Select a language/child for the active root
  const handleSelect = (item: Level) => {
    setChildRenderLoader(true);

    setTimeout(() => {
      if (activeRootId == null) return;

      const nextChildren = levels.filter((d) => d.parent_id === item.id);
      // If this item has a slug, mirror it to Level 1 (and other roots) by slug
      if (item.slug) {
        applySlugToAllRoots(item.slug);
      }
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

  // Breadcrumb click
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
          finalSelection: null,
        },
      };
    });
  };

  // Optional: aggregate data
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

  const handlePurchase = async () => {
    const selections = {};
    setSubmiting(true);

    Object.entries(selectedData).map(([rootId, step]) => {
      const selectedIds = step.pathIds;
      selections[rootId] = [...selectedIds];
    });

    const formData = { exam_id: data?.exam?.id, selections };
    const req = await purchaseLevels(formData);
    if (req?.status === "success") {
      trackFacebookEvent("StartTrial");
      trackEvent("Onboarding Step Completed", {
        step_number: 3,
        step_name: "subject_selection",
        paper_choice: data?.formData,
      });
      trackEvent("Onboarding Completed", {
        up_chosen_exam_id: data?.exam?.id,
        up_chosen_paper_id: data?.level?.id,
        up_preferred_app_language: data?.language as AppLanguageCode,
      });
      localStorage.removeItem("onboarding-storage");
      localStorage.removeItem("ONBOARDING_START");

      window.location.href = `https://app.clearcutoff.in/prepration/${
        req?.data?.uuid
      }?token=${getAuthTokenClient()}`;
    }
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
      <motion.div
        className="bg-white py-2"
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
      >
        {/* Root levels (Paper 1, Paper 2...) */}
        {/* <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {parentLevels.slice(1).map((item) => {
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

                            {stateForThisRoot?.path &&
                                stateForThisRoot.path.length > 1 && (
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
            </div> */}

        {/* Active root’s breadcrumb + children */}
        {activeRootId != null && (
          <div className="">
            <div className="flex flex-col gap-2">
              {selectedPath.length > 0 &&
                selectedPath.slice(1).map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      handleEdit(item.parent_id ? item.parent_id : item.id)
                    }
                  >
                    <LevelSelectionCard
                      key={item.id}
                      iconColor="var(--color-success)"
                      bg="var(--color-success-soft)"
                      title={item?.group}
                      subtitle={item?.name}
                      showEdit={true}
                      onClick={() =>
                        handleEdit(item.parent_id ? item.parent_id : item.id)
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
              <div className="px-3 pt-4 flex flex-col gap-4">
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
      </motion.div>
      <div className="py-2 px-4 bg-white fixed bottom-0 left-0 right-0 md:static md:bottom-auto md:left-auto md:right-auto">
        <motion.div whileTap={{ scale: 0.99 }}>
          <ShimmerButton
            text={t("actions.continue")}
            disabled={currentChildren.length > 0 || submiting}
            shimmer={buttonPhase === "shimmer"}
            onClick={handlePurchase}
            loading={submiting}
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
          />
        </motion.div>
      </div>
      {/* <div>
                <pre>{JSON.stringify(selectedData, null, 2)}</pre>
            </div> */}
    </>
  );
}
