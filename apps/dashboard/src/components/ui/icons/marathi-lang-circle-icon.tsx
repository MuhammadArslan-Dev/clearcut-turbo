// BadgeIcon.tsx — Marathi counterpart to en-lang-circle-icon.tsx /
// hindi-lang-circle-icon.tsx. Those two hand-trace their glyph as an SVG
// <path> (extracted from a font outline); doing the same for "मरा" reliably
// by hand isn't practical, so this renders the glyph as a real SVG <text>
// element instead — same circle badge, same color props, same call shape.
import React from "react";

interface IconProps {
  size?: number;
  color?: string; // circle fill color
  opacity?: number; // circle opacity
  pathColor?: string; // inner symbol color
  pathOpacity?: number; // inner symbol opacity
}

const MarathiLangCircleIcon: React.FC<IconProps> = ({
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
      मरा
    </text>
  </svg>
);

export default MarathiLangCircleIcon;
