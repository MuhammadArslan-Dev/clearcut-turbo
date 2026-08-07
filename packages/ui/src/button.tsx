"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "./utils";

// Color × variant matrix ported 1:1 (same hex values) from the original
// hand-rolled Button, so every existing call site renders identically.
// The leading `group` marker is inert on its own — it only activates the
// opt-in `group-hover:*` icon-animation classes below; default rendering
// (iconAnimation="none") is unchanged.
//
// `gap-1` (4px), not gap-2. This is the spacing between a decorator
// (startDecorator/endDecorator/leftIcon/rightIcon) and the label. Measured on the
// production Dashboard's course-card "Edit" button: 4px between the label and its
// gear icon, giving a total button width of 66.22px against 70.22px here.
// It also matches the label wrapper's own inner `gap-1` below, so a decorator and
// an icon passed inside `children` now sit at the same distance from the text
// instead of two different ones.
//
// The `leading-[1.5]` on every size class is deliberate and load-bearing.
// Tailwind's `text-*` utilities each carry their OWN line-height (text-xs → 16px,
// text-sm → 20px, text-xl → 28px), i.e. a different ratio per size: 1.333, 1.428,
// 1.4. The product's buttons use a single 1.5 ratio at every size — measured on
// the production Dashboard, where every button reports line-height 21px at
// font-size 14px (= 1.5) against 20px here, which is what made outlined buttons
// render 38.1px tall locally vs 40.7px in production.
//
// Two placements were tried first and BOTH failed silently — keep this one:
//
//   1. `leading-[1.5]` on the base string. tailwind-merge lists `leading` as a
//      conflicting group of `font-size`, and it resolves right-to-left, so a
//      base-level `leading-*` is dropped by cn() the moment the later `text-*`
//      size class appears. The class never reached the DOM; line-height stayed
//      20px. No build error.
//   2. The `text-sm/[1.5]` shorthand. tailwind-merge keeps it (one font-size
//      class), but Tailwind generated NO rule for it at all — so the element got
//      neither font-size nor line-height and inherited 16px/24px, which is worse
//      than the original divergence. Also no build error.
//
// Writing `leading-*` AFTER `text-*` inside the same size string works because
// tailwind-merge only removes conflicting classes that appear to the LEFT of the
// winner. Consequence to know about: a call site passing its own `text-lg` in
// className will strip this and fall back to Tailwind's ratio for that size —
// pass `leading-[1.5]` alongside it if the 1.5 ratio still matters there.
const buttonVariants = cva(
  "group relative overflow-hidden inline-flex items-center justify-center gap-1 rounded-lg font-semibold whitespace-nowrap cursor-pointer select-none outline-none transition-[opacity,filter] duration-150 active:brightness-90 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        solid: "",
        // border-2, not border: the product's outlined buttons are 2px. Measured
        // on the production Dashboard — the outlined pills ("Start Today's
        // Goals", "Complete next milestone", "Open Notes and Papers") all
        // compute a 2px border, while this variant was emitting 1px.
        outlined: "border-2 bg-transparent",
        soft: "",
        plain: "bg-transparent",
      },
      color: {
        primary: "",
        danger: "",
        success: "",
        gray: "",
        neutral: "",
        warning: "",
      },
      size: {
        xs: "min-h-7 text-xs leading-[1.5] px-2 py-0.5",
        sm: "min-h-8 text-sm leading-[1.5] px-3 py-1",
        md: "min-h-9 text-sm leading-[1.5] px-4 py-1.5",
        // 44px floor, not min-h-10 (40px) — measured on the production "Save and
        // Continue Learning" button in the exam-settings modal, which reports
        // min-height: 44px / height 44px against 42px here. Everything else about
        // the two was already identical (padding 13/24, line-height 24, same
        // 242.8x16 content), so the 40px floor was the whole 2px gap: it sat
        // BELOW the content height, letting content win at 42px, where
        // production's 44px floor still governs.
        //
        // Written as min-h-[44px] because `min-h-11` generates NOTHING here —
        // this repo's spacing scale has no 11 rung, so the class reached the DOM
        // and min-height silently computed 0, which is worse than the 40px it
        // replaced. `min-h-7/8/9/10` on the other sizes do exist; 11 does not.
        lg: "min-h-[44px] text-base leading-[1.5] px-6 py-2",
        xl: "text-xl leading-[1.5] px-8 py-2",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    compoundVariants: [
      // --color-brand-accessible, not --color-brand: white text on #0083ff is
      // 3.69:1, below WCAG AA. This was the only remaining `color-contrast`
      // failure on the blog exam/level/year pages ("Start for FREE").
      // Hover backgrounds follow the product's own model, measured on the
      // production Dashboard (see the note above the size variants for why the
      // resting values were already right but hover was missing entirely):
      //
      //   solid    -> one shade darker (the ramp's 600 rung)
      //   outlined ->  9% tint of the border colour
      //   soft     -> 20% tint (up from the 12% resting fill)
      //   plain    ->  8% tint
      //
      // Before this, `outlined` and `plain` had NO hover state at all — hovering
      // an outlined button left it fully transparent, so the three outlined pills
      // on the Dashboard ("Start Today's Goals", "Complete next milestone", "Open
      // Notes and Papers") gave no feedback where production tints them.
      //
      // The `/N` opacity modifier is used rather than new rgba tokens so each
      // tint stays derived from the single source colour — the same thing Joy
      // expressed as `rgb(var(--joy-palette-*-mainChannel) / 9%)`.
      //
      // Background is deliberately NOT added to the base transition: production
      // reports `transition: all 0s` on these buttons, i.e. the hover swap is
      // instant, and local already matches that.
      //
      // `neutral` and `warning` solid are the two colours with NO production
      // reference on any screen compared so far (no call site renders them
      // there), so they get a hue-preserving `brightness-95` rather than an
      // invented shade token. Flagged as unverified, not as certified-matching.
      { variant: "solid", color: "primary", className: "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)]" },
      { variant: "solid", color: "danger", className: "bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger-hover)]" },
      { variant: "solid", color: "success", className: "bg-[var(--color-success)] text-white hover:bg-[var(--color-success-highlight)]" },
      { variant: "solid", color: "gray", className: "bg-[var(--color-gray)] text-white hover:bg-[var(--color-gray-hover)]" },
      { variant: "solid", color: "neutral", className: "bg-[var(--color-neutral)] text-white hover:brightness-95" },
      { variant: "solid", color: "warning", className: "bg-[var(--color-warning-strong)] text-white hover:brightness-95" },

      { variant: "outlined", color: "primary", className: "text-[var(--color-primary-strong)] border-[var(--color-brand)] hover:bg-brand/9" },
      { variant: "outlined", color: "danger", className: "text-[var(--color-danger-strong)] border-[var(--color-danger)] hover:bg-danger/9" },
      { variant: "outlined", color: "success", className: "text-[var(--color-success-strong)] border-[var(--color-success)] hover:bg-success/9" },
      { variant: "outlined", color: "gray", className: "text-[var(--color-gray-strong)] border-[var(--color-gray-border)] hover:bg-[var(--color-gray-bg-subtle-hover)]" },
      { variant: "outlined", color: "neutral", className: "text-[var(--color-neutral-strong)] border-[var(--color-neutral)] hover:bg-neutral/9" },
      { variant: "outlined", color: "warning", className: "text-[var(--color-warning-strong)] border-[var(--color-warning-strong)] hover:bg-warning-strong/9" },

      { variant: "soft", color: "primary", className: "bg-[var(--color-primary-bg-soft)] text-[var(--color-primary-stronger)] hover:bg-brand/20" },
      { variant: "soft", color: "danger", className: "bg-[var(--color-danger-bg-soft)] text-[var(--color-danger-strong)] hover:bg-danger/20" },
      { variant: "soft", color: "success", className: "bg-[var(--color-success-bg-soft)] text-[var(--color-success-strong)] hover:bg-success/20" },
      { variant: "soft", color: "gray", className: "bg-[var(--color-gray-bg-soft)] text-[var(--color-gray-stronger)] hover:bg-[var(--color-gray-bg-soft-hover)]" },
      { variant: "soft", color: "neutral", className: "bg-[var(--color-neutral-bg-soft)] text-[var(--color-neutral-strong)] hover:bg-neutral/20" },
      { variant: "soft", color: "warning", className: "bg-[var(--color-warning-bg-soft)] text-[var(--color-warning-strong)] hover:bg-warning-strong/20" },

      { variant: "plain", color: "primary", className: "text-[var(--color-primary-strong)] hover:bg-brand/8" },
      { variant: "plain", color: "danger", className: "text-[var(--color-danger-strong)] hover:bg-danger/8" },
      { variant: "plain", color: "success", className: "text-[var(--color-success-strong)] hover:bg-success/8" },
      { variant: "plain", color: "gray", className: "text-[var(--color-gray-strong)] hover:bg-[var(--color-gray-bg-subtle-hover)]" },
      { variant: "plain", color: "neutral", className: "text-[var(--color-neutral-strong)] hover:bg-neutral/8" },
      { variant: "plain", color: "warning", className: "text-[var(--color-warning-strong)] hover:bg-warning-strong/8" },
    ],
    defaultVariants: {
      variant: "solid",
      color: "primary",
      size: "md",
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  /** Inline border-radius override (e.g. "50px" for pill buttons) — kept as
   * an inline style since Tailwind can't take an arbitrary runtime string. */
  rounded?: string;
  padding?: string;
  borderWidth?: string;
  /** Inline background-color override — same escape-hatch rationale as
   * `rounded`/`borderWidth` (a runtime value Tailwind can't express as a
   * static utility class). Ported from the original hand-rolled Button's
   * `bgColor` prop for Dashboard-migration parity. */
  bgColor?: string;
  startDecorator?: React.ReactNode;
  endDecorator?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** Hover-triggered icon motion applied to leftIcon/rightIcon. CSS/Tailwind
   * only — no animation library. Defaults to "none" so existing call sites
   * render identically. "slide" moves each icon outward from the label
   * (left icon left, right icon right). */
  iconAnimation?: "none" | "slide" | "bounce" | "pulse" | "spin";
  /** Opt-in, off-by-default shimmer sweep — a continuous light gradient that
   * animates across the button (pure CSS keyframe, no framer-motion). Visually
   * matches the app-local `ButtonShimmerOverlay` sweep (120° white gradient,
   * 3s linear, -150%→150%). When false (default) nothing is rendered, so there
   * is zero cost and zero visual change for the 17 existing consumers. */
  shimmer?: boolean;
  sx?: React.CSSProperties & { paddingX?: string | number; paddingY?: string | number };
}

// Hover-only icon motion. Every branch is inert until the button is hovered,
// so default rendering is untouched. "slide" is directional (icons move away
// from the centre label); the rest are symmetric.
function iconAnimationClass(
  side: "left" | "right",
  anim: NonNullable<ButtonProps["iconAnimation"]>,
): string {
  switch (anim) {
    case "slide":
      return side === "right"
        ? "transition-transform duration-200 group-hover:translate-x-1"
        : "transition-transform duration-200 group-hover:-translate-x-1";
    case "bounce":
      return "group-hover:animate-bounce";
    case "pulse":
      return "group-hover:animate-pulse";
    case "spin":
      return "group-hover:animate-spin";
    case "none":
    default:
      return "";
  }
}

/**
 * True for an `sx.border` value that specifies only a WIDTH — `2`, `"2px"`,
 * `"0.125rem"` — as opposed to a full shorthand like `"1px solid red"`.
 */
function isBorderWidthOnly(border: string | number): boolean {
  if (typeof border === "number") return true;
  return /^\d*\.?\d+(px|rem|em|%)?$/.test(border.trim());
}

/**
 * Translates the Joy `sx` idioms this Button still receives from migrated call
 * sites into real CSS properties.
 *
 * `border` is the subtle one. In Joy, `sx={{ border: 2 }}` means "make the
 * border 2 units WIDE" — style and colour keep coming from the variant. In plain
 * CSS the identical key is the `border` SHORTHAND, and a shorthand resets every
 * part it does not mention: writing `border: 2px` silently sets
 * `border-style: none`, so the border disappears completely.
 *
 * That is not hypothetical. The Exams page's "Start 3-day FREE Trial" buttons
 * pass `sx={{ borderRadius: "50px", border: 2 }}`, and rendered as bare blue
 * text with no outline at all — the inline shorthand was beating the variant's
 * `border-2` class and zeroing `border-style`, while production shows a 2px
 * outlined pill. Mapping a width-only value onto `borderWidth` keeps the
 * variant's style and colour intact and preserves the author's intent.
 *
 * A real shorthand (`"1px solid red"`) is passed through untouched — that
 * consumer means the shorthand.
 */
function parseSx(sx?: ButtonProps["sx"]): React.CSSProperties {
  if (!sx) return {};
  const { paddingX, paddingY, border, ...rest } = sx;
  return {
    ...(paddingX !== undefined && { paddingLeft: paddingX, paddingRight: paddingX }),
    ...(paddingY !== undefined && { paddingTop: paddingY, paddingBottom: paddingY }),
    ...(border !== undefined &&
      (isBorderWidthOnly(border) ? { borderWidth: border } : { border })),
    ...rest,
  };
}

const Spinner = () => (
  <svg className="h-4 w-4 shrink-0 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

// Pure-CSS shimmer. Rendered only when `shimmer` is true. The gradient +
// timing are copied byte-for-byte from the apps' `ButtonShimmerOverlay` so the
// sweep is visually identical, but driven by a CSS @keyframe instead of
// framer-motion (no runtime animation lib). The <style> carries a stable,
// uniquely-named keyframe; duplicate identical blocks across multiple shimmer
// buttons are harmless. `pointer-events-none` keeps it click-transparent.
const ShimmerSweep = () => (
  <>
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        background: "var(--gradient-shimmer-sweep)",
        animation: "cc-btn-shimmer 3s linear infinite",
      }}
    />
    <style>{"@keyframes cc-btn-shimmer{0%{transform:translateX(-150%)}100%{transform:translateX(150%)}}"}</style>
  </>
);

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    variant,
    color,
    size,
    fullWidth,
    asChild = false,
    loading = false,
    disabled = false,
    rounded,
    padding,
    borderWidth,
    bgColor,
    startDecorator,
    endDecorator,
    leftIcon,
    rightIcon,
    iconAnimation = "none",
    shimmer = false,
    sx,
    className,
    style,
    type = "button",
    ...rest
  },
  ref,
) {
  const Comp = asChild ? Slot.Root : "button";
  const sxStyles = parseSx(sx);

  const inlineStyle: React.CSSProperties = {
    ...(rounded && { borderRadius: rounded }),
    ...(padding && { padding }),
    ...(borderWidth && { borderWidth }),
    ...(bgColor && { backgroundColor: bgColor }),
    ...sxStyles,
    ...style,
  };

  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-slot="button"
      className={cn(buttonVariants({ variant, color, size, fullWidth, className }))}
      style={inlineStyle}
      {...rest}
    >
      {loading ? <Spinner /> : startDecorator}
      {leftIcon && <span className={cn(iconAnimationClass("left", iconAnimation))}>{leftIcon}</span>}
      <span className="flex items-center gap-1">{children}</span>
      {rightIcon && <span className={cn(iconAnimationClass("right", iconAnimation))}>{rightIcon}</span>}
      {!loading && endDecorator}
      {shimmer && <ShimmerSweep />}
    </Comp>
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };
export default Button;
