import React from "react";

type Props = {
  size?: number;
  color?: string;
  variant?: "bordered" | "without-border";
  type?: "filled" | "outlined";
};
export default function StarIcon({
  size = 16,
  color = "#FECF49",
  variant,
  type,
}: Props) {
  if (variant === "without-border" && type === "filled") {
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          width="24"
          height="24"
          rx="12"
          fill="#00A251"
          fillOpacity="0.09"
        />
        <rect
          x="0.25"
          y="0.25"
          width="23.5"
          height="23.5"
          rx="11.75"
          stroke="#00A251"
          strokeOpacity="0.18"
          strokeWidth="0.5"
        />
        <path
          d="M12.0005 15.3327L8.08197 17.7261L9.14737 13.2597L5.66016 10.2726L10.2372 9.90563L12.0005 5.66602L13.7639 9.90563L18.3409 10.2726L14.8537 13.2597L15.9191 17.7261L12.0005 15.3327Z"
          fill="#009E5C"
        />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.9991 12.174L3.2968 14.8061L4.34702 9.52058L0.390625 5.86185L5.74198 5.22736L7.9991 0.333984L10.2562 5.22736L15.6075 5.86185L11.6512 9.52058L12.7014 14.8061L7.9991 12.174Z"
        fill={color}
      />
    </svg>
  );
}
