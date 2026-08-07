// components/SectionBlock.tsx
"use client";

import React from "react";
import clsx from "clsx";

type Size = "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "custom";

interface SectionBlockProps {
  children: React.ReactNode;
  className?: string;
  padding?: Size | string;
  margin?: Size | string;
  width?: Size | string;

  bg?: string;
  w?: string;
  h?: string;
  ref?: React.Ref<HTMLDivElement>;
}

const sizeMap: Record<string, string> = {
  none: "0",
  xs: "1",
  sm: "2",
  md: "4",
  lg: "6",
  xl: "8",
  "2xl": "10",
};
const width: Record<string, string> = {
  none: "0",
  xs: "1",
  sm: "2",
  md: "4",
  lg: "6",
  xl: "8",
  "2xl": "10",
};

const SectionBlock: React.FC<SectionBlockProps> = ({
  children,
  className = "",
  width = "",
  padding = "md",
  margin = "none",
  bg = "bg-white",
  w = "w-full",
  h,
  ref,
}) => {
  const paddingClass =
    padding === "custom" ? "" : `p-${sizeMap[padding] || "4"}`;
  const marginClass = margin === "custom" ? "" : `m-${sizeMap[margin] || "0"}`;
  const widthClass = margin === "custom" ? "" : `m-${sizeMap[margin] || "0"}`;

  return (
    <div ref={ref} className="flex justify-center w-full">
      <div className={clsx(paddingClass, marginClass, bg, w, h, className)}>
        {children}
      </div>
    </div>
  );
};

export default SectionBlock;
