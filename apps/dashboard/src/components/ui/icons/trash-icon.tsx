import React from "react";

interface IconProps {
  size?: number;
  color?: string;
}

/** Outline bin — used by the exam page's "Clear Response" action. */
const TrashIcon: React.FC<IconProps> = ({ size = 20, color = "#40566D" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 6H20"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 6V4.5A1.5 1.5 0 0 1 10.5 3H13.5A1.5 1.5 0 0 1 15 4.5V6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 6L6.8 18.1A2 2 0 0 0 8.8 20H15.2A2 2 0 0 0 17.2 18.1L18 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 10.5V16M14 10.5V16"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default TrashIcon;
