import React from "react";

// Generic placeholder mark — swap for Truecaller's actual brand icon
// (subject to their brand guidelines) if this becomes more prominent.
// Shared between StartAuthForm.tsx (apps/landing) and login-screen.tsx so
// the mark and its colour aren't duplicated per call site.
const TruecallerIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
    <circle cx="12" cy="12" r="12" fill="var(--color-truecaller-brand)" />
    <text
      x="12"
      y="16.5"
      textAnchor="middle"
      fontSize="13"
      fontWeight="700"
      fontFamily="inherit"
      fill="#fff"
    >
      T
    </text>
  </svg>
);

export default TruecallerIcon;
