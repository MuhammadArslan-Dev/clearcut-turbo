// BadgeTwoIcon.tsx
import React from 'react';

interface IconProps {
  size?: number;
  color?: string;        // outer shape color
  opacity?: number;      // outer shape opacity
  pathColor?: string;    // inner text/path color
  pathOpacity?: number;  // inner text/path opacity
}

const EnLangCirlcIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#006BD1',
  opacity = 0.09,
  pathColor = '#006BD1',
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
    <path
      d="M11.1431 17H5.75315V7.004H11.1431V8.502H7.62915V11.05H10.9191V12.548H7.62915V15.488H11.1431V17ZM16.8896 9.272C17.6829 9.272 18.3083 9.49133 18.7656 9.93C19.2229 10.3687 19.4516 11.078 19.4516 12.058V17H17.5896V12.408C17.5896 11.8387 17.4916 11.414 17.2956 11.134C17.0996 10.8447 16.7916 10.7 16.3716 10.7C15.7463 10.7 15.3216 10.924 15.0976 11.372C14.8736 11.8107 14.7616 12.45 14.7616 13.29V17H12.8996V9.412H14.3276L14.5936 10.406H14.6636C14.8316 10.1447 15.0276 9.93 15.2516 9.762C15.4756 9.594 15.7276 9.47267 16.0076 9.398C16.2876 9.314 16.5816 9.272 16.8896 9.272Z"
      fill={pathColor}
      fillOpacity={pathOpacity}
    />
  </svg>
);

export default EnLangCirlcIcon;
