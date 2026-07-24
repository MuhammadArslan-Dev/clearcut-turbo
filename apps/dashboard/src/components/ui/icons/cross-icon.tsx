import React from "react";

type CrossIconProps = {
  size?: number;
  color?: string;
  variant?: "outline" | "filled";
  mode?: "simple" | "danger";
  radius?: number;
  padding?: number; // 👈 padding control
} & React.SVGProps<SVGSVGElement>;

const CrossPath = ({ fill }: { fill: string }) => (
  <path
    d="M18.7071 6.70711C19.0976 6.31658 19.0976 5.68342 18.7071 5.29289C18.3166 4.90237 17.6834 4.90237 17.2929 5.29289L12 10.5858L6.70711 5.29289C6.31658 4.90237 5.68342 4.90237 5.29289 5.29289C4.90237 5.68342 4.90237 6.31658 5.29289 6.70711L10.5858 12L5.29289 17.2929C4.90237 17.6834 4.90237 18.3166 5.29289 18.7071C5.68342 19.0976 6.31658 19.0976 6.70711 18.7071L12 13.4142L17.2929 18.7071C17.6834 19.0976 18.3166 19.0976 18.7071 18.7071C19.0976 18.3166 19.0976 17.6834 18.7071 17.2929L13.4142 12L18.7071 6.70711Z"
    fill={fill}
  />
);

const CrossIcon: React.FC<CrossIconProps> = ({
  size = 24,
  color = "#192839",
  variant = "outline",
  mode = "simple",
  radius = 4,
  padding = 0, // 👈 default: no padding
  ...props
}) => {
  const dangerColor = "#dc2626";

  /**
   * Scale the cross inward based on padding
   * SVG viewBox is 24x24
   */
  const scale = (24 - padding * 2) / 24;
  const translate = padding;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {variant === "filled" && (
        <rect
          width="24"
          height="24"
          rx={radius}
          ry={radius}
          fill={mode === "danger" ? dangerColor : color}
        />
      )}

      <g transform={`translate(${translate} ${translate}) scale(${scale})`}>
        <CrossPath fill={variant === "filled" ? "#fff" : mode === "danger" ? dangerColor : color} />
      </g>
    </svg>
  );
};

export default CrossIcon;
