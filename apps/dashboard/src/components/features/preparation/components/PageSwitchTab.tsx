"use client";

import React, { useEffect, useState } from "react";
import TabSwitch from "@/components/ui/tabs/TabSwitch";
import { usePathname } from "@/i18n/navigation";
import { trackEvent } from "@/lib/analytics/browser";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useAllowPrefetch } from "@/hooks/useAllowPrefetch";
import { useProgressCapabilities } from "@/components/features/preparation/hooks/useProgressCapabilities";

type PageTab = "course" | "test-series" | "target";

interface PageSwitchTabProps {
  // Two copies of this component can be mounted at once — Topbar's own and
  // the bottom-fixed mirror that grows in while the top one scrolls away
  // (see BottomPageSwitchReveal). Framer Motion's `layoutId` (used by
  // TabSwitch's active-pill indicator) is shared globally by default, so
  // two simultaneously-mounted instances with the SAME id fight over the
  // same animated element — one of them visibly loses its content/sizing.
  // Callers rendering a second copy must pass a distinct id.
  layoutScopeId?: string;
}

export default React.memo(function PageSwitchTab({
  layoutScopeId = "page-change-tab",
}: PageSwitchTabProps) {
  const pathname = usePathname();
  const params = useParams();
  const courseId = params.courseId as string;
  const t = useTranslations("common");
  // Slow / Save-Data connections don't prefetch the other tab while this
  // page is still loading (CC-146).
  const allowPrefetch = useAllowPrefetch();

  // ✅ Keep IDs SIMPLE and STATIC
  const [tab, setTab] = useState<PageTab | null>(null);
  // Target tab (phase 99): only while the Cutoff Meter is on; off = the bar is unchanged.
  const { caps } = useProgressCapabilities();
  const showTarget = caps.cutoff_meter;

  // 🔹 Sync active tab FROM URL (single source of truth)
  useEffect(() => {
    if (!courseId) return;

    if (pathname.startsWith(`/target/${courseId}`)) {
      setTab("target");
    } else if (pathname.startsWith(`/test-series/${courseId}`)) {
      setTab("test-series");
    } else if (pathname.startsWith(`/preparation/${courseId}`)) {
      setTab("course");
    }
  }, [pathname, courseId]);

  // 🔹 Only for analytics (navigation handled by link href)
  const onTabChange = (nextTab: PageTab) => {
    const from = tab;
    setTab(nextTab);

    if (nextTab === "test-series") {
      trackEvent("Learning Path Switched", {
        from_path: from === "target" ? "target" : "course",
        to_path: "tests",
      });
    } else if (nextTab === "target") {
      trackEvent("Learning Path Switched", {
        from_path: from === "test-series" ? "tests" : "course",
        to_path: "target",
      });
    }
  };

  return (
    <TabSwitch
      type="link"
      prefetch={allowPrefetch}
      layoutScopeId={layoutScopeId}
      scrollable
      items={[
        // Target first (user, 2026-11-11), only while the Cutoff Meter is on.
        ...(showTarget
          ? [{ id: "target", label: t("target"), href: `/target/${courseId}`, match: "target" }]
          : []),
        {
          id: "course",
          label: t("course"),
          href: `/preparation/${courseId}`,
          match: "preparation",
        },
        {
          id: "test-series",
          label: t("tests"),
          href: `/test-series/${courseId}`,
          match: "test-series",
        },
      ]}
      value={tab}
      tabFontSize="body-medium md:body-large"
      onChange={(id) => onTabChange(id as PageTab)}
      activeTextColor="text-white whitespace-nowrap md:px-10"
      inactiveTextColor="text-surface-gray-normal !min-w-[75px] whitespace-nowrap md:px-10"
      tabFontWeight="!font-semibold"
      activeTabFontWeight="!font-semibold"
      containerBg="bg-white"
      className="!h-9 border border-[var(--border-gray-normal)] !p-[2px]"
      activeTabBg="bg-brand"
    />
  );
});
