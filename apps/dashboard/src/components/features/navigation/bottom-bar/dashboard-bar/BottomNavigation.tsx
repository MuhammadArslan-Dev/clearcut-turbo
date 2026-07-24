"use client";

import React, { ComponentType, memo } from "react";
import { Link } from "@/i18n/navigation";
import clsx from "clsx";
import { motion, AnimatePresence, Transition } from "framer-motion";
import { IconProps, NavItem } from "@/config/navigation";
import { useTranslations } from "next-intl";

/* ----------------------------- Motion Config ----------------------------- */

const ACTIVE_BG_ANIMATION: {
  initial: { scale: number; opacity: number };
  animate: { scale: number; opacity: number };
  exit: { scale: number; opacity: number };
  transition: Transition;
} = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0, opacity: 0 },
  transition: {
    type: "spring",
    stiffness: 300,
    damping: 25,
  },
};

const ICON_SCALE_ANIMATION = {
  active: { scale: [1, 1.3, 1] },
  inactive: { scale: 1 },
};

/* ----------------------------- Item Component ----------------------------- */

interface NavItemProps {
  item: NavItem;
  label: string;
  isActive: boolean;
}

const BottomNavItem = memo(function BottomNavItem({
  item,
  isActive,
  label,
}: NavItemProps) {
  const Icon = item.icon as ComponentType<IconProps>;

  return (
    <Link
      href={item.href}
      prefetch
      aria-current={isActive ? "page" : undefined}
    >
      <motion.div
        key="icon"
        whileTap={{ scale: 0.95 }}
        className="flex flex-col items-center px-4"
      >
        {/* Icon Container */}
        <div className="relative w-16 h-7 flex items-center justify-center">
          {/* Active Background */}
          <AnimatePresence>
            {isActive && (
              <motion.div
                key="bg"
                {...ACTIVE_BG_ANIMATION}
                className="absolute inset-0 rounded-full bg-blue-100"
              />
            )}
          </AnimatePresence>

          {/* Icon */}
          <motion.span
            className={clsx(
              "relative z-10 flex items-center justify-center",
              isActive ? "text-blue-600" : "text-gray-500"
            )}
            animate={
              isActive
                ? ICON_SCALE_ANIMATION.active
                : ICON_SCALE_ANIMATION.inactive
            }
            transition={{ duration: 0.4, ease: "easeOut" }}
            whileTap={{ scale: 0.9 }}
          >
            <Icon
              variant={isActive ? "filled" : "outline"}
              size={24}
              color={
                isActive ? "var(--color-brand)" : "var(--icon-gray-subtle)"
              }
            />
          </motion.span>
        </div>

        {/* Label */}
        <span
          className={clsx(
            "body-small",
            isActive
              ? "text-brand !font-semibold"
              : "text-surface-gray-subtle !font-normal"
          )}
        >
          {label}
        </span>
      </motion.div>
    </Link>
  );
});

/* ----------------------------- Navigation ----------------------------- */

interface BottomNavigationProps {
  items: NavItem[];
  value: string;
}

const BottomNavigation = memo(function BottomNavigation({
  items,
  value,
}: BottomNavigationProps) {
  const t = useTranslations("Sidebar");

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-gray-200">
      <div className="flex items-center justify-around py-2">
        {items.map((item) => (
          <BottomNavItem
            key={item.key}
            item={item}
            label={t(item.key)}
            isActive={item.key === value}
          />
        ))}
      </div>
    </nav>
  );
});

export default BottomNavigation;

/* ----------------------------- Export ----------------------------- */
