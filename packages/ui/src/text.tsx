import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

// Maps 1:1 onto the fluid typography classes defined in
// @clearcut/design-tokens (display-*, heading-*, body-*) so this component
// stays purely token-driven — no literal font-size/line-height values here.
//
// NOTE: `defaultVariants` below is deliberately left in place even though the
// component no longer relies on it (see `resolveVariant`). It preserves the
// standalone contract of the exported `textVariants()` helper: calling it with
// no arguments still yields the opinionated Design System defaults.
const textVariants = cva("", {
  variants: {
    variant: {
      "display-xlarge": "display-xlarge",
      "display-large": "display-large",
      "display-medium": "display-medium",
      "display-small": "display-small",
      "heading-2xxlarge": "heading-2xxlarge",
      "heading-2xlarge": "heading-2xlarge",
      "heading-xlarge": "heading-xlarge",
      "heading-large": "heading-large",
      "heading-medium": "heading-medium",
      "heading-small": "heading-small",
      "body-large": "body-large",
      "body-medium": "body-medium",
      "body-small": "body-small",
      "body-xsmall": "body-xsmall",
    },
    weight: {
      normal: "!font-normal",
      medium: "!font-medium",
      semibold: "!font-semibold",
      bold: "!font-bold",
    },
    color: {
      "gray-normal": "text-text-gray-normal",
      "gray-subtle": "text-text-gray-subtle",
      "gray-muted": "text-text-gray-muted",
      "gray-disabled": "text-text-gray-disabled",
      "primary-normal": "text-brand",
      "primary-dark": "text-brand-dark",
      white: "text-white",
    },
  },
  defaultVariants: {
    variant: "body-medium",
    weight: "normal",
    color: "gray-normal",
  },
});

type TextVariants = VariantProps<typeof textVariants>;

// The same values as cva's `defaultVariants`, restated so the component can
// choose *per axis* whether to apply them. cva offers no way to bypass a
// default other than passing `null` for that variant, which is exactly what
// `inherit` does (verified against cva 0.7.1: `{variant:null}` emits no class,
// whereas `{variant:undefined}` falls back to the default).
const DEFAULT_VARIANTS: { [K in keyof TextVariants]-?: NonNullable<TextVariants[K]> } = {
  variant: "body-medium",
  weight: "normal",
  color: "gray-normal",
};

/**
 * Resolution order for a single typography axis:
 *   1. an explicit prop always wins — even in `inherit` mode
 *   2. otherwise `inherit` yields `null`, so no class is emitted at all
 *   3. otherwise the Design System default applies (existing behaviour)
 *
 * Step 1 is what makes `inherit` compose rather than configure: opting out of
 * the defaults and then opting back in to one axis needs no extra API —
 * `<Text inherit weight="bold" />` inherits size/colour but sets weight.
 */
function resolveVariant<K extends keyof TextVariants>(
  explicit: TextVariants[K],
  inherit: boolean,
  axis: K,
): TextVariants[K] {
  if (explicit !== undefined && explicit !== null) return explicit;
  return (inherit ? null : DEFAULT_VARIANTS[axis]) as TextVariants[K];
}

// Widened beyond the original div/p/span/label/h1-h6 so a semantic element is
// never blocked by the primitive. Every addition is a text-level or text-block
// element that legitimately carries copy; interactive elements (a, button) are
// intentionally excluded — those belong to Link/Button, not Text.
export type TextElement =
  | "div"
  | "p"
  | "span"
  | "label"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "strong"
  | "em"
  | "b"
  | "i"
  | "small"
  | "mark"
  | "sub"
  | "sup"
  | "code"
  | "pre"
  | "abbr"
  | "time"
  | "address"
  | "blockquote"
  | "figcaption"
  | "legend"
  | "li"
  | "dt"
  | "dd";

// Preserved for the existing consumers that import this type name.
export type TextVariant = NonNullable<TextVariants["variant"]>;

interface TextOwnProps extends TextVariants {
  as?: TextElement;
  /**
   * Inherited rendering. Emits no typography class for any axis that was not
   * explicitly set, so font-family, size, line-height, weight, colour and
   * letter-spacing all cascade from the parent — the equivalent of MUI Joy's
   * `level="inherit"`.
   *
   * Without this, the three `defaultVariants` were unconditional and a consumer
   * could not opt out: `.body-medium` sets `font-size` with `!important`, so
   * even a className could not override the size.
   */
  inherit?: boolean;
  /**
   * React 19 passes `ref` as an ordinary prop, so this component does not need
   * `React.forwardRef` — which matters here: unlike Button/Skeleton, Text has
   * no `"use client"` directive and is rendered inside Server Components.
   */
  ref?: React.Ref<HTMLElement>;
}

export type TextProps = TextOwnProps &
  // `color` is redeclared by HTMLAttributes as a legacy string attribute, so
  // the Omit is load-bearing — without it the design-token `color` union breaks.
  Omit<React.HTMLAttributes<HTMLElement>, keyof TextOwnProps>;

function Text({
  children,
  as = "span",
  inherit = false,
  variant,
  weight,
  color,
  className,
  ...rest
}: TextProps) {
  // Renders nothing for genuinely absent content, but NOT for `0`: the previous
  // `if (!children)` guard also swallowed the number zero, so a score or count
  // of 0 disappeared entirely. MUI Typography renders `0`, so this was also a
  // parity gap. Empty string still returns null, matching the old behaviour —
  // an empty styled block would otherwise occupy a line-height's worth of space.
  if (children === undefined || children === null || children === false || children === "") {
    return null;
  }

  const Component = as as React.ElementType;

  const classes = cn(
    textVariants({
      variant: resolveVariant(variant, inherit, "variant"),
      weight: resolveVariant(weight, inherit, "weight"),
      color: resolveVariant(color, inherit, "color"),
    }),
    className,
  );

  return (
    // `|| undefined` keeps a fully-inherited Text from emitting `class=""`.
    <Component data-slot="text" className={classes || undefined} {...rest}>
      {children}
    </Component>
  );
}

export { Text, textVariants };
export default Text;
