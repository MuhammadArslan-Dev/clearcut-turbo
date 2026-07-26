"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

/**
 * Shared Skeleton — a 1:1 replacement for `@mui/joy/Skeleton` as it is actually
 * used in this monorepo. Every value below was transcribed from the CSS a live
 * Joy Skeleton emits, not guessed.
 *
 * ─── Why not Tailwind's `animate-pulse` ─────────────────────────────────────
 * Joy's pulse differs on three axes, so `animate-pulse` would be an
 * approximation (measured from @mui/joy/Skeleton/Skeleton.js):
 *   Joy      50% {opacity:.8; background:<pulse-bg>}  2s ease-in-out 0.5s
 *   Tailwind 50% {opacity:.5}                         2s cubic-bezier(.4,0,.6,1)
 * The real keyframes live in @clearcut/design-tokens as `cc-skeleton-pulse` —
 * defined once per document rather than once per Skeleton instance.
 *
 * ─── Why the ::before pseudo-element ────────────────────────────────────────
 * Joy renders a <span> plus a `::before` that carries the fill and animation.
 * That indirection is load-bearing, not decorative:
 *   • text        — `::before` stays IN FLOW at `height:1em` while the root
 *     carries em-derived asymmetric padding. That is what gives a text skeleton
 *     its height, and why call sites tune size via `sx={{ fontSize }}`.
 *     Measured: fontSize .75rem -> 3.36px top + 12px + 2.64px bottom = 18px.
 *   • rect/circ   — `::before` is `position:absolute` and fills the box, so the
 *     root's own width/height define the size.
 * Reproducing that split is the only way to avoid layout shift.
 *
 * ─── Deliberately NOT implemented ───────────────────────────────────────────
 * Joy's `inline` variant, `wave` animation, `level`, `overlay`, and child
 * masking (`color:transparent` + `& * {visibility:hidden}`). The audit found
 * ZERO usages of any of them: all 69 call sites are self-closing and use only
 * text/rectangular/circular with the default pulse. Adding them would be
 * inventing API. `color: transparent` IS kept, since it is on Joy's base rule.
 */

const skeletonVariants = cva(
  // Joy base rule: display/position/overflow/cursor/color + the ::before fill.
  // `before:inset-0` == Joy's top/bottom/left/right:0. z-index 9 is Joy's
  // --unstable_pseudo-zIndex. rounded-[inherit] mirrors border-radius:inherit.
  // content is a single space (Tailwind writes `_` as a space) to match Joy's
  // `content: " "` exactly rather than an empty string.
  "relative block overflow-hidden cursor-default text-transparent " +
    "before:content-['_'] before:block before:inset-0 before:z-[9] " +
    "before:rounded-[inherit] before:bg-[var(--color-skeleton)] " +
    "before:animate-[cc-skeleton-pulse_2s_ease-in-out_0.5s_infinite]",
  {
    variants: {
      variant: {
        // border-radius: min(0.15em, 6px) is font-size dependent — kept literal.
        // text-base/leading-normal == Joy's --joy-fontSize-md 1rem /
        // --joy-lineHeight-md 1.5, which drive the em-based padding below.
        // `before:h-[1rem]`, not `1em`: Joy applies its typography block to the
        // ::before too, so the pseudo-element keeps font-size 1rem even when a
        // call site overrides the ROOT's font-size via sx={{fontSize}}. Joy's
        // `height: 1em` therefore always resolves against 1rem — measured on Joy
        // at fontSize .75rem: ::before height 16px (not 12px), while the root's
        // em-based padding DOES scale (3.36px / 2.64px). Expressing it as `1rem`
        // reproduces that exactly and is immune to the parent font-size cascade,
        // which `1em` + a `before:text-base` override was not.
        text:
          "rounded-[min(0.15em,6px)] bg-transparent w-full text-base leading-normal " +
          "pt-[calc((1.5-1)*0.56em)] pb-[calc((1.5-1)*0.44em)] before:h-[1rem]",
        rectangular: "rounded-[min(0.15em,6px)] h-auto w-full before:absolute",
        circular: "rounded-[50%] w-full h-full before:absolute",
      },
    },
    defaultVariants: {
      // Joy's own default variant is `text`.
      variant: "text",
    },
  },
);

export interface SkeletonProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children">,
    VariantProps<typeof skeletonVariants> {
  /** Number → px (React adds the unit), string passed through — same as Joy. */
  width?: number | string;
  height?: number | string;
  /** Joy call sites set this via `sx={{ borderRadius }}`. Numeric → px, which is
   *  exactly what MUI did (verified: sx borderRadius 999 -> `999px`). */
  borderRadius?: number | string;
}

const Skeleton = React.forwardRef<HTMLSpanElement, SkeletonProps>(function Skeleton(
  { variant, width, height, borderRadius, className, style, ...rest },
  ref,
) {
  // Inline style is applied last, mirroring Joy: there the `width`/`height`
  // props and the `sx` borderRadius are appended after the variant's own rules
  // and therefore win. Inline style beats a class, so precedence matches.
  const inlineStyle: React.CSSProperties = {
    ...(width !== undefined && { width }),
    ...(height !== undefined && { height }),
    ...(borderRadius !== undefined && { borderRadius }),
    ...style,
  };

  return (
    <span
      ref={ref}
      data-slot="skeleton"
      className={cn(skeletonVariants({ variant }), className)}
      style={inlineStyle}
      {...rest}
    />
  );
});

Skeleton.displayName = "Skeleton";

export { Skeleton, skeletonVariants };
export default Skeleton;
