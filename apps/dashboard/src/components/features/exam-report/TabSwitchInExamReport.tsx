import TabSwitch from "@/components/ui/tabs/TabSwitch";
import React from "react";

export default function TabSwitchInExamReport({
  list,
  activeTab,
  onChange,
}: {
  list?: Array<{ id: string; label: string | React.ReactNode }>;
  activeTab?: string;
  onChange?: (id: string) => void;
}) {
  return (
    <div className="w-full flex">
      <TabSwitch
        layoutScopeId="tab-switch-in-exam-report"
        scrollable
        items={list!}
        value={activeTab!}
        onChange={(id) => onChange?.(id)}
        activeTextColor="text-white !py-1 px-8 !min-w-[100px]"
        inactiveTextColor="text-surface-gray-normal !py-1 px-6 !min-w-[100px] "
        tabFontWeight=""
        activeTabFontWeight="!font-semibold"
        containerBg="bg-[var(--color-brand-dark)]/12"
        containerRadius="rounded-t-lg"
        className="!min-h-10 !py-0 !px-0 mt-1"
        activeTabBg="bg-[var(--color-brand-dark)]"
        tabRadius="rounded-t-lg"
      />
    </div>
  );
}
