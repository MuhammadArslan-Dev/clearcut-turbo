"use client";

import React, { useEffect } from "react";
import { usePreparationStore } from "../store/usePreparationDataStore";
import SectionSwitchUI from "@/components/ui/tabs/SectionSwitchUI";

export default React.memo(function AreaTab() {
  const { selectedSection, selectedArea, selectArea } = usePreparationStore();

  const areas = selectedSection?.areas?.areas ?? [];

  // Auto-select first area when section changes and has areas
  useEffect(() => {
    if (areas.length > 0 && !selectedArea) {
      selectArea(areas[0]);
    }
    if (areas.length === 0 && selectedArea) {
      selectArea(null);
    }
  }, [selectedSection?.id]);

  if (!areas.length) return null;

  const items = areas.map((area) => ({
    id: area.id.toString(),
    label: area.name,
  }));

  return (
    <div className="overflow-hidden">
      <SectionSwitchUI
        layoutId="area-tab-preparation"
        items={items}
        active={selectedArea?.id?.toString() ?? null}
        changeSection={(id) => {
          const area = areas.find((a) => a.id === Number(id));
          selectArea(area ?? null);
        }}
      />
    </div>
  );
});
