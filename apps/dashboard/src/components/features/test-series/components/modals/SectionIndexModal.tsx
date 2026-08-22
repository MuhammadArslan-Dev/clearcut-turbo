"use client";

import { BottomSheet } from "@/components/features/Sheets/BottomSheet";
import { Modal } from "@/components/features/Sheets/Modal";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useBackHandler } from "@/hooks/Global/useBackHandler";
import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";
import { AnimatePresence } from "framer-motion";
import React, { useMemo } from "react";
import { useTestSeriesModalStore } from "../../store/useTestSeriesModalStore";
import { useTestListDataStore } from "../../store/useTestListDataStore";
import Text from "@clearcut/ui/text";
import SectionHeaderCard from "@/components/ui/cards/preparation/chapter-list/SectionHeaderCard";
import { CrossIcon } from "@/components/ui/icons";
import { useTranslations } from "next-intl";
import { SectionalSection } from "@/lib/tests/getExam";

export default function SectionIndexModal() {
  const { isOpen, closeModal, stack } = useTestSeriesModalStore();
  const { indexSections, selectedSectionId, setSelectedSectionId } =
    useTestListDataStore();
  const { get } = useQueryParams();
  const testType = get("testType");
  const isMobile = useIsMobile();
  const t = useTranslations("");

  const active = stack[stack.length - 1];
  useBackHandler({
    isOpen,
    onClose: () => closeModal("section-index"),
  });

  const Container = useMemo(() => (isMobile ? BottomSheet : Modal), [isMobile]);

  // ChapterTest tab-switches between sections (selectedSectionId drives
  // which one renders); SectionalTest has no tabs — every section is
  // already rendered inline, so "jumping" there means scrolling to it.
  const goToSection = (section: SectionalSection) => {
    if (testType === "chapter-tests") {
      setSelectedSectionId(section.id);
    } else {
      document
        .getElementById(`test-series-section-${section.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    closeModal("section-index");
  };

  if (!isOpen || active !== "section-index" || !indexSections?.length) {
    return null;
  }

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
              onClick={() => closeModal("section-index")}
            >
              <CrossIcon />
            </div>
          </div>

          <div className="max-h-[75vh] md:max-h-[80vh] px-3 py-3 md:px-5 md:py-5 md:pt-3 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {indexSections.map((section, sectionIndex) => (
                <SectionHeaderCard
                  key={section.id}
                  breadcrumb={
                    <div className="flex items-center gap-1">
                      <Text
                        variant="body-medium"
                        weight="normal"
                        className="!font-normal text-surface-gray-muted"
                      >
                        {t("common.section")} {sectionIndex + 1}
                      </Text>
                      <Text
                        variant="body-small"
                        weight="normal"
                        className="!font-normal text-surface-gray-muted"
                      >
                        • {section.attempted_count} /{" "}
                        {section.mandatory_count}{" "}
                        {t("course.courseStatus.completed")}
                      </Text>
                    </div>
                  }
                  title={section.name}
                  cursor="cursor-pointer"
                  onClick={() => goToSection(section)}
                  titleClassName="!heading-small !font-semibold text-surface-gray-normal"
                  breadcrumbClassName="body-small text-surface-gray-muted"
                  containerClassName="px-4 py-3"
                  radiusClassName="rounded-lg"
                  borderClassName={
                    testType === "chapter-tests" &&
                    selectedSectionId === section.id
                      ? "border-2 border-brand"
                      : "border-2 border-[var(--border-gray-normal)]/40"
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </AnimatePresence>
  );
}
