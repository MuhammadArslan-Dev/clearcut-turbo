import TabSwitch from "@/components/ui/tabs/TabSwitch";
import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";
import React, { useEffect } from "react";

export default function QuestionReportTabs({
  layoutId,
  onChange,
}: {
  layoutId?: string;
  onChange?: (id: string) => void;
}) {
  const [activeTab, setActiveTab] = React.useState<string | null>('summary-view');

  const { get, set } = useQueryParams();

  useEffect(() => {
    const report = get("report");

    if (report) {
      setActiveTab(report);
    }
  }, []);

  return (
    <div className="md:rounded-full w-full flex justify-center bg-[var(--color-brand-dark)]">
      <TabSwitch
        layoutScopeId={layoutId ?? "question-report-tabs"}
        scrollable
        items={[
          { id: "summary-view", label: "Summary View" },
          { id: "question-view", label: "Question View" },
        ]}
        value={activeTab!}
        onChange={(id) => {
          set({ ["report"]: id });
          setActiveTab(id);
          onChange && onChange(id);
        }}
        activeTextColor="text-surface-gray-normal px-5 py-2 !min-w-[20px]"
        inactiveTextColor="text-white py-2  !min-w-[20px]"
        tabFontSize="body-medium"
        tabFontWeight="!font-normal"
        activeTabFontWeight="!font-semibold"
        containerBg="bg-[var(--color-brand-dark)]"
        containerRadius="rounded-full"
        className="!min-h-10 !max-h-12 !py-2 !px-3 md:!px-3 md:!py-1  md:w-fit"
        activeTabBg="bg-white"
      />
    </div>
  );
}
