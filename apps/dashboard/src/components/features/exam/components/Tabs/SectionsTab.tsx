import TabSwitch from "@/components/ui/tabs/TabSwitch";
import React, { useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { trackEvent } from "@/lib/analytics/browser";
import { useExamStore } from "../../store/useExamStore";

export default function SectionsTab({
  layoutId,
  wrapperClassName = "lg:rounded-l-full overflow-hidden",
}: {
  layoutId?: string;
  wrapperClassName?: string;
}) {
  const { getExamContext, goToSection } = useExamStore();
  const wrapRef = useRef<HTMLDivElement>(null);

  // ===============================
  // CONTEXT
  // ===============================

  const { sections, sectionIndex } = getExamContext();

  // Keep the active section centred in the (scrollable) strip — on mount and
  // whenever the section changes, whether by tapping a tab or by moving past
  // the end of a section with Next / Save and Next.
  useEffect(() => {
    const list = wrapRef.current?.querySelector<HTMLElement>('[role="tablist"]');
    const active = list?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!list || !active) return;
    list.scrollTo({
      left: active.offsetLeft - list.clientWidth / 2 + active.clientWidth / 2,
      behavior: "smooth",
    });
  }, [sectionIndex, sections.length]);

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
    <div ref={wrapRef} className={wrapperClassName}>
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
