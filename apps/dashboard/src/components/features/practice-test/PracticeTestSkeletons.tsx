"use client";

import { Skeleton } from "@/components/ui/skeleton";
import PracticeFooter from "./PracticeFooter";

/**
 * Loading states of the Practice Test and its result. Built from the SAME
 * wrappers, paddings, breakpoints and block sizes as the real screens
 * (PracticeTestPage / PracticeTestResult), one skeleton per element, so nothing
 * jumps when the data arrives: topbar, progress strip, navigator, question card
 * (meta bar, title, text, 4 options), skip card, pinned footer, phone dock.
 * Change a screen's layout -> change it here too.
 */

function TopbarSkeleton({ skip = true }: { skip?: boolean }) {
  return (
    <header className="border-b border-slate-200 bg-white" aria-hidden="true">
      <div className="flex min-h-[46px] items-center justify-between gap-3 px-3 py-2 md:min-h-[78px] md:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Skeleton className="hidden h-[44px] w-[130px] md:block" rounded="rounded-lg" />
          <div className="hidden h-10 w-px bg-gray-200 md:block" />
          <div className="min-w-0 space-y-1.5">
            <Skeleton className="h-5 w-40 sm:w-56" />
            <Skeleton className="hidden h-4 w-44 sm:block" />
          </div>
        </div>
        <div className="hidden flex-1 items-center justify-center px-4 xl:flex">
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Skeleton className="h-[30px] w-[30px]" rounded="rounded-md" />
          {skip && <Skeleton className="h-9 w-[70px] sm:w-[200px]" rounded="rounded-full" />}
        </div>
      </div>
    </header>
  );
}

const cardClass = "rounded-xl bg-white shadow-sm max-lg:!rounded-none";

export function PracticeTestSkeleton() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--background-gray-subtle)]" role="status" aria-busy="true">
      <TopbarSkeleton />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full max-w-[1280px] flex-col gap-4 py-4 lg:px-4">
          {/* progress strip: position + percent, the bar, tip card (lg) */}
          <div className={`${cardClass} p-5`}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-[6px] w-full" rounded="rounded-full" />
              </div>
              <div className="hidden h-12 w-px bg-gray-200 lg:block" />
              <Skeleton className="hidden h-[80px] w-[380px] lg:block" rounded="rounded-lg" />
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-1 lg:flex-row lg:items-start">
            {/* question navigator (lg) */}
            <aside className="hidden w-[240px] shrink-0 flex-col gap-4 lg:flex xl:w-[260px]">
              <div className={`${cardClass} p-4`}>
                <Skeleton className="mb-3 h-6 w-28" />
                <div className="mb-3 flex flex-col gap-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-4" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
                <Skeleton className="mt-4 h-[44px] w-full" rounded="rounded-full" />
              </div>
            </aside>

            {/* question card */}
            <div className="flex min-w-0 flex-1 flex-col gap-4 lg:self-stretch">
              <div className={`${cardClass} p-4 lg:flex-1`}>
                <div className="mb-3 flex items-center justify-between gap-4">
                  <Skeleton className="h-8 w-28" rounded="rounded-lg" />
                  <Skeleton className="h-6 w-44" />
                </div>
                <Skeleton className="mb-3 h-7 w-44" />
                <div className="space-y-2.5">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-[92%]" />
                  <Skeleton className="h-5 w-[60%]" />
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-[54px] w-full" rounded="rounded-lg" />
                  ))}
                </div>
              </div>
            </div>

            {/* skip card (lg) */}
            <aside className="hidden w-[240px] shrink-0 flex-col gap-4 lg:flex xl:w-[260px]">
              <Skeleton className="h-[140px] w-full" rounded="rounded-xl" />
            </aside>
          </div>
        </div>
      </div>

      <PracticeFooter withSidebarGutter>
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-11 w-[120px] sm:w-[215px]" rounded="rounded-full" />
          <Skeleton className="h-11 w-[170px] sm:w-[198px]" rounded="rounded-full" />
        </div>
      </PracticeFooter>

      {/* phone: the collapsed "Questions" dock */}
      <div className="shrink-0 border-t border-gray-200 bg-white lg:hidden">
        <div className="flex flex-col items-center gap-1.5 pb-1 pt-1.5">
          <Skeleton className="h-1 w-10" rounded="rounded-full" />
          <div className="flex w-full items-center justify-between px-4">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** The panel that opens under a question while its explanation is being fetched (heading row + the soft text box). */
