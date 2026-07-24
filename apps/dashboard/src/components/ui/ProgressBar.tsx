type ProgressBarProps = {
  completed: number;
  total: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  showLabel?: boolean;
};

export default function ProgressBar({
  completed,
  total,
  height = 4,
  color = "#1677ff",
  backgroundColor = "#e5e7eb",
  showLabel = true,
}: ProgressBarProps) {
  const percentage =
    total > 0 ? Math.min((completed / total) * 100, 100) : 0;

  return (
    <div className="w-full">
      {showLabel && (
        <div className="mb-1 flex justify-end text-xs text-gray-500">
          {completed}/{total}
        </div>
      )}

      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height, backgroundColor }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}
