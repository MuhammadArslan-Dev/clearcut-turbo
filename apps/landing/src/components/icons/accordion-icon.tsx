import React from "react";

type Props = {
  size?: number;
  color?: string;
};
export default function AccordionIcon({
  size = 24,
  color = "#192839",
}: Props) {
 

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11.9987 10.8284L7.04899 15.7782L5.63477 14.364L11.9987 8L18.3627 14.364L16.9485 15.7782L11.9987 10.8284Z"
        fill={color}
      />
    </svg>
  );
}
