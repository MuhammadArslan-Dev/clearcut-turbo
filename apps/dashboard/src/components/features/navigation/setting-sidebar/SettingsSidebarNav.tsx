"use client";

import React, { ComponentType, useCallback } from "react";
import ProfileItemList from "@/components/ui/widgets/ProfileItemList";
import {
  ClipBoardIcon,
  LanguageIcon,
  ListIcon,
  PaymentCardIcon,
  ProfileIcon,
  WarningCircleIcon,
} from "@/components/ui/icons";
import { IconProps } from "@/config/navigation";
import { useModalStore } from "@/store/modal/useModalStore";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics/browser";
import clsx from "clsx";

/* ----------------------------- Types ----------------------------- */

type Tab = "profile" | "payment" | "privacy" | "language" | "helpsport" | "subscription";

type SidebarItem = {
  tab: Tab;
  title: string;
  subtitle: string;
  icon: ComponentType<IconProps>;
  iconProps?: Partial<IconProps>;
  action?: "tab" | "modal";
};

/* ----------------------------- Config ----------------------------- */

const SECTION_1: SidebarItem[] = [
  {
    tab: "profile",
    title: "personalDetails",
    subtitle: "subtitle",
    icon: ProfileIcon,
    iconProps: {
      size: 24,
      variant: "person",
      color: "var(--icon-gray-subtle)",
    },
  },
  {
    tab: "payment",
    title: "payments",
    subtitle: "subtitle",
    icon: PaymentCardIcon,
    iconProps: {
      size: 24,
      variant: "outline",
      color: "var(--icon-gray-subtle)",
    },
  },
  {
    tab: "subscription",
    title: "subscriptions",
    subtitle: "subtitle",
    icon: ClipBoardIcon,
    iconProps: {
      size: 24,
      color: "var(--icon-gray-subtle)",
    },
  },
];

const SECTION_2: SidebarItem[] = [
  {
    tab: "language",
    title: "changeLanguage",
    subtitle: "subtitle",
    icon: LanguageIcon,
    action: "modal",
    iconProps: {
      size: 24,
      variant: "without-border",
      color: "var(--icon-gray-subtle)",
    },
  },
  {
    tab: "helpsport",
    title: "helpSupport",
    subtitle: "subtitle",
    icon: WarningCircleIcon,
    action: "modal",
    iconProps: {
      size: 24,
      variant: "help",
      color: "var(--icon-gray-subtle)",
    },
  },
];

const SECTION_3: SidebarItem[] = [
  {
    tab: "privacy",
    title: "tncAndSocial",
    subtitle: "subtitle",
    icon: ListIcon,
    iconProps: {
      size: 24,
      variant: "person",
      color: "var(--color-surface-gray-subtle)",
    },
  },
];

const SPACE_Y = "space-y-3";

/* ----------------------------- Component ----------------------------- */

type Props = {
  activeTab?: Tab | null;
  onTabChange: (tab: Tab) => void;
};

export default function SettingsSidebarNav({ activeTab, onTabChange }: Props) {
  const openModal = useModalStore((s) => s.open);
  const profileMenu = useTranslations("profileMenu");

  const handleClick = useCallback(
    async (item: SidebarItem) => {
      await trackEvent("Profile Option Clicked", {
        option_selected: item.title,
      });

      if (item.action === "modal") {
        openModal(item.tab);
      } else {
        onTabChange(item.tab);
      }
    },
    [onTabChange, openModal]
  );

  const renderItems = (items: SidebarItem[]) =>
    items.map((item) => {
      const isActive = activeTab === item.tab;
      const Icon = item.icon;

      return (
        <div
          key={item.tab}
          onClick={() => handleClick(item)}
          className={`p-2 rounded-[4px] cursor-pointer transition
            ${isActive ? "bg-[#006bd1]/9" : "hover:bg-[#006bd1]/9"}`}
        >
          <ProfileItemList
            icon={
              <Icon
                {...item.iconProps}
                variant={item.iconProps?.variant}
                color={item.iconProps?.color}
              />
            }
            title={profileMenu(`${item.title}.title`)}
            subtitle={profileMenu(`${item.title}.subtitle`)}
            titleClass="body-large !font-semibold"
            showEditIcon
          />
        </div>
      );
    });

  return (
    <div className={clsx("p-3", SPACE_Y)}>
      {renderItems(SECTION_1)}

      <div className={clsx("block md:hidden", SPACE_Y)}>
        <div className="w-full h-0.5 bg-[var(--border-gray-subtle)]" />
        {renderItems(SECTION_2)}
        <div className="w-full h-0.5 bg-[var(--border-gray-subtle)]" />
      </div>

      <div className={clsx("block md:hidden", SPACE_Y)}>
        {renderItems(SECTION_3)}
        <div className="w-full h-0.5 bg-[var(--border-gray-subtle)]" />
      </div>
    </div>
  );
}
