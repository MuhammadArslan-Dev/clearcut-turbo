import TabSwitch from "@/components/ui/tabs/TabSwitch";
import React from "react";
import { useExamReportStore } from "./store/useExamReportStore";

export default function SectionSwitchInExamReport({ layoutId }: { layoutId?: string }) {
    const {exam,goToSection,getExamContext}=useExamReportStore();
  
    const { sections, sectionIndex } = getExamContext();
  // ===============================
  // TAB ITEMS
  // ===============================

  const sectionsItem = sections.map((s, index) => ({
    id: index.toString(), // IMPORTANT: use index
    label: s.section?.name ?? s.name, // fallback
  }));

  // ===============================
  // HANDLER
  // ===============================

  const handleChange = (id: string) => {
    const index = Number(id);

    if (Number.isNaN(index)) return;

    goToSection(index);

    // // Analytics (optional)
    // trackEvent("exam_section_switch", {
    //   sectionIndex: index,
    //   sectionName: sections[index]?.name,
    // });
  };
  return (
    <div className="w-full">
      <TabSwitch
        layoutScopeId={layoutId ?? "exam-report-tabs"}
        scrollable
        items={sectionsItem}
        value={sectionIndex.toString()}
        onChange={handleChange}
        activeTextColor="text-surface-gray-normal px-5 py-2 !min-w-[20px]"
        inactiveTextColor="text-white py-2  !min-w-[20px]"
        tabFontSize="body-medium"
        tabFontWeight="!font-normal"
        activeTabFontWeight="!font-semibold"
        containerBg="bg-[var(--color-brand-dark)]"
        containerRadius="rounded-none"
        className="!min-h-10 !max-h-12 !py-2 !px-3  w-full"
        activeTabBg="bg-white"
      />
    </div>
  );
}
