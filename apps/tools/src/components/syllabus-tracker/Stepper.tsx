"use client";

import Text from "@clearcut/ui/text";
import type { Locale } from "@/lib/dictionary";
import { getSyllabusStrings } from "@/lib/syllabusTrackerStrings";

const DocumentIcon = ({ color }: { color: string }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h9l3 3v15H6z" />
    <path d="M9 12h6M9 16h6" />
  </svg>
);

const BarChartIcon = ({ color }: { color: string }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 20V10M12 20V4M18 20v-7" />
  </svg>
);

const TargetIcon = ({ color }: { color: string }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="0.5" fill={color} />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const STEP_KEYS = ["exam", "level", "dashboard"] as const;

/** Orientation stepper for the 3-step wizard (exam -> level -> dashboard —
 * every chapter is tracked by default, so there's no separate "customize
 * subjects" step). Purely presentational — SyllabusTrackerApp owns the
 * actual step state; this just reflects it. */
export default function Stepper({ step, locale = "en" }: { step: (typeof STEP_KEYS)[number] | "loading"; locale?: Locale }) {
  const t = getSyllabusStrings(locale);
  const STEPS = [
    { key: "exam", label: t.stepExamLabel, sub: t.stepExamSub, Icon: DocumentIcon },
    { key: "level", label: t.stepLevelLabel, sub: t.stepLevelSub, Icon: BarChartIcon },
    { key: "dashboard", label: t.stepTrackLabel, sub: t.stepTrackSub, Icon: TargetIcon },
  ] as const;
  const currentIndex = STEPS.findIndex((s) => s.key === step);
  if (currentIndex === -1) return null;

  return (
    <div className="mb-8" aria-label={t.stepperAriaLabel}>
      <div className="flex items-start">
        {STEPS.map((s, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          const numColor = done || active ? "white" : "var(--color-gray)";

          return (
            <div key={s.key} className="flex flex-1 flex-col last:flex-none">
              <div className="flex w-full items-center">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200 ${
                    done || active ? "bg-brand" : "border-2 border-[var(--color-border-gray-subtle)] bg-white"
                  }`}
                  style={active ? { boxShadow: "0 0 0 5px var(--color-primary-subtle)" } : undefined}
                >
                  {done ? (
                    <span className="text-white">
                      <CheckIcon />
                    </span>
                  ) : (
                    <span style={{ color: numColor }}>{i + 1}</span>
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`mx-1 h-0.5 flex-1 rounded-full transition-colors duration-300 ${done ? "bg-brand" : "bg-[var(--color-border-gray-subtle)]"}`} />
                )}
              </div>

              <div className="mt-2.5 flex items-center gap-2">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border"
                  style={{ borderColor: "var(--color-border-gray-subtle)", background: "white" }}
                >
                  <s.Icon color={active ? "var(--color-brand)" : done ? "var(--color-success)" : "var(--color-gray)"} />
                </div>
                <div className="hidden min-w-0 sm:block">
                  <Text as="p" variant="body-small" weight="semibold" color="gray-normal" className="truncate">
                    {s.label}
                  </Text>
                  <Text as="p" variant="body-xsmall" color="gray-muted" className="truncate">
                    {s.sub}
                  </Text>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
