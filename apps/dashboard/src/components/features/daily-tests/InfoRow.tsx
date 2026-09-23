import { memo } from "react";

type InfoRowProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  /** Smaller text / tighter spacing — used inside the attempt page's sidebar. */
  compact?: boolean;
};

/** Icon + small label over a bold value ("Exam / HTET"). */
function InfoRow({ icon, label, value, compact = false }: InfoRowProps) {
  return (
    <div className={`flex ${compact ? "items-center gap-2" : "items-start gap-3"}`}>
      <span className={`shrink-0 text-surface-gray-muted ${compact ? "" : "mt-0.5"}`}>{icon}</span>
      <div>
        <p className="body-small leading-tight text-surface-gray-muted">{label}</p>
        <p className={`${compact ? "body-small" : "body-medium"} !font-semibold leading-tight text-surface-gray-normal`}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default memo(InfoRow);
