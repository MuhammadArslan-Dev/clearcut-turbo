import React from "react";

interface HomeIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
}

const HomeIcon: React.FC<HomeIconProps> = ({
  size = 14,
  color = "#40566D",
  ...props
}) => (
  <svg
    width={size}
    height={(size * 15) / 14} // keep aspect ratio
    viewBox="0 0 14 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M6.25781 0.140137C6.49853 -0.0470131 6.83547 -0.0470455 7.07617 0.140137L13.0762 4.80713C13.2385 4.93344 13.334 5.12782 13.334 5.3335V12.6665C13.3339 13.7709 12.4383 14.6663 11.334 14.6665H2C0.895599 14.6664 6.87884e-05 13.7709 0 12.6665V5.3335C0 5.12779 0.0954537 4.93343 0.257812 4.80713L6.25781 0.140137ZM1.33398 5.65869V12.6665C1.33405 13.0345 1.63198 13.3333 2 13.3335H4V7.3335C4 6.96531 4.2988 6.6665 4.66699 6.6665H8.66699C9.03516 6.66653 9.33398 6.96532 9.33398 7.3335V13.3335H11.334C11.702 13.3333 11.9999 13.0345 12 12.6665V5.65869L6.66699 1.51123L1.33398 5.65869ZM5.33398 7.99951V13.3335H8V7.99951H5.33398Z"
      fill={color}
    />
  </svg>
);

export default HomeIcon;
