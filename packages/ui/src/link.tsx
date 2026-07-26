"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "./utils";

/**
 * Shared Link — replaces `@mui/joy/Link` as it is actually used in this
 * monorepo (the breadcrumb trails in apps/blog).
 *
 * ─── Measured Joy behaviour that IS preserved ───────────────────────────────
 * Read off a live Joy Link inside <Breadcrumbs>:
 *   display flex, align-items center, font 16px/24px w400, cursor pointer,
 *   text-decoration none by default, underline on hover (MuiLink-underlineHover)
 * The underline-on-hover affordance is interaction, not decoration, so it is
 * reproduced exactly.
 *
 * ─── Styling that intentionally DIFFERS ─────────────────────────────────────
 * Joy painted `color="primary"` as its own palette blue rgb(11,107,203) and
 * relied on an invisible focus ring (outline-width measured 0px). Per the
 * approved architecture the Design System wins on styling, so colours come from
 * design tokens and a real focus-visible ring is applied:
 *   primary -> --color-brand-accessible (#0069cc, 5.39:1 on white — the token
 *              that exists specifically for brand blue used as TEXT, where WCAG
 *              AA contrast applies)
 *   neutral -> --color-text-gray-subtle
 *
 * ─── Deliberately NOT implemented ───────────────────────────────────────────
 * Joy's `level`, `underline`, `variant`, `startDecorator`/`endDecorator`,
 * `disabled`, and the `component` prop. The audit found the call sites use only
 * `color` (primary | neutral), `href`, `aria-label`, and — in one place — routing
 * through next/link, which `asChild` covers without a Joy-style `component` prop.
 */
const linkVariants = cva(
  "inline-flex items-center cursor-pointer no-underline hover:underline " +
    "rounded-[2px] outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
  {
    variants: {
      color: {
        primary: "text-[var(--color-brand-accessible)]",
        neutral: "text-[var(--color-text-gray-subtle)]",
      },
    },
    defaultVariants: { color: "primary" },
  },
);

export interface LinkProps
  extends Omit<React.ComponentProps<"a">, "color">,
    VariantProps<typeof linkVariants> {
  /** Render the child element instead of an <a> — used to compose next/link. */
  asChild?: boolean;
}

function Link({ className, color, asChild = false, ...props }: LinkProps) {
  const Comp = asChild ? Slot.Root : "a";
  return <Comp data-slot="link" className={cn(linkVariants({ color }), className)} {...props} />;
}

export { Link, linkVariants };
export default Link;
