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
const buttonVariants = cva(
  "group relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap cursor-pointer select-none outline-none transition-[opacity,filter] duration-150 active:brightness-90 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        solid: "",
        outlined: "border bg-transparent",
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
        xs: "min-h-7 text-xs px-2 py-0.5",
        sm: "min-h-8 text-sm px-3 py-1",
        md: "min-h-9 text-sm px-4 py-1.5",
        lg: "min-h-10 text-base px-6 py-2",
        xl: "text-xl px-8 py-2",
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
      { variant: "solid", color: "primary", className: "bg-[var(--color-brand-accessible)] text-white" },
      { variant: "solid", color: "danger", className: "bg-[#D92D20] text-white" },
      { variant: "solid", color: "success", className: "bg-[var(--color-success)] text-white" },
      { variant: "solid", color: "gray", className: "bg-[#6B7280] text-white" },
      { variant: "solid", color: "neutral", className: "bg-[#9FA6AD] text-white" },
      { variant: "solid", color: "warning", className: "bg-[#9A5B13] text-white" },

      { variant: "outlined", color: "primary", className: "text-[#005CB8] border-[var(--color-brand)]" },
      { variant: "outlined", color: "danger", className: "text-[#912018] border-[#D92D20]" },
      { variant: "outlined", color: "success", className: "text-[#00753A] border-[var(--color-success)]" },
      { variant: "outlined", color: "gray", className: "text-[#374151] border-[#9CA3AF]" },
      { variant: "outlined", color: "neutral", className: "text-[#32383E] border-[#9FA6AD]" },
      { variant: "outlined", color: "warning", className: "text-[#9A5B13] border-[#9A5B13]" },

      { variant: "soft", color: "primary", className: "bg-[rgba(0,131,255,0.12)] text-[#004C99]" },
      { variant: "soft", color: "danger", className: "bg-[rgba(217,45,32,0.12)] text-[#912018]" },
      { variant: "soft", color: "success", className: "bg-[rgba(0,162,81,0.12)] text-[#00753A]" },
      { variant: "soft", color: "gray", className: "bg-[rgba(107,114,128,0.12)] text-[#111827]" },
      { variant: "soft", color: "neutral", className: "bg-[rgba(159,166,173,0.12)] text-[#32383E]" },
      { variant: "soft", color: "warning", className: "bg-[rgba(154,91,19,0.12)] text-[#9A5B13]" },

      { variant: "plain", color: "primary", className: "text-[#005CB8]" },
      { variant: "plain", color: "danger", className: "text-[#912018]" },
      { variant: "plain", color: "success", className: "text-[#00753A]" },
      { variant: "plain", color: "gray", className: "text-[#374151]" },
      { variant: "plain", color: "neutral", className: "text-[#32383E]" },
      { variant: "plain", color: "warning", className: "text-[#9A5B13]" },
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

function parseSx(sx?: ButtonProps["sx"]): React.CSSProperties {
  if (!sx) return {};
  const { paddingX, paddingY, ...rest } = sx;
  return {
    ...(paddingX !== undefined && { paddingLeft: paddingX, paddingRight: paddingX }),
    ...(paddingY !== undefined && { paddingTop: paddingY, paddingBottom: paddingY }),
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
        background:
          "linear-gradient(120deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0) 100%)",
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
