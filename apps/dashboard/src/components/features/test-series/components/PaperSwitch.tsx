import React from "react";
import TabSwitch from "@/components/ui/tabs/TabSwitch";
import useLanguageSwitch from "@/hooks/useLanguageSwitch";
import { Paper } from "../../preparation/types/types";
import { useTestListDataStore } from "../store/useTestListDataStore";

export default React.memo(function PaperSwitch() {

  const { papers, paper, setPaper } = useTestListDataStore();

  const { locale } = useLanguageSwitch();

  const items = React.useMemo(
    () =>
      papers?.map((paper) => {
        const parsedName = JSON.parse(paper.name);

        return {
          id: paper.id.toString(),
          label: (
            <div className="flex flex-col">
              <span className="heading-small ">
                {parsedName?.[locale]?.name}
              </span>
              <span className="body-xsmall !font-normal">
                {parsedName?.[locale].detail}
              </span>
            </div>
          ),
        };
      }),
    [papers],
  );

  return (
    items?.length! > 1 && (
      <TabSwitch
        layoutScopeId="paper-change-tests"
        scrollable
        items={items!}
        value={paper?.id?.toString() ?? null}
        onChange={(id) => setPaper(papers?.find((p) => p.id === Number(id)) as Paper)}
        activeTextColor="text-white !py-1 px-8 !min-w-[100px]"
        inactiveTextColor="text-surface-gray-normal !py-1 px-6 !min-w-[100px] "
        tabFontWeight=""
        activeTabFontWeight="!font-semibold"
        containerBg="bg-[var(--color-brand-dark)]/12"
        containerRadius="rounded-t-lg"
        className="!min-h-10 !w-auto  !py-0 !px-0 mt-1  md:w-fit"
        activeTabBg="bg-[var(--color-brand-dark)]"
        tabRadius="rounded-t-lg"
      />
    )
  );
});
