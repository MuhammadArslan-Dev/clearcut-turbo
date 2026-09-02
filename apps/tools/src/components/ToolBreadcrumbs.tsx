"use client";

import Link from "next/link";
import PageBreadcrumbs, { PageBreadcrumbItem } from "@clearcut/ui/page-breadcrumbs";

/**
 * Thin client wrapper around the shared PageBreadcrumbs, binding in
 * next/link — required because this app has a basePath ("/tools/resizer"),
 * and PageBreadcrumbs' plain-`<a>` fallback doesn't carry that prefix, so
 * crumb links 404'd on clearcutoff.in/{slug} instead of
 * clearcutoff.in/tools/resizer/{slug}.
 *
 * This has to be its own "use client" file rather than passing
 * `LinkComponent={Link}` straight from ResizerSpokePage/CategoryPage/
 * ToolLandingPage: those are Server Components, and a function prop
 * (LinkComponent) isn't serializable across the server→client boundary —
 * React throws "Functions cannot be passed directly to Client Components"
 * the moment a Server Component tries it. Routing the `next/link` import
 * through a small Client Component instead means the server pages only ever
 * pass plain serializable `items` data across that boundary.
 */
export default function ToolBreadcrumbs({ items }: { items: PageBreadcrumbItem[] }) {
  return <PageBreadcrumbs items={items} padding="0" LinkComponent={Link} />;
}
