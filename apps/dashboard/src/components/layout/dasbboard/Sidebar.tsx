"use client";

import React, { ComponentType, memo, useCallback } from "react";
import clsx from "clsx";
import { Link, usePathname } from "@/i18n/navigation";
import { mainNav, IconProps } from "@/config/navigation";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { LogoutDoorIcon, MainAppLogo } from "@/components/ui/icons";
import { trackEvent } from "@/lib/analytics/browser";
import { useAuth } from "@/providers/AuthProvider";

/* ----------------------------- Motion Config ----------------------------- */

const ACTIVE_TAB_TRANSITION = {
  type: "spring",
  stiffness: 300,
  damping: 26,
} as const;

/* ----------------------------- Sidebar Item ----------------------------- */

type SidebarItemProps = {
  item: (typeof mainNav)[number];
  isActive: boolean;
  label: string;
};

const SidebarItem = memo(function SidebarItem({
  item,
  isActive,
  label,
}: SidebarItemProps) {
  const Icon = item.icon as ComponentType<IconProps>;

  const handleClick = useCallback(() => {
    queueMicrotask(() => {
      trackEvent("Primary Nav Clicked", {
        tab_name: item.label!,
      });
    });
  }, [item.label]);

  return (
    <button type="button" onClick={handleClick} className="relative w-full">
      {isActive && (
        <motion.div
          layoutId="nav-active=web"
          className="absolute inset-0 rounded-sm bg-brand/9"
          transition={ACTIVE_TAB_TRANSITION}
        />
      )}

      <Link
        href={item.href}
        prefetch
        className={clsx(
          "flex gap-4 relative items-center z-10 rounded-sm p-3 text-sm font-medium transition-colors",
          isActive
            ? "bg-brand/9 text-brand"
            : "hover:bg-slate-100 text-surface-gray-subtle"
        )}
      >
        <Icon
          size={24}
          variant={isActive ? "filled" : "outline"}
          color={
            isActive ? "var(--color-brand)" : "var(--color-surface-gray-subtle)"
          }
        />

        <p
          className={clsx(
            "hidden 2lg:block",
            isActive ? "body-large !font-semibold" : "body-large !font-normal"
          )}
        >
          {label}
        </p>
      </Link>
    </button>
  );
});

/* ----------------------------- Sidebar ----------------------------- */

const Sidebar = memo(function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("Sidebar");
  const logoutT = useTranslations("actions");
  const { logout } = useAuth();

  return (
    <aside className="hidden md:flex h-screen md:w-[100px] 2lg:w-[var(--dashboard-sidebar-width)] flex-col p-3">
      <div className="h-full bg-white rounded-md">
        {/* Logo */}
        <div className="flex justify-center pt-2 pb-1 items-center border-b-3 border-[var(--surface-border-gray-subtle)] px-4">
          <span className="hidden cursor-pointer 2lg:block">
            <MainAppLogo width={180} height={55} />
          </span>
          <span className="block py-2 cursor-pointer 2lg:hidden">
            <MainAppLogo variant="icon" width={30} />
          </span>
        </div>

        {/* Navigation */}
        <nav className="h-[calc(100%-120px)] flex-1 space-y-3 px-4 py-4 overflow-y-auto">
          {mainNav.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <SidebarItem
                key={item.href}
                item={item}
                isActive={isActive}
                label={t(item.key)}
              />
            );
          })}
        </nav>

        {/* Footer */}
        <div className="flex items-center justify-between border-t-2 border-[var(--surface-border-gray-subtle)] px-4 py-3">
          <div
            onClick={() => logout()}
            className="flex w-full cursor-pointer items-center justify-center gap-2 body-large !font-normal text-surface-gray-normal 2lg:w-auto"
          >
            <LogoutDoorIcon />
            <p className="hidden 2lg:block">{logoutT("logout")}</p>
          </div>

          <p className="hidden 2lg:block body-xsmall !font-normal text-surface-gray-subtle">
            Build V 1.0 (1)
          </p>
        </div>
      </div>
    </aside>
  );
});

export default Sidebar;
