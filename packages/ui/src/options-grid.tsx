import * as React from "react";
import clsx from "clsx";
import { optionsLayout, type OptionLike, type OptionsLayout } from "./options-layout";

/** Breakpoint (Tailwind) from which a "split" layout turns into two columns. Each screen keeps its own. */
export type OptionsBreakpoint = "sm" | "md" | "lg" | "xl";

// Spelled out in full on purpose: Tailwind only generates classes it finds as literal text (a class
// built from a template string would silently be missing).
const SPLIT_CLASS: Record<OptionsBreakpoint, string> = {
  sm: "grid-cols-1 sm:grid-cols-2",
  md: "grid-cols-1 md:grid-cols-2",
  lg: "grid-cols-1 lg:grid-cols-2",
  xl: "grid-cols-1 xl:grid-cols-2",
};

const LAYOUT_CLASS: Record<Exclude<OptionsLayout, "split">, string> = {
  single: "grid-cols-1",
  compact: "grid-cols-2",
};

type OptionsGridProps = Omit<React.HTMLAttributes<HTMLDivElement>, "children"> & {
  /** The question's options (text and/or image); only their length decides the layout. */
  options: readonly OptionLike[];
  /** Where a mixed-length question goes from one column to two. Default "md". */
  breakpoint?: OptionsBreakpoint;
  children: React.ReactNode;
};

/**
 * The container of a question's option cards: 2 columns when every option is short, one full-width
 * column as soon as any option is long (see `optionsLayout`). Pass the gap / padding as `className`
 * exactly as the old `grid ... gap-3` wrapper had it. Server- and client-safe (no hooks).
 */
export const OptionsGrid = React.forwardRef<HTMLDivElement, OptionsGridProps>(function OptionsGrid(
  { options, breakpoint = "md", className, children, ...rest },
  ref,
) {
  const layout = optionsLayout(options);
  return (
    <div
      ref={ref}
      data-options-layout={layout}
      className={clsx("grid", layout === "split" ? SPLIT_CLASS[breakpoint] : LAYOUT_CLASS[layout], className)}
      {...rest}
    >
      {children}
    </div>
  );
});
