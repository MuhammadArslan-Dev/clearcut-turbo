"use client";

import { useState } from "react";
import clsx from "clsx";
import TabSwitch, { TabItem } from "./TabSwitch";


type Props = {
  tabs: TabItem[];
  selectedId?: number | string | null;
  onChange?: (id: string) => void;
  containerBg?: string
};

export default function PaperTabs({
  tabs,
  selectedId = '0',
  onChange,
  containerBg="bg-white"
}: Props) {

  return (
    <TabSwitch
      layoutScopeId="paper-change"
      scrollable
      items={tabs}
      value={selectedId?.toString() ?? null}
      onChange={(id) => onChange?.(id)}
      activeTextColor="text-white !py-1 px-8 !min-w-[100px]"
      inactiveTextColor="text-surface-gray-normal !py-1 px-6 !min-w-[100px] "
      tabFontWeight=""
      activeTabFontWeight="!font-semibold"
      containerBg={containerBg}
      containerRadius="rounded-t-lg"
      className="!min-h-10 !w-auto  !py-0 !px-3 mt-1 gap-2 -mx-3 md:w-fit"
      activeTabBg="bg-[var(--color-brand-dark)] "
      tabRadius="rounded-t-lg "
      tabBg="bg-[var(--color-brand-dark)]/12 rounded-t-lg"
    />
  );
}
