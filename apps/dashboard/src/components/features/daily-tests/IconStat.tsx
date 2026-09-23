export interface IconStatProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}

/** Shared by the exam header card and each DailyTestHistoryRow so the two
 * icon+value+label stat blocks in the mockup stay visually identical. */
export default function IconStat({ icon, value, label }: IconStatProps) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <div>
        <p className="body-medium !font-semibold leading-tight">{value}</p>
        <p className="body-xsmall leading-tight text-surface-gray-muted">{label}</p>
      </div>
    </div>
  );
}
