import React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  maxWidth?: string; // e.g. "max-w-7xl"
  minWidth?: string; // e.g. "min-w-[300px]"
  bgColor?: string; // e.g. "bg-gray-100"
  padding?: string; // e.g. "p-6" or "px-4 py-8"
};

export default function MainContainer({
  children,
  className = "",
  maxWidth = "max-w-[1100px]",
  minWidth = "",
  bgColor = "bg-white",
  padding = "p-4",
}: Props) {
  const combinedClasses = `
    w-full 
    mx-auto 
    ${maxWidth} 
    ${minWidth} 
    ${bgColor} 
    ${padding} 
    ${className}
  `;

  return <section className={combinedClasses}>{children}</section>;
}
