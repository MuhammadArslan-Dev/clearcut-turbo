"use client";

import { Tab } from "@/app/[locale]/(protected)/(dashboard)/dashboard/profile/page";
import React, { createContext, useContext } from "react";

type ActiveTab = Tab | null;

type TabContextValue = {
  activeTab: ActiveTab;
};

const TabContext = createContext<TabContextValue | null>(null);

export function TabProvider({
  value,
  children,
}: {
  value: TabContextValue;
  children: React.ReactNode;
}) {
  return (
    <TabContext.Provider value={value}>
      {children}
    </TabContext.Provider>
  );
}

export function useTabContext() {
  const ctx = useContext(TabContext);
  if (!ctx) {
    throw new Error("useTabContext must be used inside TabProvider");
  }
  return ctx;
}
