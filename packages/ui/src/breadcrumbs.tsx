"use client";

import * as React from "react";
import { cn } from "./utils";

/**
 * Shared Breadcrumbs — replaces `@mui/joy/Breadcrumbs`.
 *
 * The DOM shape and metrics below were read off a live Joy Breadcrumbs, not
 * copied from Joy's source:
 *
 *   <nav aria-label="breadcrumbs">        display block, gap 6px, 16px/24px
 *     <ol>                                display flex, align-items center,
 *                                         flex-wrap wrap, list-style none,
 *                                         margin 0, padding 0, gap 6px
 *       <li class="…-li">                 display flex, align-items center, m0 p0
 *       <li class="…-separator"           display flex, m0 p0, user-select none,
 *           aria-hidden="true">"/"        content "/", ~5.6px wide
 *
 * The separator is the load-bearing accessibility detail: Joy emits it as an
 * `aria-hidden` list item so screen readers announce the trail without reading
 * "slash" between every crumb. That is reproduced exactly.
 *
 * `flex-wrap: wrap` is also preserved — it is what stops long trails from
 * overflowing on narrow viewports, i.e. the responsive behaviour.
 *
 * ─── Deliberately NOT implemented ───────────────────────────────────────────
 * Joy's `size`, `separator` as a themeable slot, `slotProps`, and collapsing
 * with an ellipsis. The two call sites pass only `aria-label` and a padding
 * override, so anything else would be invented API. Padding arrives via the
 * standard `style`/`className` props rather than a Joy-style `sx`.
 */
export interface BreadcrumbsProps extends React.ComponentProps<"nav"> {
  /** Rendered between items inside an aria-hidden <li>. Joy's default is "/". */
  separator?: React.ReactNode;
  children?: React.ReactNode;
}

function Breadcrumbs({ separator = "/", children, className, ...props }: BreadcrumbsProps) {
  // Only real children become crumbs — a falsy branch (`cond && <Link/>`) must
  // not produce a stray separator.
  const items = React.Children.toArray(children).filter(Boolean);

  return (
    <nav
      data-slot="breadcrumbs"
      className={cn("block text-[16px] leading-[24px]", className)}
      {...props}
    >
      <ol className="m-0 flex list-none flex-wrap items-center gap-[6px] p-0">
        {items.map((child, i) => (
          <React.Fragment key={i}>
            <li data-slot="breadcrumb-item" className="m-0 flex items-center p-0">
              {child}
            </li>
            {i < items.length - 1 && (
              <li
                aria-hidden="true"
                data-slot="breadcrumb-separator"
                className="m-0 flex select-none p-0"
              >
                {separator}
              </li>
            )}
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
}

export { Breadcrumbs };
export default Breadcrumbs;
