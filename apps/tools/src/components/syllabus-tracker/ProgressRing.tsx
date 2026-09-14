"use client";

/** Circular progress indicator for the dashboard's header — an SVG ring
 * rather than a library, since this is the only place the tracker needs one.
 * `size`/`stroke` are px; `percent` is 0-100. */
export default function ProgressRing({
  percent,
  size = 56,
  stroke = 5,
  complete = false,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  complete?: boolean;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-gray-bg-soft)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={complete ? "var(--color-success)" : "var(--color-brand)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-[13px] font-semibold"
          style={{ color: complete ? "var(--color-success)" : "var(--color-brand)" }}
        >
          {percent}%
        </span>
      </div>
    </div>
  );
}
