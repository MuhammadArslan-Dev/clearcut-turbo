import Text from "@clearcut/ui/text";

type StatusCountRowProps = {
  label: string;
  count: number;
  /** Tailwind bg class for the status dot, e.g. "bg-gray-300". */
  color: string;
  /** Text color class for the count, e.g. "text-surface-gray-muted". */
  textColor: string;
};

/** Colored dot + label on the left, bold count on the right — the question
 * navigator legend row shared by the Daily Test and full-length exam attempt
 * screens (see attempt-ui/README notes in DEVELOPMENT_RULES.md). */
export default function StatusCountRow({ label, count, color, textColor }: StatusCountRowProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} aria-hidden />
        <Text as="p" variant="body-small" color="gray-muted">
          {label}
        </Text>
      </div>
      <Text as="p" variant="body-small" weight="semibold" className={textColor}>
        {count}
      </Text>
    </div>
  );
}
