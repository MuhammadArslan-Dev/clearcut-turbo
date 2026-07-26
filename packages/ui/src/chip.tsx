"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

/**
 * Shared Chip — a structural replacement for `@mui/joy/Chip` as it is actually
 * used in this monorepo. Every number below was read off a live Joy Chip with
 * getComputedStyle in both apps (they agreed), not taken from Joy's source.
 *
 * ─── Measured Joy metrics ───────────────────────────────────────────────────
 *   size  padding-inline  min-height  radius  gap   font-size  line-height
 *   sm    6px             20px        24px    3px   12px       18px (=1.5)
 *   md    8px             24px        24px    4px   14px       21px (=1.5)
 *   lg    12px            28px        24px    6px   16px       24px (=1.5)
 *
 * line-height is expressed as the ratio 1.5 rather than absolute px because
 * that is Joy's actual model: all three sizes measured at exactly 1.5x their
 * font-size, so a consumer className that changes font-size scales the leading
 * with it. Hardcoding 21px would silently decouple the two.
 * plus, on every size: inline-flex, align-items/justify-content center,
 * white-space nowrap, vertical-align middle, position relative, box-sizing
 * border-box, max-width max-content, padding-block 0, font-weight 500.
 *
 * ─── Deliberately NOT implemented ───────────────────────────────────────────
 * `color`, `variant`, `startDecorator`, `endDecorator`, `disabled`, and Joy's
 * `clickable` action-button overlay. The audit found that every call site this
 * component replaces supplies its own background and text colour (via className
 * or inline style) and passes no decorator and no onClick — so shipping a
 * colour/variant matrix here would be inventing API, and would also mean baking
 * Joy's palette into the design system. Colour stays a call-site concern.
 *
 * The one call site that DOES use `variant`/`color`/`startDecorator`/`onClick`
 * (apps/blog free-badge.tsx) is intentionally NOT migrated — see the ticket
 * report; reproducing Joy's success/outlined palette needs a design decision.
 *
 * ─── Why the label is wrapped in its own span ───────────────────────────────
 * Joy renders children inside `.MuiChip-label`, measured as a flex item with
 * `overflow: hidden` and `white-space: nowrap`. That wrapper is load-bearing
 * for how long labels clip, so it is reproduced rather than flattened.
 */
const chipVariants = cva(
  "relative inline-flex items-center justify-center box-border max-w-max " +
    "whitespace-nowrap align-middle no-underline py-0 rounded-[24px] font-medium",
  {
    variants: {
      size: {
        sm: "min-h-[20px] px-[6px] gap-[3px] text-[12px] leading-[1.5]",
        md: "min-h-[24px] px-[8px] gap-[4px] text-[14px] leading-[1.5]",
        lg: "min-h-[28px] px-[12px] gap-[6px] text-[16px] leading-[1.5]",
      },
    },
    defaultVariants: {
      // Joy's own default size is "md".
      size: "md",
    },
  },
);

export type ChipSize = NonNullable<VariantProps<typeof chipVariants>["size"]>;

export interface ChipProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof chipVariants> {
  /** Class applied to the inner label span, mirroring Joy's `slotProps.label`. */
  labelClassName?: string;
}

function Chip({ children, size, className, labelClassName, ...rest }: ChipProps) {
  return (
    <div data-slot="chip" className={cn(chipVariants({ size }), className)} {...rest}>
      <span data-slot="chip-label" className={cn("overflow-hidden whitespace-nowrap", labelClassName)}>
        {children}
      </span>
    </div>
  );
}

export { Chip, chipVariants };
export default Chip;
