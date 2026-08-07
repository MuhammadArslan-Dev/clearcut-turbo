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

const cardVariants = cva("group/card rounded-xl bg-card", {
  variants: {
    size: {
      default: "[--card-spacing:--spacing(4)]",
      sm: "[--card-spacing:--spacing(3)]",
    },
    /**
     * Clipping behaviour. Defaults to "hidden" — the MUI Card behaviour every
     * existing call site was built against, so this is not a visual change.
     *
     * It exists as a variant because clipping used to be applied TWICE: as
     * `overflow-hidden` in this base string AND as an inline
     * `style={{ overflow: "hidden" }}`. The inline copy won, which made the
     * class dead and, worse, made the behaviour impossible to opt out of the
     * normal way — a consumer passing `className="overflow-visible"` was
     * silently ignored, because an inline style always beats a class. Anything
     * a card deliberately hangs outside its own box got clipped with no way to
     * fix it from the outside.
     *
     * That is exactly what broke the Dashboard's course card: its status badge
     * is positioned at `-top-[10.5px]` to straddle the card's top edge (as it
     * does in production), and the forced clip cut off its upper half.
     *
     * Driving it from a class instead means tailwind-merge resolves it
     * predictably, so `overflow="visible"` and a `className` override both work.
     */
    overflow: {
      hidden: "overflow-hidden",
      visible: "overflow-visible",
      clip: "overflow-clip",
      auto: "overflow-auto",
      scroll: "overflow-scroll",
    },
  },
  defaultVariants: {
    size: "default",
    overflow: "hidden",
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
  // The #CBD5E2 fallback that used to sit inside this var() was a second copy of
  // the token's value, so a palette change would leave it stale. Dropped: all
  // three apps @import @clearcut/design-tokens, so the token is always defined,
  // and a missing token should fail visibly rather than silently render an
  // out-of-date colour.
  bordercolor = "var(--color-border-gray-subtle)",
  bgcolor = "transparent",
  padding,
  cursor,
  borderRadius = 6,
  rounded,
  border,
  size,
  overflow,
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

  /**
   * The default `height: 100%` is paired with `min-height: fit-content`, and both
   * halves are load-bearing. Two call sites want opposite things from the same
   * component, and this is the one combination that serves both:
   *
   *   - Exams grid: each Card sits inside a grid-item wrapper that the grid has
   *     already stretched to the row height, i.e. a DEFINITE height. `height:
   *     100%` resolves against it cleanly and keeps the row's cards flush. Drop
   *     it and the cards no longer fill their wrappers — measured: one card 7px
   *     shorter than its row-mates, ragged bottom edges.
   *
   *   - Payment plan cards: the container is a `flex flex-col` with an INDEFINITE
   *     height, so `height: 100%` is circular — it resolved to 77.1px for all
   *     three cards while the third needed 94px (scrollHeight 94 vs clientHeight
   *     74), and `overflow: hidden` then silently ate 20px, cutting the "Best
   *     value • Covers next exam" chip in half. Production sizes those cards to
   *     their own content (90 / 88 / 131px), the third deliberately taller.
   *
   * `min-height: fit-content` resolves the conflict because it is a floor at the
   * content's height, not at the container's: where 100% is definite and larger
   * it wins (grid case, unchanged), and where 100% comes out too small the
   * content's own height wins (payment case, no truncation).
   *
   * Two other shapes were tried and BOTH are wrong — do not revisit them:
   *   - `min-height: 100%` instead of `height: 100%` — circular against a
   *     content-height container, every card ballooned to 255.3px.
   *   - dropping the height default entirely — fixes payment, regresses the
   *     exams grid to ragged heights (above).
   *
   * fit-content is applied only for the DEFAULT. An explicit `height` prop stays
   * a hard height: a consumer passing one is asking for that exact box, so
   * capping is their intent.
   */
  const heightIsExplicit = height !== undefined;

  // Border: if "border-none" → remove border via class, otherwise use inline style
  const borderTw = border && isTailwind(border) ? border : undefined;
  const borderCss = !borderTw ? `${borderwidth}px solid ${bordercolor}` : undefined;

  const inlineStyle: React.CSSProperties = {
    ...(p.css !== undefined && { padding: p.css }),
    ...(w.css !== undefined && { width: w.css }),
    ...(maxW.css !== undefined && { maxWidth: maxW.css }),
    ...(minW.css !== undefined && { minWidth: minW.css }),
    ...(h.css !== undefined && { height: h.css }),
    ...(!heightIsExplicit && { minHeight: "fit-content" }),
    ...(maxH.css !== undefined && { maxHeight: maxH.css }),
    ...(br.css !== undefined && { borderRadius: br.css }),
    ...(borderCss && { border: borderCss }),
    ...(bgcolor && { backgroundColor: bgcolor }),
    ...(cursor && { cursor }),
    // No inline `overflow` here on purpose — it moved to the `overflow` cva
    // variant above. See the note there: as an inline style it silently beat
    // both its own class and any consumer override.
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
        cardVariants({ size, overflow }),
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
