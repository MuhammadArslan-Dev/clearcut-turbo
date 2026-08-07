import clsx from "clsx";
import React from "react";

type Props = {
  padding?: string;
  bgColor?: string;
  rounded?: string;
  color?: string;
  text?: string;
  className?: string;
  border?: string;
  borderColor?: string;
  font?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  gap?: string;
  maxWidth?: string;
  width?: string;
  maxHeight?: string;
  height?: string;
};

export default function Badge({
  padding = "p-2",
  bgColor = "bg-gray-100",
  rounded = "rounded-full",
  color = "text-gray-500",
  text = "Badge",
  className = "",
  border = "border",
  borderColor = "border-gray-200",
  font="body-large !font-semibold",
  leftIcon,
  rightIcon,
  maxWidth = "max-w-full",
  width = "w-auto",
  maxHeight = " max-h-7",
  height = "h-full",
  gap = "gap-2",
}: Props) {
  return (
    <div
      className={clsx(
        padding,
        bgColor,
        rounded,
        color,
        className,
        border,
        borderColor,
        font,
        maxWidth,
        width,
        height,
        maxHeight,
        'flex items-center',
        gap
      )}
    >
      {leftIcon && <span>{leftIcon}</span>}
      {text}
      {rightIcon && <span> {rightIcon}</span>}
    </div>
  );
}
