import TabSwitch from "@/components/ui/tabs/TabSwitch";
import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";
import React, { useEffect, useState } from "react";

export default function TestsSwitch() {
  const { get, set } = useQueryParams();
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    const tab = (get("testType") as string) ?? "chapter-tests";
    setActiveTab(tab);
  }, [get]);

  return (
    <TabSwitch
      layoutScopeId="paper-change"
      scrollable
      items={[
        { id: "sectional-tests", label: "Sectional Tests" },
        { id: "full-length-papers", label: "Full-length Papers" },
      ]}
      value={activeTab}
      onChange={(id) => {
        set({ ["testType"]: id });
        setActiveTab(id);
      }}
      activeTextColor="text-surface-gray-normal px-5 py-2 !min-w-[80px]"
      inactiveTextColor="text-white px-3 py-2 !min-w-[80px]"
      tabFontSize="body-medium"
      tabFontWeight="!font-semibold"
      activeTabFontWeight="!font-semibold"
      containerBg="bg-[var(--color-brand-dark)]"
      containerRadius="rounded-none md:rounded-l-full"
      className="!min-h-10 !max-h-12 !py-2 !px-3 w-full md:w-fit "
      activeTabBg="bg-white"
    />
  );
}
