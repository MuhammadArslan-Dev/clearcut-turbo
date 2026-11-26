import clsx from "clsx";
import { creditDots } from "@/lib/freeCredits/ui";

/** Row of credit dots (approved design): filled = a free test still left, empty = used. */
export default function FreeCreditDots({
  limit,
  remaining,
  className,
  size = "md",
}: {
  limit: number;
  remaining: number;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span className={clsx("inline-flex items-center", size === "sm" ? "gap-1" : "gap-1.5", className)} aria-hidden="true">
      {creditDots(limit, remaining).map((left, i) => (
        <span
          key={i}
          className={clsx(
            "shrink-0 rounded-full",
            size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5",
            left ? "bg-brand" : "border border-gray-300 bg-[var(--background-gray-subtle)]",
          )}
        />
      ))}
    </span>
  );
}
