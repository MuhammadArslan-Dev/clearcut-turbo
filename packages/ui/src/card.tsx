import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

// ============================================================================
// Flexible box props ported 1:1 from the former CardWrap primitive — kept so
// every existing call site (arbitrary width/height/padding/border/background,
// as either a raw CSS value or a Tailwind class) renders identically. New
// card usage should prefer the CVA `size` variant + CardHeader/CardContent/
// CardFooter composition below instead of these.
// ============================================================================

// Detect if a value is a Tailwind class string vs a CSS value.
// CSS values: numbers, strings with "px/rem/em/%", or bare color/hex values.
// Tailwind classes: contain "-", "[", spaces, or don't look like CSS units.
function isTailwind(val: string): boolean {
  if (/^\d+(\.\d+)?$/.test(val)) return false;
  if (/\d+(px|rem|em|%|vh|vw|vmin|vmax|ch|ex|pt|pc|cm|mm|in)/.test(val)) return false;
  if (val.startsWith("#") || val.startsWith("rgb") || val.startsWith("hsl")) return false;
  return true;
}

function splitProp(val: string | number | undefined) {
  if (val === undefined || val === null) return { css: undefined, tw: undefined };
  if (typeof val === "number") return { css: val === 1 ? 8 : val, tw: undefined }; // MUI spacing: 1 unit = 8px
  if (isTailwind(val)) return { css: undefined, tw: val };
  return { css: val, tw: undefined };
}

const cardVariants = cva("group/card overflow-hidden rounded-xl bg-card", {
  variants: {
    size: {
      default: "[--card-spacing:--spacing(4)]",
      sm: "[--card-spacing:--spacing(3)]",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export interface CardProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof cardVariants> {
  onClick?: () => void;
  width?: string | number;
  maxWidth?: string | number;
  minWidth?: string | number;
  height?: string | number;
  maxHeight?: string | number;
  borderwidth?: string | number;
  bordercolor?: string;
  bgcolor?: string;
  padding?: string | number;
  cursor?: string;
  borderRadius?: string | number;
  border?: string;
  rounded?: string;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card({
  onClick,
  children,
  minWidth,
  width,
  maxWidth,
  height,
  maxHeight,
  borderwidth = 1,
  // Same value as the shared `--color-border-gray-subtle` design token —
  // referenced by var() so a future palette change stays in sync here too.
  bordercolor = "var(--color-border-gray-subtle, #CBD5E2)",
  bgcolor = "transparent",
  padding,
  cursor,
  borderRadius = 6,
  rounded,
  border,
  size,
  className,
  style,
  id,
  ...props
}, ref) {
  const p = splitProp(padding ?? 1);
  const w = splitProp(width ?? "100%");
  const maxW = splitProp(maxWidth ?? "100%");
  const minW = splitProp(minWidth);
  const h = splitProp(height ?? "100%");
  const maxH = splitProp(maxHeight);
  const br = splitProp(rounded ?? borderRadius);

  // Border: if "border-none" → remove border via class, otherwise use inline style
  const borderTw = border && isTailwind(border) ? border : undefined;
  const borderCss = !borderTw ? `${borderwidth}px solid ${bordercolor}` : undefined;

  const inlineStyle: React.CSSProperties = {
    ...(p.css !== undefined && { padding: p.css }),
    ...(w.css !== undefined && { width: w.css }),
    ...(maxW.css !== undefined && { maxWidth: maxW.css }),
    ...(minW.css !== undefined && { minWidth: minW.css }),
    ...(h.css !== undefined && { height: h.css }),
    ...(maxH.css !== undefined && { maxHeight: maxH.css }),
    ...(br.css !== undefined && { borderRadius: br.css }),
    ...(borderCss && { border: borderCss }),
    ...(bgcolor && { backgroundColor: bgcolor }),
    ...(cursor && { cursor }),
    overflow: "hidden", // MUI Card default — clips overflow at rounded corners
    boxSizing: "border-box",
    ...style,
  };

  return (
    <div
      ref={ref}
      id={id}
      data-slot="card"
      onClick={onClick}
      className={cn(
        cardVariants({ size }),
        p.tw, w.tw, maxW.tw, minW.tw, h.tw, maxH.tw, br.tw, borderTw,
        className,
      )}
      style={inlineStyle}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = "Card";

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "text-base leading-snug font-medium group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing)", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-xl border-t bg-muted/50 p-(--card-spacing)",
        className
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  cardVariants,
};
