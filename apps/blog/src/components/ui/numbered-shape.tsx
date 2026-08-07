type Props = {
  number: number | string;
  width?: number;
  height?: number;
  fill?: string;
  fontSize?: number;
};

export default function NumberedShape({
  number,
  width = 42,
  height = 44,
  fill = "#006BD1",
  fontSize=20
}: Props) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 42 44"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0.0187679 0L0 44H0.0187679L20.9995 34.5L41.9813 44H42L41.9813 0H20.9995H0.0187679Z"
        fill={fill}
        fillOpacity="0.09"
      />

      {/* Center text */}
      <text
        x="50%"
        y="50%"
        dy={-3}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        fill={fill}      // same color (you can change)
        fontWeight="600"
      >
        {number}
      </text>
    </svg>
  );
}
