"use client";

import TabSwitch from "@/components/ui/tabs/TabSwitch";
import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

interface ContentPageSwitchProps {
  // Two copies of this component can be mounted at once — Topbar's own and
  // the bottom-fixed mirror that grows in while the top one scrolls away
  // (see BottomContentPageSwitchReveal). Framer Motion's `layoutId` (used by
  // TabSwitch's active-pill indicator) is shared globally by default, so two
  // simultaneously-mounted instances with the SAME id fight over the same
  // animated element — one of them visibly loses its content/sizing.
  // Callers rendering a second copy must pass a distinct id.
  layoutScopeId?: string;
}

export default function ContentPageSwitch({ layoutScopeId = "page-change" }: ContentPageSwitchProps) {
  const pathname = usePathname();
  const params = useParams();
  const courseId = params.courseId as string;
  const t = useTranslations("common");

  // 🧠 Derive active tab from URL
  const segments = pathname.split("/");

  const currentTab = segments.includes("pyqs") ? "pyqs" : "notes";


  return (
    <TabSwitch
      type="link"
      layoutScopeId={layoutScopeId}
      scrollable
      value={currentTab}
      items={[
        {
          id: "notes",
          label: t("notes"),
          href: `notes`,
          match: "notes",
        },
        {
          id: "pyqs",
          label: t("papers"),
          href: `pyqs`,
          match: "pyqs",
        },
      ]}
      tabFontSize="body-medium md:body-large"
      activeTextColor="text-white whitespace-nowrap md:px-10"
      inactiveTextColor="text-surface-gray-normal !min-w-[75px] whitespace-nowrap md:px-10"
      tabFontWeight="!font-semibold"
      activeTabFontWeight="!font-semibold"
      containerBg="bg-white"
      className="!h-9 border border-[var(--border-gray-normal)] !p-[2px]"
      activeTabBg="bg-brand"
    />
  );
}
