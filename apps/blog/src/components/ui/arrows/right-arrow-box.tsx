type ArrowBoxProps = {
  size?: number;        // controls width/height together
  stroke?: string;      // border stroke color
  fill?: string;        // arrow fill color
  className?: string;   // tailwind/custom styling
  onClick?: () => void; // optional click event
};

export default function RightArrowBox({
  size = 28,
  stroke = "#0083FF",
  fill = "#0083FF",
  className,
  onClick,
}: ArrowBoxProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <path
        d="M4 0.5H24C25.933 0.5 27.5 2.067 27.5 4V24C27.5 25.933 25.933 27.5 24 27.5H4C2.067 27.5 0.5 25.933 0.5 24V4C0.5 2.067 2.067 0.5 4 0.5Z"
        stroke={stroke}
      />
      <path
        d="M11.5283 9.52832C11.7887 9.268 12.2113 9.26798 12.4717 9.52832L16.4717 13.5283C16.7319 13.7887 16.732 14.2114 16.4717 14.4717L12.4717 18.4717C12.2114 18.732 11.7887 18.7319 11.5283 18.4717C11.268 18.2113 11.268 17.7887 11.5283 17.5283L15.0566 14L11.5283 10.4717C11.268 10.2113 11.268 9.78867 11.5283 9.52832Z"
        fill={fill}
      />
    </svg>
  );
}
