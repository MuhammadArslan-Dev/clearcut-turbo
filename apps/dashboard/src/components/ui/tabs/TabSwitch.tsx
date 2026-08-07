"use client";

import React, { useRef } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useScrollOnUserAction } from "@/components/features/preparation/hooks/useScrollOnUserAction";
import { Link, usePathname } from "@/i18n/navigation";

/* ======================================================
 * Types
 * =====================================================*/

export interface TabItem {
  id: string;
  label: string | React.ReactNode;
  href?: string;
  match?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

interface TabSwitchProps {
  type?: "button" | "link";
  items: TabItem[];
  value?: string | null;
  layoutScopeId: string;
  onChange?: (id: string) => void;

  variant?: "pill" | "underline";
  size?: "sm" | "md" | "lg";
  scrollable?: boolean;

  /* 🎛️ Design Controls */
  tabFontSize?: string;
  tabFontWeight?: string;
  activeTabFontWeight?: string;

  tabBg?: string;
  activeTabBg?: string;
  containerBg?: string;

  activeTextColor?: string;
  inactiveTextColor?: string;
  underlineColor?: string;

  tabPaddingX?: string;
  tabPaddingY?: string;
  tabRadius?: string;
  containerRadius?: string;

  className?: string;
}

/* ======================================================
 * Helpers
 * =====================================================*/

const sizeStyles = {
  sm: "text-sm min-h-8",
  md: "text-sm min-h-9",
  lg: "text-sm min-h-12",
};

/** Industry-standard active route matcher */
/** 🔥 Segment-based active matcher (recommended) */
function isActiveRoute(pathname: string, href?: string) {
  if (!href) return false;

  const pathSegments = pathname.split("/").filter(Boolean);
  const hrefSegments = href.split("/").filter(Boolean);

  return pathSegments.some((seg) => hrefSegments.includes(seg));
}

/* ======================================================
 * Component
 * =====================================================*/

const TabSwitch: React.FC<TabSwitchProps> = ({
  type = "button",
  items,
  value = null,
  onChange,
  variant = "pill",
  size = "md",
  scrollable = false,
  layoutScopeId = "default",

  /* 🎛️ Design defaults */
  tabFontSize = "body-small",
  tabFontWeight = "font-medium",
  activeTabFontWeight = "font-semibold",

  tabBg = "bg-transparent",
  activeTabBg = "bg-blue-500",
  containerBg = "bg-blue-100",

  activeTextColor = "text-white",
  inactiveTextColor = "text-gray-500",
  underlineColor = "bg-blue-600",

  tabPaddingX = "px-4",
  tabPaddingY = "py-1.5",
  containerRadius,
  tabRadius = "rounded-full",

  className,
}) => {
  const pathname = usePathname();

  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const { markUserAction } = useScrollOnUserAction({
    activeId: value ?? "",
    refs: tabRefs,
    containerRef,
    enabled: scrollable,
    getIndex: (id) => items.findIndex((i) => i.id === id),
  });

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-orientation="horizontal"
      className={clsx(
        "relative flex",
        scrollable && "overflow-x-auto scrollbar-hide",
        variant === "pill" &&
          clsx(
            "p-[3px]",
            containerBg,
            containerRadius ? containerRadius : tabRadius,
          ),
        variant === "underline" && "border-none",
        sizeStyles[size],
        className,
      )}
    >
      {items.map((item, index) => {
        /* 🔥 ACTIVE LOGIC */

        const isActive =
          type === "link"
            ? isActiveRoute(pathname, item.match)
            : item.id === value;

        /* ======================================================
         * BUTTON MODE
         * =====================================================*/

        if (type === "button") {
          return (
            <button
              key={item.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => {
                markUserAction();
                onChange?.(item.id);
              }}
              className={clsx(
                "relative flex cursor-pointer items-center justify-center gap-2 transition-colors",
                tabFontSize,
                isActive ? activeTabFontWeight : tabFontWeight,
                scrollable ? "flex-none" : "flex-1",
                tabPaddingX,
                tabPaddingY,
                isActive ? activeTextColor : inactiveTextColor,
                isActive ? activeTabBg : tabBg,
                tabRadius
              )}
            >
              {/* Active pill */}
              {/* {isActive && variant === "pill" && (
                <motion.span
                  layoutId={`tab-indicator-pill-${layoutScopeId}`}
                  className={clsx("absolute inset-0", tabRadius, activeTabBg)}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                />
              )} */}

              {/* Active underline */}
              {/* {isActive && variant === "underline" && (
                <motion.span
                  layoutId={`tab-indicator-underline-${layoutScopeId}`}
                  className={clsx(
                    "absolute bottom-0 left-0 right-0 h-1",
                    underlineColor,
                  )}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  }}
                />
              )} */}

              <span className="relative flex items-center gap-2">
                {(item.iconPosition ?? "left") === "left" && item.icon}
                {item.label}
                {item.iconPosition === "right" && item.icon}
              </span>
            </button>
          );
        }

        /* ======================================================
         * LINK MODE (ROUTE-DRIVEN)
         * =====================================================*/

        return (
          <Link
            key={item.id}
            href={item.href ?? "#"}
            prefetch={true}
            className={clsx(
              "relative flex items-center justify-center gap-2 transition-colors",
              tabFontSize,
              isActive ? activeTabFontWeight : tabFontWeight,
              scrollable ? "flex-none" : "flex-1",
              tabPaddingX,
              tabPaddingY,
              isActive ? activeTextColor : inactiveTextColor,
              tabBg,
            )}
          >
            {/* Active pill */}
            {isActive && variant === "pill" && (
              <motion.span
                layoutId={`tab-indicator-pill-${layoutScopeId}`}
                className={clsx("absolute inset-0", tabRadius, activeTabBg)}
              />
            )}

            {/* Active underline */}
            {isActive && variant === "underline" && (
              <motion.span
                layoutId={`tab-indicator-underline-${layoutScopeId}`}
                className={clsx(
                  "absolute bottom-0 left-0 right-0 h-1",
                  underlineColor,
                )}
              />
            )}

            <span className="relative flex items-center gap-2">
              {(item.iconPosition ?? "left") === "left" && item.icon}
              {item.label}
              {item.iconPosition === "right" && item.icon}
            </span>
          </Link>
        );
      })}
    </div>
  );
};

export default TabSwitch;
