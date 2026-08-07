// src/hooks/useResponsiveTabs.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";

type UseResponsiveTabsOptions<T extends string> = {
  defaultTab: T;
  queryKey: string;
};

export function useResponsiveTabs<T extends string>({
  defaultTab,
  queryKey,
}: UseResponsiveTabsOptions<T>) {
  const { get, set } = useQueryParams();
  const isMobile = useIsMobile();

  const mountedRef = useRef(false);
  const [activeTab, setActiveTab] = useState<T | null>(null);

  /* -------------------------------------------------
     Initial sync (RUN ONCE)
  -------------------------------------------------- */
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    if (!isMobile) {
      const tab = (get(queryKey) as T) ?? defaultTab;
      setActiveTab(tab);
    }
  }, [isMobile, get, queryKey, defaultTab]);

  /* -------------------------------------------------
     Reset tab on mobile
  -------------------------------------------------- */
  useEffect(() => {
    if (!mountedRef.current) return;
    if (isMobile) setActiveTab(null);
  }, [isMobile]);

  /* -------------------------------------------------
     Mobile back handling
  -------------------------------------------------- */
  useEffect(() => {
    if (!isMobile) return;

    const onPopState = () => setActiveTab(null);
    window.addEventListener("popstate", onPopState);

    return () => window.removeEventListener("popstate", onPopState);
  }, [isMobile]);

  /* -------------------------------------------------
     Handlers (STABLE)
  -------------------------------------------------- */
  const handleTabChange = useCallback(
    (tab: T) => {
      setActiveTab(tab);

      if (isMobile) {
        set({ [queryKey]: tab }, { replace: false });
      } else {
        set({ [queryKey]: tab }, { replace: false });
      }
    },
    [isMobile, set, queryKey],
  );

  const handleBack = useCallback(() => {
    window.history.back();
  }, []);

  return {
    activeTab,
    isMobile,
    handleTabChange,
    handleBack,
  };
}
