import React from "react";
import TabSwitch, { TabItem } from "./TabSwitch";


type Props = {
  layoutId: string;
  items: TabItem[];
  active: number | string | null;
  changeSection: (id: string) => void;
};

export default function SectionSwitchUI({
  layoutId,
  items,
  active,
  changeSection,
}: Props) {
  return (
    <TabSwitch
      layoutScopeId={layoutId ?? "section-tab"}
      scrollable
      items={items}
      value={active?.toString() ?? null}
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
    />
  );
}
