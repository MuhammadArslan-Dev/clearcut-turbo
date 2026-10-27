import React from "react";
import SettingsSidebarWrapper from "./SettingsSidebarWrapper";
import SettingsSidebarNav from "./SettingsSidebarNav";
import { Tab } from "@/app/[locale]/(protected)/(dashboard)/dashboard/profile/page";


type Props = {
  activeTab?: Tab | null;
  onTabChange: (tab: Tab) => void;
};

export default function SettingNav({ activeTab, onTabChange }: Props) {
  return (
    <SettingsSidebarWrapper>
      {/* The Terms/Privacy/Refund/Contact footer card that used to sit here is
          absent from the design (D3). It still renders on the "privacy" tab via
          ProfilePage, so the links remain reachable. */}
      <SettingsSidebarNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          onTabChange(tab as Tab);
        }}
      />
    </SettingsSidebarWrapper>
  );
}
