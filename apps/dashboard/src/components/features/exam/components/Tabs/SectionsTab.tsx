import TabSwitch from "@/components/ui/tabs/TabSwitch";
import React, { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { trackEvent } from "@/lib/analytics/browser";
import { useExamStore } from "../../store/useExamStore";

export default function SectionsTab({ layoutId }: { layoutId?: string }) {
  const { getExamContext, goToSection } = useExamStore();

  // ===============================
  // CONTEXT
  // ===============================

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

  // ===============================
  // RENDER
  // ===============================

  if (!sections.length) {
    return <TabsSekeleton />;
  }

  return (
    <div className="lg:rounded-l-full overflow-hidden">
      <TabSwitch
        layoutScopeId={layoutId ?? "section-tab"}
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
        className="!min-h-10 !max-h-12 !py-2 !px-3 md:!px-3 md:!py-1  md:w-fit"
        activeTabBg="bg-white"
      />
    </div>
  );
}

const TabsSekeleton = React.memo(function TabsSekeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="w-[100px] h-9 rounded-full" />
    </div>
  );
});
