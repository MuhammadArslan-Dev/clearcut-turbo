import React from "react";
import Text, { TextVariant } from "@clearcut/ui/text";
import clsx from "clsx";

export interface CounterCardProps {
  textClass?: string;
  value?: string | number | React.ReactNode | null | undefined;
  width?: string;
  height?: string;
  rounded?: string;
  border?: string;
  borderColor?: string;
  padding?: string;
  bgColor?: string;
  fontFamily?: TextVariant;
  onClick?: () => void;
}

export default React.memo(function CounterCard({
  textClass,
  value = 1,
  width = "w-10",
  height = "h-10",
  rounded = "rounded-full",
  border = "border",
  borderColor = "border-gray-200",
  padding,
  bgColor,
  fontFamily,
  onClick = () => {},
}: CounterCardProps) {
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
        borderColor,
      )}
      onClick={()=>onClick()}
    >
      <Text
        as="div"
        variant={fontFamily ?? "body-medium"}
        weight="normal"
        className={textClass}
      >
        {value ?? 0}
      </Text>
    </div>
  );
});
