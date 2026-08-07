import React from "react";
import clsx from "clsx";

import { TextVariant } from "@/types/heading-block";
import {
  getAlignmentClasses,
} from "@clearcut/utils/highlight-text";

type ParagraphProps = {
  as?: React.ElementType;

  text?: TextVariant;
  className?: string;

  textOptions?: {
    alignMobile?: "left" | "center" | "right";
    alignDesktop?: "left" | "center" | "right";
    font?: string;
    color?: string;
  };
};

export default function Paragraph({
  as: Component = "p",
  text,
  className,
  textOptions,
}: ParagraphProps) {
  // 🔹 Early return if no text
  if (!text?.text) return null;

  const alignment = getAlignmentClasses(
    textOptions?.alignMobile,
    textOptions?.alignDesktop
  );

  const fontClass = textOptions?.font ?? "heading-small !font-normal";
  const colorClass = textOptions?.color ?? "text-text-gray-subtle";

  return (
    <Component
      className={clsx(
        alignment,
        fontClass,
        colorClass,
        className
      )}
    >
      {text.text}
    </Component>
  );
}



