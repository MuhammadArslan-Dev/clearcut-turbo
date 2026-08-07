'use client';
import TabSwitch from "@/components/ui/tabs/TabSwitch";
import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";
import { trackEvent } from "@/lib/analytics/browser";
import React, { useEffect, useState } from "react";

export default React.memo(function TestsSwitch() {
  const { get, set } = useQueryParams();
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    const tab = (get("testType") as string) ?? "chapter-tests";
    setActiveTab(tab);
    trackEvent("Test List Filtered", {
      filter_type: tab,
    });
  }, [get]);

  return (
    <TabSwitch
      layoutScopeId="paper-change-12"
      scrollable
      items={[
        { id: "chapter-tests", label: "Chapter Tests" },
        { id: "sectional-tests", label: "Sectional Tests" },
        { id: "full-length-papers", label: "Full-length Papers" },
      ]}
      value={activeTab}
      onChange={(id) => {
        set({ ["testType"]: id });
        setActiveTab(id);
      }}
      activeTextColor="text-surface-gray-normal px-5 py-2 !min-w-[20px]"
      inactiveTextColor="text-white py-2  !min-w-[20px]"
      tabFontSize="body-medium"
      tabFontWeight="!font-semibold"
      activeTabFontWeight="!font-semibold"
      containerBg="bg-[var(--color-brand-dark)]"
      containerRadius="rounded-none md:rounded-l-full"
      className="!min-h-10 !max-h-12 !py-1 !px-3 md:justify-end  md:!px-1 "
      activeTabBg="bg-white"

    />
  );
});
