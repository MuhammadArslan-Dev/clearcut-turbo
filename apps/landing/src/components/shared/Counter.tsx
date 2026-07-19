import React from "react";
import clsx from "clsx";
import Text, { TextVariant } from "@clearcut/ui/text";
export default function   Counter({
    textClass,
    value,
    width="w-10",
    height="h-10",
    rounded = "rounded-full",
    border = "border",
    borderColor = "border-gray-200",
    padding,
    bgColor,
    fontFamily
}: {
  textClass?: string;
  value?: string | number;
  width?: string;
  height?: string;
  rounded?: string;
  border?: string;
  padding?: string;
  bgColor?: string;
  borderColor?: string
  fontFamily?: TextVariant
}) {
  return (
    <div
      className={clsx(
        "flex items-center justify-center",
        width,
        height,
        rounded,
        border,
        padding,
        bgColor,
        borderColor
      )}
    >
      <Text as="p" variant={ fontFamily ?? "body-medium"} weight="normal" className={textClass}>
        {value}
      </Text>
    </div>
  );
}
