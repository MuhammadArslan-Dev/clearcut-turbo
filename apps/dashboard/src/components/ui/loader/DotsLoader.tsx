import React from "react";

type DotsLoaderProps = {
  color?: string;
  size?: number;       // width in px
  speed?: number;      // animation duration in seconds
  dotCount?: number;
  gapRatio?: number;   // spacing control
  className?: string;
};

export default function DotsLoader({
  color = "#0083ff",
  size = 56,
  speed = 1,
  dotCount = 3,
  gapRatio = 1,
  className = "",
}: DotsLoaderProps) {
  const height = size * 0.48;
  const dotSize = height / 2;

  const background = Array.from({ length: dotCount })
    .map(
      (_, i) =>
        `radial-gradient(circle closest-side, ${color} 90%, transparent) 
         ${(i * 100) / (dotCount - 1)}% 50%`
    )
    .join(",");

  return (
    <div
      className={className}
      style={{
        width: `${size}px`,
        height: `${height}px`,
        background,
        backgroundSize: `calc(100% / ${dotCount}) ${dotSize}px`,
        backgroundRepeat: "no-repeat",
        animation: `dotsLoader ${speed}s infinite linear`,
      }}
    >
      <style jsx>{`
        @keyframes dotsLoader {
          20% {
            background-position:
              0% 0%,
              50% 50%,
              100% 50%;
          }
          40% {
            background-position:
              0% 100%,
              50% 0%,
              100% 50%;
          }
          60% {
            background-position:
              0% 50%,
              50% 100%,
              100% 0%;
          }
          80% {
            background-position:
              0% 50%,
              50% 50%,
              100% 100%;
          }
        }
      `}</style>
    </div>
  );
}
