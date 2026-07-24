import React, { useState, useEffect } from "react";
import CardWrap from "@/components/ui/cards/card-wrap";
import LevelSelectionCard from "./LevelSelectionCard";
import { useLevels } from "@/hooks/onboarding/useLevels";
import Button from "@mui/joy/Button";
import ButtonShimmerOverlay from "@/components/ui/button-shimmer-overlay";
import {
  ChevronDoubleRightIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import ShimmerButton from "@/components/ui/button/shimmer-button";
import useButtonArrowAnimation from "@/hooks/useButtonArrowAnimation";
import { useTranslations } from "next-intl";
import DotsLoader from "@/components/ui/loader/DotsLoader";
import OptionCard from "./option-card";
import { trackEvent } from "@/lib/analytics/browser";
import { AppLanguageCode } from "@/lib/analytics/events/onboarding";
import { Level, purchaseLevels } from "@/lib/api/onboarding";
import { getAuthTokenClient } from "@/lib/auth-token-client";

export default function SingleLevelSelection({ data }: { data: any }) {
  const rootId = data?.level?.id as number | undefined;
  const t = useTranslations();
  const [childRenderLoader, setChildRenderLoader] = useState(false);
  const [submiting, setSubmiting] = useState(false);

  const { levels: levelsRaw = [], loading, error } = useLevels(data?.exam?.id);

  const levels = levelsRaw || [];

  const [buttonLoading, setButtonLoading] = useState(loading);

  const [currentParent, setCurrentParent] = useState<number | string | null>(
    rootId ?? null
  );
  const [selectedPath, setSelectedPath] = useState<Level[]>([]);

  const [finalSelection, setFinalSelection] = useState<Level | null>(null);

  // Initialize path with root node once levels are loaded
  useEffect(() => {
    if (selectedPath.length === 0) {
      setChildRenderLoader(true);
    }
    setTimeout(() => {
      setChildRenderLoader(false);
      if (!rootId || levels.length === 0) return;

      // Only initialize if path is empty (so we don't override user navigation)
      if (selectedPath.length > 0) return;

      const rootNode = levels.find((item: Level) => item.id === rootId);
      if (rootNode) {
        setSelectedPath([rootNode]);
        setCurrentParent(rootNode?.id);
      }
    }, 1000);
  }, [rootId, levels, selectedPath.length]);

  // Children of the current parent
  const currentChildren =
    currentParent == null
      ? []
      : levels.filter((item: Level) => item.parent_id === currentParent);

  // Select a child node (go deeper)
  const handleSelect = (item: Level) => {
    setChildRenderLoader(true);

    setTimeout(() => {
      const nextChildren = levels.filter((d: Level) => d.parent_id === item.id);

      // Add to path only if not already present
      setSelectedPath((prev) => {
        if (prev.some((p) => p.id === item.id)) return prev;
        return [...prev, item];
      });

      setCurrentParent(item.id);

      // If no more children, this is the final selection
      if (nextChildren.length === 0) {
        setFinalSelection(item);
      } else {
        setFinalSelection(null);
      }

      setChildRenderLoader(false);
    }, 500); // ⏱ 1 second delay
  };

  // Click on a breadcrumb item to go back to that level
  const handleEdit = (id: number) => {
    const index = selectedPath.findIndex((item) => item.id === id);
    if (index === -1) return;

    const newPath = selectedPath.slice(0, index + 1);

    setSelectedPath(newPath);
    setCurrentParent(id);
    setFinalSelection(null);
  };

  const handlePurchase = async () => {
    const selections: Record<number, number[]> = {
      [selectedPath[0]?.id]: selectedPath.map((item) => item.id),
    };
    setSubmiting(true);
    const formData = { exam_id: data?.exam?.id, selections };
    const req = await purchaseLevels(formData);
    if (req?.status === "success") {
      setSubmiting(false);
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
  };

  // Optional: back button logic (not used in JSX, but ready)
  const handleBack = () => {
    if (selectedPath.length === 0) return;

    const newPath = selectedPath.slice(0, -1);
    setSelectedPath(newPath);

    if (newPath.length > 0) {
      setCurrentParent(newPath[newPath.length - 1].id);
    } else {
      setCurrentParent(rootId ?? null);
    }

    setFinalSelection(null);
  };

  // (Optional) handle loading / error if you want:
  // if (loading) return <div>Loading...</div>;
  // if (error) return <div className="text-red-500">Error loading levels</div>;
  const { buttonPhase } = useButtonArrowAnimation({
    data: currentChildren.length > 0 ? false : true,
  });

  return (
    <>
      <div className="bg-white py-2 mb-12">
        <div className="flex flex-col gap-2">
          {/* Breadcrumb / Selected Path */}
          {selectedPath.length > 0 &&
            selectedPath.map((item, index) => (
              <motion.div
                key={item.id}
                className={`${
                  index === 0 ? "cursor-default" : "cursor-pointer"
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                whileTap={{ scale: index === 0 ? 1 : 0.98 }}
                onClick={
                  index === 0
                    ? () => {}
                    : () =>
                        handleEdit(item.parent_id ? item.parent_id : item.id)
                }
              >
                <LevelSelectionCard
                  iconColor="var(--color-success)"
                  bg="var(--color-success-soft)"
                  title={index === 0 ? item.name : item.group}
                  subtitle={index === 0 ? null : item.name}
                  showEdit={index === 0 ? false : true}
                  onClick={() =>
                    handleEdit(item.parent_id ? item.parent_id : item.id)
                  }
                />
              </motion.div>
            ))}
        </div>

        {/* Children of current level */}

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
            <div className=" grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
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
                    text={item.name}
                    onClick={() => handleSelect(item)}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="py-2 px-4 bg-white fixed bottom-0 left-0 right-0 md:static md:bottom-auto md:left-auto md:right-auto">
        <motion.div whileTap={{ scale: 0.99 }}>
          <ShimmerButton
            text={t("actions.continue")}
            disabled={currentChildren.length > 0 || buttonLoading || submiting}
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
    </>
  );
}
