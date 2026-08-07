import React from "react";

type Props = {
  size?: number;
  color?: string;
  type?: "badge" | "flag";
};
export default function DiscountIcon({
  size = 24,
  color = "white",
  type = "badge",
}: Props) {
  if (type === "flag") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M21.1384 3C21.4146 3 21.6385 3.22386 21.6385 3.5C21.6385 3.58701 21.6157 3.67252 21.5725 3.74807L18 10L21.5725 16.2519C21.7095 16.4917 21.6262 16.7971 21.3865 16.9341C21.3109 16.9773 21.2254 17 21.1384 17H4V22H2V3H21.1384ZM18.5536 5H4V15H18.5536L15.6965 10L18.5536 5Z"
          fill={color}
        />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21.41 11.58L12.415 2.585C12.05 2.225 11.55 2 11 2H4C2.895 2 2 2.895 2 4V11C2 11.555 2.225 12.055 2.59 12.415L11.59 21.415C11.95 21.775 12.45 22 13 22C13.55 22 14.055 21.775 14.415 21.415L21.415 14.415C21.775 14.05 22 13.55 22 13C22 12.445 21.775 11.945 21.41 11.58ZM5.5 7C4.67 7 4 6.33 4 5.5C4 4.67 4.67 4 5.5 4C6.33 4 7 4.67 7 5.5C7 6.33 6.33 7 5.5 7Z"
        fill={color}
      />
    </svg>
  );
}