export function ExplanationSkeleton() {
  return (
    <div className="flex flex-col gap-4 py-3" role="status" aria-busy="true">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-36" />
      </div>
      <div className="space-y-2.5 rounded-lg bg-[var(--color-primary-bg-soft)] p-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[90%]" />
        <Skeleton className="h-4 w-[70%]" />
      </div>
    </div>
  );
}

export function PracticeTestResultSkeleton() {
  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-white" role="status" aria-busy="true">
      <div
        className="pointer-events-none absolute inset-0 bg-[var(--color-primary-bg-soft)]/40 md:bg-gradient-to-b md:from-[var(--color-primary-bg-soft)] md:via-white md:to-white"
        aria-hidden="true"
      />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <TopbarSkeleton skip={false} />

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-[1405px] flex-col gap-4 px-0 py-4 md:p-4 md:py-4 lg:w-[84%] lg:min-w-[980px] lg:px-0">
            {/* greeting */}
            <div className="grid items-center gap-2 px-4 text-left md:px-0 md:text-center lg:grid-cols-[1fr_auto_1fr]">
              <span className="hidden lg:block" aria-hidden="true" />
              <div className="flex flex-col gap-2 md:items-center">
                <Skeleton className="h-[30px] w-60 md:h-12 md:w-[420px]" />
                <Skeleton className="h-6 w-56" />
              </div>
              <Skeleton className="hidden h-[142px] w-[170px] justify-self-start lg:block" rounded="rounded-xl" />
            </div>

            {/* score card + next step */}
            <div className="grid items-stretch gap-4 lg:grid-cols-[1.36fr_1fr]">
              <div className="min-h-[344px] rounded-2xl bg-white p-[14px_24px] sm:min-h-[202px] shadow-sm max-md:!rounded-none">
                <div className="flex h-full flex-col items-center gap-6 sm:flex-row">
                  <Skeleton className="h-[160px] w-[160px] shrink-0" rounded="rounded-full" />
                  <div className="flex w-full flex-col items-start gap-3">
                    <Skeleton className="h-9 w-40" rounded="rounded-lg" />
                    <Skeleton className="h-7 w-full max-w-[360px]" />
                    <Skeleton className="h-5 w-full max-w-[420px]" />
                    <Skeleton className="h-5 w-[70%] max-w-[300px]" />
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-white p-3 shadow-sm max-md:min-h-[140px] max-md:!rounded-none">
                <div className="flex h-full flex-col justify-center rounded-xl bg-[var(--color-primary-bg-soft)] p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-[60px] w-[60px] shrink-0" rounded="rounded-full" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-[75%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* five stat cards */}
            <div className="grid grid-cols-2 gap-px md:grid-cols-5 md:gap-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className={`flex flex-col items-center gap-2 rounded-[14px] bg-white p-4 shadow-sm max-md:!rounded-none md:min-h-[84px] md:flex-row md:gap-4 ${i === 4 ? "max-md:hidden" : ""}`}>
                  <Skeleton className="h-12 w-12 shrink-0 md:h-[52px] md:w-[52px]" rounded="rounded-full" />
                  <div className="flex min-w-0 flex-col items-center md:items-start md:flex-1 md:space-y-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-5 w-24 max-md:mt-0 md:h-4" />
                  </div>
                </div>
              ))}
            </div>

            {/* question-wise table */}
            <div className="rounded-2xl bg-white p-[20px_24px] shadow-sm max-md:min-h-[410px] max-md:!rounded-none">
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-7 w-64" />
                  <Skeleton className="h-4 w-80 max-w-full" />
                </div>
                <Skeleton className="h-4 w-64" />
              </div>
              <div className="mb-1 hidden h-10 rounded-lg bg-[var(--background-gray-subtle)] md:block" aria-hidden="true" />
              <div className="flex flex-col divide-y divide-gray-200">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-1 py-2.5 md:px-3">
                    <Skeleton className="h-5 w-6" />
                    <Skeleton className="h-5 flex-1" />
                    <Skeleton className="h-6 w-6" rounded="rounded-full" />
                    <Skeleton className="h-8 w-[84px] md:w-[170px]" rounded="rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <PracticeFooter maxWidth="max-w-[1405px]" align="center">
          <div className="flex flex-col md:flex-row md:justify-center">
            <Skeleton className="h-[45px] w-full md:w-[424px]" rounded="rounded-full" />
          </div>
        </PracticeFooter>
      </div>
    </div>
  );
}
