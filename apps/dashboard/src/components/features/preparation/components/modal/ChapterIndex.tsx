"use client";

import { useIsMobile } from "@/hooks/useIsMobile";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { CrossIcon, HindiLangCircleIcon } from "@/components/ui/icons";
import { useTranslations } from "next-intl";
import { AnimatePresence } from "framer-motion";
import { BottomSheet } from "@/components/features/Sheets/BottomSheet";
import { Modal } from "@/components/features/Sheets/Modal";
import SectionHeaderCard from "@/components/ui/cards/preparation/chapter-list/SectionHeaderCard";
import { usePreparationModalStore } from "@/components/features/preparation/store/usePreparationModalStore";
import { useBackHandler } from "@/hooks/Global/useBackHandler";
import { usePreparationStore } from "../../store/usePreparationDataStore";
import { Chapter } from "../../types/types";
import { getChapterProgress } from "../../util/progressTracker";
import Text from "@clearcut/ui/text";
import CounterCard from "@/components/ui/cards/CounterCard";
import { LockIcon } from "lucide-react";
import { handleOpenPaywall } from "@/components/features/PayWalls/PaywallFloatingWidget";
import { useRouter } from "@/i18n/navigation";

export default function ChapterIndex() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const t = useTranslations("");
  const { chapters, selectedChapter, setChapter, progressByTopicId, course } =
    usePreparationStore();
  const { isOpen, closeModal, stack } = usePreparationModalStore();
  useBackHandler({
    isOpen: isOpen,
    onClose: () => closeModal("chapter-index"),
  });
  const active = stack[stack.length - 1];
  /* ---------------------------------- container (stable) ---------------------------------- */
  const Container = useMemo(() => (isMobile ? BottomSheet : Modal), [isMobile]);

  // Build chapters lookup map
  const chaptersById = useMemo(() => {
    const map: Record<number, Chapter> = {};
    chapters?.forEach((chapter) => {
      map[chapter.id] = chapter;
    });
    return map;
  }, [chapters]);

  /* ---------------------------------- render ---------------------------------- */
  return (
    <AnimatePresence>
      {isOpen && active === "chapter-index" && (
        <Container
          isHeader={false}
          titleClass="heading-medium !font-semibold"
          maxWidth="md:max-w-[700px]"
          isOpen={isOpen}
          onClose={() => {
            window.history.pushState({ overlay: true }, "");

            closeModal("chapter-index");
          }}
        >
          <div className="flex flex-col">
            <div className="flex justify-between sticky top-0 bg-white px-4 py-3">
              <h6 className="heading-medium !font-semibold">
                {t("common.index")}
              </h6>
              <div
                className="cursor-pointer"
                onClick={() => closeModal("chapter-index")}
              >
                <CrossIcon />
              </div>
            </div>

            <div className="max-h-[75vh] md:max-h-[80vh] px-3 py-3 md:px-5 md:py-5 md:pt-3 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ">
                {chapters?.map((chapter: Chapter, chapterIndex) => {
                  const chapterProgress = getChapterProgress(
                    chapter.id,
                    chaptersById,
                    progressByTopicId,
                  );
                  return (
                    <SectionHeaderCard
                      key={chapterIndex}
                      breadcrumb={
                        <div className="flex items-center gap-1">
                          <Text
                            // as="p"
                            variant="body-medium"
                            weight="normal"
                            className="!font-normal text-surface-gray-muted"
                          >
                            {t("common.chapter")} {chapterIndex + 1}
                          </Text>
                          <Text
                            // as="p"
                            variant="body-small"
                            weight="normal"
                            className="!font-normal text-surface-gray-muted"
                          >
                            • {chapterProgress.completedTopics} /
                            {chapterProgress.totalTopics}{" "}
                            {t("course.courseStatus.completed")}
                          </Text>
                        </div>
                      }
                      title={chapter.name}
                      cursor="cursor-pointer"
                      onClick={() => {
                        if (chapter?.locked)
                          handleOpenPaywall(
                            router,
                            "chapter_card_clicked",
                            course,
                          );

                        closeModal("chapter-index");
                        setChapter(chapter);
                      }}
                      titleClassName="!heading-small !font-semibold text-surface-gray-normal"
                      breadcrumbClassName="body-small text-surface-gray-muted"
                      containerClassName="px-4 py-3 "
                      radiusClassName="rounded-lg"
                      borderClassName={
                        selectedChapter?.id === chapter.id
                          ? "border-2 border-brand"
                          : "border-2 border-[var(--border-gray-normal)]/40"
                      }
                      trailingIcon={
                        chapter?.locked && (
                          <CounterCard
                            width="w-8"
                            height="h-8"
                            borderColor="border-[#0083ff] border-2"
                            value={<LockIcon size={20} color="#0083ff" />}
                          />
                        )
                      }
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </Container>
      )}
    </AnimatePresence>
  );
}
