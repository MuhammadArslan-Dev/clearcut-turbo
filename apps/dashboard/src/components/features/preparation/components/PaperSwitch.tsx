import React from "react";
import { usePreparationStore } from "../store/usePreparationDataStore";
import TabSwitch from "@/components/ui/tabs/TabSwitch";
import useLanguageSwitch from "@/hooks/useLanguageSwitch";
import { mapPapersToItems } from "@/lib/mapPapersToItems";
import { useTranslations } from "next-intl";
import { useAddPaper } from "../hooks/useAddPaper";

/**
 * Sentinel id for the trailing "Add Paper" tab. It is not a paper, so it must
 * never reach `selectPaper` — `onChange` branches on it before doing anything
 * else. Prefixed to stay clear of the numeric paper ids.
 */
const ADD_PAPER_TAB_ID = "__add_paper__";

export default React.memo(function PaperSwitch() {
  const { selectedPaperId, papers, selectPaper, loading } =
    usePreparationStore();
  const { locale } = useLanguageSwitch();
  const addP = useTranslations("modals.addPaper");
  const { canAddPaper, openAddPaper } = useAddPaper();

  const paperItems = React.useMemo(
    () => {
      return mapPapersToItems(papers, locale);
    },
    [papers, locale],
  );

  // Always last, so the strip reads "your papers, then add another".
  const items = React.useMemo(() => {
    if (!canAddPaper) return paperItems;

    return [
      ...paperItems,
      {
        id: ADD_PAPER_TAB_ID,
        label: (
          <div className="flex flex-col">
            <span className="heading-small">{addP("title")}</span>
          </div>
        ),
      },
    ];
  }, [paperItems, canAddPaper, addP]);

  const handleChange = (id: string) => {
    if (id === ADD_PAPER_TAB_ID) {
      openAddPaper();
      return;
    }
    selectPaper(Number(id));
  };

  // One paper on its own needs no switcher — but one paper plus an "Add Paper"
  // tab does, which is the only entry point to adding on mobile (the BottomBar
  // pill is desktop-only).
  return (
    items.length > 1 && (
      <TabSwitch
        layoutScopeId="paper-change"
        scrollable
        items={items}
        value={selectedPaperId?.toString() ?? null}
        onChange={handleChange}
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
