"use client";

import TabSwitch from "@/components/ui/tabs/TabSwitch";
import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export default function ContentPageSwitch() {
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
      layoutScopeId="page-change"
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
