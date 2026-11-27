import clsx from "clsx";
import { creditDots } from "@/lib/freeCredits/ui";

/**
 * Row of credit dots: a blue dot with a white tick = a free test already used, an empty grey ring = still left.
 * The text counter next to it ("N of 5 free tests left") is the accessible label.
 */
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
  const box = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <span className={clsx("inline-flex items-center", size === "sm" ? "gap-1" : "gap-1.5", className)} aria-hidden="true">
      {/* used (blue) fill from the left, the ones still left (grey) follow on the right */}
      {[...creditDots(limit, remaining)].reverse().map((isLeft, i) =>
        isLeft ? (
          <span key={i} className={clsx("shrink-0 rounded-full border border-gray-300 bg-[var(--background-gray-subtle)]", box)} />
        ) : (
          <span key={i} className={clsx("inline-flex shrink-0 items-center justify-center rounded-full bg-brand text-white", box)}>
            <svg viewBox="0 0 10 10" className="h-2 w-2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 5.2 4.2 7.4 8 3" />
            </svg>
          </span>
        ),
      )}
    </span>
  );
}
