import clsx from "clsx";
import React from "react";

type SectionProps = {
  children: React.ReactNode;

  sectionId: string;
  className?: string;
  bgColor?: string;
  padding?: string;
  border?: string;

  maxWidth?: string;
  minWidth?: string;
};

export default function Section({
  children,
  sectionId,
  className,
  maxWidth = "max-w-[1100px]",
  minWidth = "",
  bgColor = "bg-transparent",
  padding = "p-3",
  border = "",
}: SectionProps) {
  return (
    <section
      id={sectionId}
      className={clsx(
        "w-full mx-auto",
        className,
        bgColor,
        padding,
        border,
        maxWidth,
        minWidth,
      )}
    >
      {children}
    </section>
  );
}
