"use client";

import { useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { BottomSheet } from "@/components/features/Sheets/BottomSheet";
import { Modal } from "@/components/features/Sheets/Modal";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useBackHandler } from "@/hooks/Global/useBackHandler";
import { CrossIcon, LockIcon } from "@/components/ui/icons";
import SectionHeaderCard from "@/components/ui/cards/preparation/chapter-list/SectionHeaderCard";
import Text from "@clearcut/ui/text";
import { useNotesIndexStore } from "../store/useNotesIndexStore";

/**
 * Notes-page equivalent of preparation's ChapterIndex — lists the current
 * section's chapters and scrolls the tapped one into view via
 * useNotesIndexStore's pendingScrollToId (consumed by section-notes.tsx),
 * instead of preparation's topic-progress-driven "select chapter" flow,
 * which doesn't apply here.
 */
export default function NotesIndexModal() {
  const isMobile = useIsMobile();
  const t = useTranslations();
  const { isOpen, chapters, close, jumpTo } = useNotesIndexStore();

  useBackHandler({ isOpen, onClose: close });

  const Container = useMemo(() => (isMobile ? BottomSheet : Modal), [isMobile]);

  return (
    <AnimatePresence>
      {isOpen && (
        <Container
          isHeader={false}
          maxWidth="md:max-w-[700px]"
          isOpen={isOpen}
          onClose={close}
        >
          <div className="flex flex-col">
            <div className="flex justify-between sticky top-0 bg-white px-4 py-3">
              <h6 className="heading-medium !font-semibold">{t("common.index")}</h6>
              <div className="cursor-pointer" onClick={close}>
                <CrossIcon />
              </div>
            </div>

            <div className="max-h-[75vh] md:max-h-[80vh] px-3 py-3 md:px-5 md:py-5 md:pt-3 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {chapters.map((chapter, chapterIndex) => (
                  <SectionHeaderCard
                    key={chapter.id}
                    breadcrumb={
                      <Text
                        variant="body-medium"
                        weight="normal"
                        className="!font-normal text-surface-gray-muted"
                      >
                        {t("common.chapter")} {chapterIndex + 1}
                      </Text>
                    }
                    title={chapter.name}
                    cursor="cursor-pointer"
                    onClick={() => jumpTo(chapter.id)}
                    titleClassName="!heading-small !font-semibold text-surface-gray-normal"
                    breadcrumbClassName="body-small text-surface-gray-muted"
                    containerClassName="px-4 py-3"
                    radiusClassName="rounded-lg"
                    borderClassName="border-2 border-[var(--border-gray-normal)]/40"
                    trailingIcon={
                      chapter.locked && (
                        <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                          <LockIcon size={20} color="var(--color-brand)" />
                        </div>
                      )
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        </Container>
      )}
    </AnimatePresence>
  );
}
