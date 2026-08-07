import {
  MediaPlayerIcon,
  NoteIcon,
  PathIcon,
  StarBadge,
} from "@/components/ui/icons";
import TabSwitch, { TabItem } from "@/components/ui/tabs/TabSwitch";
import Skeleton from "@clearcut/ui/skeleton";
import React, { memo, useMemo } from "react";

const Tabs = ({
  items,
  tab,
  setTab,
}: {
  items: TabItem[];
  tab: string | null;
  setTab: (tab: string) => void;
}) => {
  if (!items.length) {
    return (
      <div className="flex gap-2 px-4 py-2 bg-[var(--color-brand-dark)]">
        {[0, 1, 2].map((i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            width={100}
            height={32} borderRadius={999}
          />
        ))}
      </div>
    );
  }

  return (
    <TabSwitch
      layoutScopeId="tab-switch"
      scrollable
      items={items}
      value={tab}
      onChange={setTab}
      activeTextColor="text-surface-gray-normal px-5 py-2 !min-w-[80px]"
      inactiveTextColor="text-white px-3 py-2 !min-w-[80px]"
      tabFontSize="body-medium"
      tabFontWeight="!font-normal"
      activeTabFontWeight="!font-semibold"
      containerBg="bg-[var(--color-brand-dark)]"
      containerRadius="rounded-none"
      className="!min-h-10 !max-h-12 !py-2 !px-3"
      activeTabBg="bg-white "
    />
  );
};

export default memo(Tabs);
