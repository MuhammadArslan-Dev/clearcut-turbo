import React from "react";

type NumberIconProps = {
  value: string | number; // 👈 dynamic content
  size?: number;
  radius?: number;
  padding?: number;
  background?: string | null;
  color?: string;
  fontSize?: number;
  fontWeight?: number | string;
  opacity?: number;
  fontFamily?: string;
} & React.SVGProps<SVGSVGElement>;

const NumberCountIcon: React.FC<NumberIconProps> = ({
  value,
  size = 38,
  radius = 8,
  padding = 0,
  background = "#EDEDED",
  color = "#000000",
  fontSize = 18,
  fontWeight = 500,
  opacity = 1,
  fontFamily = "Noto Sans, Noto Sans Fallback, -apple-system, BlinkMacSystemFont, sans-serif",
  ...props
}) => {
  /**
   * Original viewBox is 38x38
   * Padding shrinks inner glyph proportionally
   */
  const viewBoxSize = 38;
  const innerSize = viewBoxSize - padding * 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Background */}
      <rect
        width={viewBoxSize}
        height={viewBoxSize}
        rx={radius}
        fill={background}
      />

      {/* Centered text */}
      <text
        x={viewBoxSize / 2}
        y={viewBoxSize / 2}
        textLength={innerSize}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fillOpacity={opacity}
        fontSize={fontSize}
        fontWeight={fontWeight}
        fontFamily={fontFamily}
        
      >
        {value}
      </text>
    </svg>
  );
};

export default NumberCountIcon;
