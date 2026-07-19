import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

// Maps 1:1 onto the fluid typography classes defined in
// @clearcut/design-tokens (display-*, heading-*, body-*) so this component
// stays purely token-driven — no literal font-size/line-height values here.
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
      "primary-normal": "text-color-brand",
      "primary-dark": "text-color-brand-dark",
      white: "text-white",
    },
  },
  defaultVariants: {
    variant: "body-medium",
    weight: "normal",
    color: "gray-normal",
  },
});

export type TextElement = "div" | "p" | "span" | "label" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

// Preserved for the one existing consumer that imports this type name.
export type TextVariant = NonNullable<VariantProps<typeof textVariants>["variant"]>;

export interface TextProps extends VariantProps<typeof textVariants> {
  children: React.ReactNode;
  as?: TextElement;
  className?: string;
}

function Text({ children, as = "span", variant, weight, color, className }: TextProps) {
  if (!children) return null;

  const Component = as;

  return (
    <Component data-slot="text" className={cn(textVariants({ variant, weight, color }), className)}>
      {children}
    </Component>
  );
}

export { Text, textVariants };
export default Text;
