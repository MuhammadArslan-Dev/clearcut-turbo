"use client";

import * as React from "react";
import type { ComponentType, ReactNode } from "react";
import Breadcrumbs from "./breadcrumbs";
import Link from "./link";
import Text from "./text";
import HomeIcon from "./icons/HomeIcon";

export interface PageBreadcrumbItem {
  name: string;
  url?: string;
}

export interface PageBreadcrumbsProps {
  items: PageBreadcrumbItem[];
  /** Class for the current (last) crumb's highlighted chip. */
  highlightClass?: string;
  padding?: string;
  /**
   * Routing-aware Link the consuming app already has (e.g. next/link for an
   * app with a `basePath`, or a locale-aware Link for one with next-intl
   * routing). Without this, crumb hrefs render as plain `<a>` tags, which
   * silently drop any basePath/locale prefix the app's real router would
   * have added — exactly the bug this prop exists to prevent (apps/tools'
   * breadcrumb links 404'd by landing on clearcutoff.in/{slug} instead of
   * clearcutoff.in/tools/resizer/{slug} before this was wired up). Omit only
   * for an app whose routes truly have no prefix to lose.
   */
  LinkComponent?: ComponentType<{
    href: string;
    className?: string;
    "aria-label"?: string;
    children?: ReactNode;
  }>;
}

/**
 * The "current page as a highlighted chip" breadcrumb trail — originally
 * apps/blog/src/components/breadcrumbs/custom-breadcrumbs.tsx (the version
 * actually rendered on every blog content page; main-breadcrumbs.tsx is an
 * unused sibling), lifted here so every app gets the same breadcrumb design
 * instead of reimplementing it. Earlier crumbs render as plain links — Home
 * renders icon-only — and the last one renders as a highlighted,
 * non-interactive chip instead of a link, since it's the current page.
 *
 * `highlightClass`'s default uses `--color-background-gray-subtle` /
 * `--color-brand-accessible` rather than blog's original literal hex
 * (#F1F5FA / #0060BD): those two tokens were chosen for exactly this pairing
 * — see their comments in tokens.css — and resolve to #f1f5fa / #0069cc,
 * imperceptibly different from the originals but token-based, which is what
 * keeps this component out of the hardcoded-colour guard everywhere it's used.
 */
export default function PageBreadcrumbs({
  items,
  highlightClass = "bg-[var(--color-background-gray-subtle)] py-0.5 px-3 capitalize rounded-lg text-[var(--color-brand-accessible)] body-medium !font-semibold",
  padding = "10px",
  LinkComponent,
}: PageBreadcrumbsProps) {
  if (!items || items.length < 2) return null;

  return (
    <Breadcrumbs aria-label="breadcrumbs" style={{ padding }}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const label =
          item.name === "Home" ? <HomeIcon size={16} /> : item.name.charAt(0).toUpperCase() + item.name.slice(1);

        if (isLast) {
          return (
            <Text key={index} as="span" className={highlightClass}>
              {item.name}
            </Text>
          );
        }

        if (LinkComponent) {
          return (
            <Link key={index} color="primary" asChild>
              <LinkComponent href={item.url || "#"} aria-label={item.name}>
                {label}
              </LinkComponent>
            </Link>
          );
        }

        return (
          <Link key={index} color="primary" href={item.url || "#"} aria-label={item.name}>
            {label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}
