"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ChevronIcon } from "@/components/ui/icons";
import PageSwitchTab from "@/components/features/preparation/components/PageSwitchTab";
import { useGetCurrentCourseStore } from "@/store/course/useGetCurrentCourseStore";
import { daysToExam, levelName } from "@/lib/dashboard/courseCardMeta";

/** Target tab shell (phase 99): the blue Target header + one scrolling column. */
export default function TargetShell({ children }: { children: ReactNode }) {
  // The blue header stays on screen (it does not hide on scroll), so no bottom tab mirror here.
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <TargetHeader />
      <main className="flex-1 overflow-y-auto bg-[var(--color-background-gray-subtle)] pb-8">{children}</main>
    </div>
  );
}

/**
 * Blue Target header (reference 2026-11-11): back, "🗓 N days to exam",
 * "{exam} {level}", then the Target | Course | Tests switch in white-on-blue.
 * Trial look for the Target tab only; Course / Tests keep their own topbar.
 */
function TargetHeader() {
  const t = useTranslations("myCourses");
  const { exam, course } = useGetCurrentCourseStore();
  const level = levelName((course as { metadata?: unknown } | null)?.metadata);
  const short = exam?.short_name ?? "";
  const title = level && short && level.toLowerCase() !== short.toLowerCase() ? `${short} ${level}` : short;
  const days = daysToExam((exam as { metadata?: unknown } | null)?.metadata);

  return (
    <header className="shrink-0 bg-[var(--color-brand-dark)] px-4 pt-3 pb-4 text-white md:px-6">
      <div className="mx-auto flex w-full max-w-[560px] items-center gap-3">
        <Link
          href="/dashboard"
          aria-label="Back"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15"
        >
          <ChevronIcon variant="left" size={16} color="currentColor" />
        </Link>
        <div className="min-w-0 flex-1">
          {days != null && (
            <p className="body-small !font-semibold text-white/85">
              <span aria-hidden="true">🗓 </span>
              {t("daysToExam", { days })}
            </p>
          )}
          <h1 className="truncate heading-large !font-bold text-white">{title}</h1>
        </div>
      </div>
      <div className="mx-auto mt-3 w-full max-w-[560px]">
        <PageSwitchTab tone="onBrand" layoutScopeId="target-header-tab" />
      </div>
    </header>
  );
}
