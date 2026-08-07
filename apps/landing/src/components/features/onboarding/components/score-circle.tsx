"use client";

// /lib/scoreUI.ts
export const SCORE_UI = {
  red: {
    stroke: "#DC2626",
    bg: "#FEE2E2",
  },
  yellow: {
    stroke: "#F59E0B",
    bg: "#FEF3C7",
  },
  green: {
    stroke: "#16A34A",
    bg: "#DCFCE7",
  },
};
export default function ScoreCircle({
  score,
  color,
  size = 80, // 👈 control size here
}: {
  score: number;
  color: "red" | "yellow" | "green";
  size?: number;
}) {
  const strokeWidth = 6;
  const radius = (size / 2) - strokeWidth;
  const circumference = radius * 2 * Math.PI;

  const progress = Math.min(score / 10, 1);
  const strokeDashoffset = circumference - progress * circumference;

  const ui = SCORE_UI[color];

  return (
    <div style={{ width: size, height: size }} className="relative">
      <svg width={size} height={size}>
        {/* Background */}
        <circle
          stroke="#E5E7EB"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />

        {/* Progress */}
        <circle
          stroke={ui.stroke}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            transition: "stroke-dashoffset 0.6s ease",
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%",
          }}
        />
      </svg>

      {/* Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-xs">
        <span className="text-gray-500">Score</span>
        <span className="font-semibold">{score.toFixed(0)}/10</span>
      </div>
    </div>
  );
}