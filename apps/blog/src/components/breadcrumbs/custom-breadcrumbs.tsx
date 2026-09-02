"use client";

import React from "react";
import PageBreadcrumbs, { PageBreadcrumbItem } from "@clearcut/ui/page-breadcrumbs";

interface CustomBreadcrumbsProps {
  items: PageBreadcrumbItem[];
  highlightClass?: string;
  isShow?: boolean;
  padding?: string;
}

// Thin wrapper — kept so this app's ~10 existing call sites (page.tsx files
// under [locale]/(blog)/…) don't need to change import path or the `isShow`
// prop they all pass. The breadcrumb design itself now lives in
// @clearcut/ui/page-breadcrumbs so every app renders the identical trail;
// `isShow` is blog-specific gating that predates the shared component and
// has no equivalent there.
const CustomBreadcrumbs: React.FC<CustomBreadcrumbsProps> = ({ items, highlightClass, isShow = false, padding }) => {
  if (!isShow) return null;
  return <PageBreadcrumbs items={items} highlightClass={highlightClass} padding={padding} />;
};

export default CustomBreadcrumbs;
