// BadgeIcon.tsx — Punjabi counterpart to marathi-lang-circle-icon.tsx.
// Same circle badge, same color props, same call shape; glyph rendered as
// SVG <text> since hand-tracing "ਪੰਜਾਬੀ" as a path isn't practical.
import React from "react";

interface IconProps {
  size?: number;
  color?: string; // circle fill color
  opacity?: number; // circle opacity
  pathColor?: string; // inner symbol color
  pathOpacity?: number; // inner symbol opacity
}

const PunjabiLangCircleIcon: React.FC<IconProps> = ({
  size = 24,
  color = "#006BD1",
  opacity = 0.09,
  pathColor = "#006BD1",
  pathOpacity = 0.18,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 25 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 12C0 5.37258 5.37258 0 12 0H13C19.6274 0 25 5.37258 25 12C25 18.6274 19.6274 24 13 24H12C5.37258 24 0 18.6274 0 12Z"
      fill={color}
      fillOpacity={opacity}
    />
    <text
      x="12.5"
      y="16.5"
      textAnchor="middle"
      fontSize="11"
      fontWeight="700"
      fill={pathColor}
      fillOpacity={pathOpacity}
    >
      ਪੰਜ
    </text>
  </svg>
);

export default PunjabiLangCircleIcon;
