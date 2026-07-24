"use client";

import React, { useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

import { useIsMobile } from "@/hooks/useIsMobile";
import { usePreparationModalStore } from "@/components/features/preparation/store/usePreparationModalStore";

import {
  CheckIcon,
  ChevronIcon,
  CrossIcon,
  FireIcon,
  PenIcon,
  VideoCamIcon,
} from "@/components/ui/icons";

import { BottomSheet } from "@/components/features/Sheets/BottomSheet";
import { Modal } from "@/components/features/Sheets/Modal";
import ShimmerButton from "@/components/ui/button/shimmer-button";
import { highlightTextUtil } from "@/utils/text/highlightTextUtil";
import { useBackHandler } from "@/hooks/Global/useBackHandler";
import Text from "@clearcut/ui/text";
import { usePreparationStore } from "../../store/usePreparationDataStore";
import { apiFetch } from "@/lib/api/client";

export default function GuideLine() {
  const isMobile = useIsMobile();
  const t = useTranslations("modals.courseFirstTime");

  /* ---------- store ---------- */
  const { closeModal } = usePreparationModalStore();
  const { course, markGuideAsSeen } = usePreparationStore();
  useBackHandler({
    isOpen: true,
    onClose: () => closeModal("preparation-guide"),
  });

  /* ---------- stable container ---------- */
  const Container = useMemo(() => (isMobile ? BottomSheet : Modal), [isMobile]);

  /* ---------- stable callbacks ---------- */
  const handleClose = useCallback(async () => {
    markGuideAsSeen();
    closeModal("preparation-guide");

    if (!course?.id) return;

    try {
      await apiFetch(`/v2/action/start-course`, {
        method: "POST",
        body: JSON.stringify({ courseId: course?.group_code }),
      });
    } catch {
      // best-effort — the local flag is already set
    }
  }, [closeModal, markGuideAsSeen, course?.id, course?.group_code]);

  return (
    <Container
      isHeader={false}
      titleClass="heading-medium !font-semibold"
      isOpen
      maxWidth="md:max-w-[420px]"
      onClose={handleClose}
    >
          <div className="bg-white h-full flex flex-col justify-between md:gap-2">
            {/* Header */}
            <div className="sticky top-0 z-10 flex justify-between gap-4 px-3 py-3 bg-white">
              <div className="space-y-1">
                <Text
                  as="h6"
                  variant="heading-medium"
                  weight="semibold"
                  color="gray-normal"
                >
                  {t("title", { exam: course?.exam?.short_name ?? "" })}
                </Text>
                <Text
                  as="p"
                  variant="body-small"
                  weight="normal"
                  color="gray-muted"
                >
                  {t("subtitle", { exam: course?.exam?.short_name ?? "" })}
                </Text>
              </div>
              <button type="button" onClick={handleClose} aria-label="Go back" className="cursor-pointer">
                <CrossIcon />
              </button>
            </div>

            {/* Content */}
            <div className="w-full flex justify-center py-2">
              <div className=" md:max-w-[352px] w-full flex flex-col gap-5 bg-white p-3 md:rounded-lg">
                <div className="flex flex-col gap-2">
                  <GuideItem
                    icon={<VideoCamIcon variant="outline" />}
                    text={t("features.video")}
                    highlight={t("features.videoB")}
                  />
                  <GuideItem
                    icon={<PenIcon variant="book-pen" />}
                    text={t("features.notes")}
                    highlight={t("features.notesB")}
                  />
                  <GuideItem
                    icon={<PenIcon />}
                    text={t("features.miniTests")}
                    highlight={t("features.miniTestsB")}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-5 h-5">
                    <CheckIcon color="#00A251" size={16} />
                  </div>

                  <p className="body-small text-surface-gray-subtle">
                    {t("info")}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 z-10 px-3 py-2 flex flex-col gap-1 bg-white">
              <ShimmerButton
                text={t("buttons.startLearning")}
                shimmer={true}
                icon={
                  <motion.span
                    className="flex items-center"
                    animate={{ x: 6 }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut",
                    }}
                  >
                    <ChevronIcon
                      variant="right"
                      color="white"
                      size={24}
                      type="double"
                    />
                  </motion.span>
                }
                iconPosition="right"
                onClick={handleClose}
              />

              <div className="flex justify-center w-full items-center gap-2">
                <div className="w-4 h-4">
                  <FireIcon
                    size={16}
                    variant="outline"
                    color="var(--color-surface-gray-muted)"
                  />
                </div>
                <Text
                  as="p"
                  variant="body-small"
                  color="gray-muted"
                  weight="normal"
                >
                  {t("footerNote")}
                </Text>
              </div>
            </div>
          </div>
    </Container>
  );
}

/* ---------- memoized child ---------- */
const GuideItem = React.memo(function GuideItem({
  icon,
  text,
  highlight,
}: {
  icon: React.ReactNode;
  text: string;
  highlight: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6">{icon}</div>
      <p className="body-medium !font-normal text-surface-gray-subtle">
        {highlightTextUtil(
          text,
          highlight,
          "body-medium !font-semibold text-surface-gray-subtle",
        )}
      </p>
    </div>
  );
});
