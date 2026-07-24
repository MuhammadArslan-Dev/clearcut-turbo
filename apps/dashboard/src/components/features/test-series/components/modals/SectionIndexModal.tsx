import { BottomSheet } from "@/components/features/Sheets/BottomSheet";
import { Modal } from "@/components/features/Sheets/Modal";
import { useIsMobile } from "@/hooks/useIsMobile";
import { AnimatePresence } from "framer-motion";
import React, { useMemo } from "react";
import { useTestSeriesModalStore } from "../../store/useTestSeriesModalStore";
import Text from "@clearcut/ui/text";
import SectionHeaderCard from "@/components/ui/cards/preparation/chapter-list/SectionHeaderCard";
import { CrossIcon } from "@/components/ui/icons";

export default function SectionIndexModal() {
  const { isOpen, closeModal, stack, open } = useTestSeriesModalStore();
  const isMobile = useIsMobile();

  const active = stack[stack.length - 1];
  const Container = useMemo(() => (isMobile ? BottomSheet : Modal), [isMobile]);
  if (!isOpen || active !== "section-index") return null;

  return (
    <AnimatePresence>
      <Container
        isHeader={false}
        isOpen={isOpen}
        maxWidth="md:max-w-[680px]"
        onClose={() => closeModal("section-index")}
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
                  />
                );
              })}
            </div>
          </div>
        </div>{" "}
      </Container>
    </AnimatePresence>
  );
}
