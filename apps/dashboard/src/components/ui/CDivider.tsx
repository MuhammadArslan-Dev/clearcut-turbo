"use client";

import React from "react";
import clsx from "clsx";

type DividerOrientation = "horizontal" | "vertical";
type DividerAlign = "start" | "center" | "end";
type DividerVariant = "solid" | "dashed" | "dotted";

interface DividerProps {
  /** Horizontal or vertical divider */
  orientation?: DividerOrientation;

  /** Optional label (text or node) in the divider */
  label?: React.ReactNode;

  /** Label alignment */
  align?: DividerAlign;

  /** Line thickness (px) */
  thickness?: number;

  /** Line color (any CSS color) */
  color?: string;

  /** Opacity of the divider line */
  opacity?: number;

  /** Vertical / horizontal spacing */
  spacing?: number;

  /** Line style */
  variant?: DividerVariant;

  /** Stretch to full width / height */
  fullLength?: boolean;

  /** Custom class overrides */
  className?: string;

  /** Custom styles */
  style?: React.CSSProperties;

  /** ARIA role override */
  role?: string;
}

export default function CDivider({
  orientation = "horizontal",
  label,
  align = "center",
  thickness = 1,
  color = "rgba(0,0,0,0.12)",
  opacity = 1,
  spacing = 12,
  variant = "solid",
  fullLength = true,
  className,
  style,
  role = "separator",
}: DividerProps) {
  const isHorizontal = orientation === "horizontal";

  const borderStyle = `${thickness}px ${variant} ${color}`;

  const baseLineStyle: React.CSSProperties = {
    borderColor: color,
    borderStyle: variant,
    opacity,
  };

  const lineStyle: React.CSSProperties = isHorizontal
    ? { borderTopWidth: thickness }
    : { borderLeftWidth: thickness };

  const wrapperStyle: React.CSSProperties = isHorizontal
    ? { margin: `${spacing}px 0` }
    : { margin: `0 ${spacing}px` };

  const lineClass = clsx(
    "flex-shrink-0",
    isHorizontal ? "w-full" : "h-full",
  );

  const renderLine = () => (
    <div
      className={lineClass}
      style={{
        ...baseLineStyle,
        ...lineStyle,
      }}
    />
  );

  return (
    <div
      role={role}
      aria-orientation={orientation}
      className={clsx(
        "flex items-center",
        isHorizontal ? "w-full" : "h-full",
        !isHorizontal && "flex-col",
        className,
      )}
      style={{
        ...wrapperStyle,
        ...(fullLength
          ? {}
          : isHorizontal
          ? { width: "auto" }
          : { height: "auto" }),
        ...style,
      }}
    >
      {label && align !== "start" && renderLine()}

      {label && (
        <span
          className={clsx(
            "px-2 text-sm text-gray-500 whitespace-nowrap select-none",
          )}
        >
          {label}
        </span>
      )}

      {(align !== "end" || !label) && renderLine()}
    </div>
  );
}
