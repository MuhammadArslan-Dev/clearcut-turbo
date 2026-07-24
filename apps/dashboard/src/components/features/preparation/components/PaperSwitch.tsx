import React from "react";
import { usePreparationStore } from "../store/usePreparationDataStore";
import TabSwitch from "@/components/ui/tabs/TabSwitch";
import useLanguageSwitch from "@/hooks/useLanguageSwitch";
import { mapPapersToItems } from "@/lib/mapPapersToItems";

export default React.memo(function PaperSwitch() {
  const { selectedPaperId, papers, selectPaper, loading } =
    usePreparationStore();
  const { locale } = useLanguageSwitch();

  const items = React.useMemo(
    () => {
      return mapPapersToItems(papers, locale);
    },
    [papers],
  );

  return (
    items.length > 1 && (
      <TabSwitch
        layoutScopeId="paper-change"
        scrollable
        items={items}
        value={selectedPaperId?.toString() ?? null}
        onChange={(id) => selectPaper(Number(id))}
        activeTextColor="text-white !py-1 px-8 !min-w-[100px]"
        inactiveTextColor="text-surface-gray-normal !py-1 px-6 !min-w-[100px] "
        tabFontWeight=""
        activeTabFontWeight="!font-semibold"
        containerBg="bg-white"
        containerRadius="rounded-t-lg"
        className="!min-h-10 !w-auto  !py-0 !px-3 mt-1 gap-2 -mx-3 md:w-fit"
        activeTabBg="bg-[var(--color-brand-dark)] "
        tabRadius="rounded-t-lg "
        tabBg="bg-[var(--color-brand-dark)]/12 rounded-t-lg"
      />
    )
  );
});
