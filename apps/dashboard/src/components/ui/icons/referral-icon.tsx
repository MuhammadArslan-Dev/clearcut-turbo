import React from "react";

interface IconProps {
  size?: number;
  color?: string;
  opacity?: number;
  variant?: "filled" | "outline";
}

const ReferralIcon: React.FC<IconProps> = ({
  size = 24,
  color = "currentColor",
  opacity = 1,
  variant = "outline",
}) => {
  if (variant === "filled") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11Z"
          fill={color}
          fillOpacity={opacity}
        />
        <path
          d="M8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11Z"
          fill={color}
          fillOpacity={opacity}
        />
        <path
          d="M8 13C5.67 13 1 14.17 1 16.5V18H15V16.5C15 14.17 10.33 13 8 13Z"
          fill={color}
          fillOpacity={opacity}
        />
        <path
          d="M16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V18H23V16.5C23 14.17 18.33 13 16 13Z"
          fill={color}
          fillOpacity={opacity}
        />
        <circle cx="20" cy="6" r="3" fill={color} fillOpacity={opacity} />
        <rect x="19" y="4" width="2" height="4" rx="1" fill="white" />
        <rect x="18" y="5" width="4" height="2" rx="1" fill="white" />
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
        d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM16 7C16.55 7 17 7.45 17 8C17 8.55 16.55 9 16 9C15.45 9 15 8.55 15 8C15 7.45 15.45 7 16 7Z"
        fill={color}
        fillOpacity={opacity}
      />
      <path
        d="M8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 7C8.55 7 9 7.45 9 8C9 8.55 8.55 9 8 9C7.45 9 7 8.55 7 8C7 7.45 7.45 7 8 7Z"
        fill={color}
        fillOpacity={opacity}
      />
      <path
        d="M8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM13 17H3V16.5C3 15.71 5.97 15 8 15C10.03 15 13 15.71 13 16.5V17Z"
        fill={color}
        fillOpacity={opacity}
      />
      <path
        d="M16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13ZM21 17H19V16.5C19 15.92 18.7 15.39 18.23 14.94C18.79 14.96 19.43 15.04 20 15.17C20.58 15.31 21 15.53 21 16.5V17Z"
        fill={color}
        fillOpacity={opacity}
      />
      <path
        d="M20 4V6H18V8H20V10H22V8H24V6H22V4H20Z"
        fill={color}
        fillOpacity={opacity}
      />
    </svg>
  );
};

export default ReferralIcon;
