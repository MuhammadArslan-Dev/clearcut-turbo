import React from "react";
import SettingsSidebarWrapper from "./SettingsSidebarWrapper";
import SettingsSidebarNav from "./SettingsSidebarNav";
import SettingsSidebarFooter from "./SettingsSidebarFooter";
import { Tab } from "@/app/[locale]/(protected)/(dashboard)/dashboard/profile/page";


type Props = {
  activeTab?: Tab | null;
  onTabChange: (tab: Tab) => void;
};

export default function SettingNav({ activeTab, onTabChange }: Props) {
  return (
    <SettingsSidebarWrapper>
      <SettingsSidebarNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          onTabChange(tab as Tab);
        }}
      />
      <SettingsSidebarFooter />
    </SettingsSidebarWrapper>
  );
}
