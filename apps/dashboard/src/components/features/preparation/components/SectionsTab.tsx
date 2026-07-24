import TabSwitch from "@/components/ui/tabs/TabSwitch";
import React, { useEffect } from "react";
import { usePreparationStore } from "../store/usePreparationDataStore";
import { Skeleton } from "@/components/ui/skeleton";
import { trackEvent } from "@/lib/analytics/browser";
import useLanguageSwitch from "@/hooks/useLanguageSwitch";
import SectionSwitchUI from "@/components/ui/tabs/SectionSwitchUI";
import { mapSectionsToItems } from "@/lib/mapPapersToItems";

export default React.memo(function SectionsTab({
  layoutId,
}: {
  layoutId?: string;
}) {
  const {
    selectedPaperId,
    sectionsByPaperId,
    selectedSectionId,
    selectSection,
    loading,
  } = usePreparationStore();

  const { locale } = useLanguageSwitch();

  const sections = selectedPaperId
    ? (sectionsByPaperId[selectedPaperId] ?? [])
    : [];

  const items = mapSectionsToItems(sections, locale);

  /* ----------------------------------
     AUTO-SELECT FIRST SECTION
  ----------------------------------- */
  useEffect(() => {
    if (!selectedSectionId && items.length > 0) {
      selectSection(Number(items[0].id));
    }
  }, [items, selectedSectionId, selectSection]);

  const changeSection = async (id: string) => {
    const fromSection = sections.find((s) => s.id === selectedSectionId);
    const toSection = sections.find((s) => s.id === Number(id));

    await trackEvent("Section Switched", {
      from_section_name: fromSection?.name! ?? null,
      to_section_name: toSection?.name! ?? null,
    });

    selectSection(Number(id));
  };

  return loading ? (
    <div className="h-11 flex items-center bg-[var(--color-brand-dark)] gap-3 px-4 lg:rounded-l-full overflow-hidden">
      {Array.from({ length: 5 }).map((_, index) => (
        <TabsSekeleton key={index} />
      ))}
    </div>
  ) : (
    items.length > 1 && (
      <div className="lg:rounded-l-full overflow-hidden">
        <SectionSwitchUI
          layoutId={"section-tab-preparation"}
          items={items}
          active={selectedSectionId?.toString() ?? null}
          changeSection={(id: string) => changeSection(id)}
        />
        {/* <TabSwitch
          layoutScopeId={layoutId ?? "section-tab"}
          scrollable
          items={items}
          value={selectedSectionId?.toString() ?? null}
          onChange={(id) => changeSection(id)}
          activeTextColor="text-surface-gray-normal px-5 py-2 !min-w-[20px]"
          inactiveTextColor="text-white py-2  !min-w-[20px]"
          tabFontSize="body-medium"
          tabFontWeight="!font-normal"
          activeTabFontWeight="!font-semibold"
          containerBg="bg-[var(--color-brand-dark)]"
          containerRadius="rounded-none"
          className="!min-h-10 !max-h-12 !py-2 !px-3 md:!px-3 md:!py-1  md:w-fit"
          activeTabBg="bg-white"
        /> */}
      </div>
    )
  );
});

const TabsSekeleton = React.memo(function TabsSekeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="w-[100px] h-9 rounded-full" />
    </div>
  );
});
