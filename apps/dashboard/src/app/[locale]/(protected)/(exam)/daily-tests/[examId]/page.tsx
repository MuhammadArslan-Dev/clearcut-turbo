"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Info, FileText } from "lucide-react";
import { useRouter, Link } from "@/i18n/navigation";
import { Card } from "@clearcut/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClockIcon, ChartSuccessBarIcon } from "@/components/ui/icons";
import IconStat from "@/components/features/daily-tests/IconStat";
import DailyTestHistoryRow from "@/components/features/daily-tests/DailyTestHistoryRow";
import PremiumUpsell from "@/components/features/daily-tests/PremiumUpsell";
import Pagination from "@/components/ui/widgets/pagination/Pagination";
import { useDailyTestHistory } from "@/components/features/daily-tests/hooks/useDailyTestHistory";
import { DailyTestHistoryItem } from "@/lib/api/dailyTests";

const PAGE_SIZE = 5;

export default function DailyTestHistoryPage() {
  const router = useRouter();
  const params = useParams<{ examId: string }>();
  const examId = params.examId;

  const { history, isError } = useDailyTestHistory(examId);
  const [page, setPage] = useState(1);

  // API returns tests oldest-first; the mockup ("Today's Test" pinned at the
  // top) reads most-recent-first.
  const tests = useMemo(() => (history ? [...history.tests].reverse() : []), [history]);

  const totalPages = Math.max(1, Math.ceil(tests.length / PAGE_SIZE));
  const pageTests = tests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAttempt = (test: DailyTestHistoryItem) => {
    if (test.locked) return;
    // Full-screen attempt experience lives outside daily-tests' own
    // DashboardShell-wrapped layout — see daily-test-attempt/layout.tsx.
    router.push(`/daily-test-attempt/${examId}/${test.daily_test_id}`);
  };

  const goToUpgrade = () => router.push(`/preparation/${examId}`);
  const goToProfile = () => router.push(`/dashboard/profile`);
  // No more standalone exam-picker to "explore more" in — daily tests are
  // personalized to the course the user is already enrolled in (see
  // DailyTestWidget on the Learn page), so this just returns there.
  const goToExploreMore = () => router.push(`/dashboard`);

  if (isError) {
    return (
      <div className="mx-auto max-w-[1200px] p-4 md:p-6">
        <p className="body-medium text-red-500">Failed to load test history. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] p-4 md:p-6">
      <div className="mb-5 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="heading-xlarge !font-bold mb-1">
            {history?.exam.short_name ?? "Daily Test"} – Daily Tests
          </h1>
          <p className="body-medium text-surface-gray-muted">
            Attempt today&apos;s test and improve your preparation.{" "}
            {history?.is_paid
              ? "Previous tests are also available for practice."
              : "Previous tests are available with Premium."}
          </p>
        </div>

        {history && (
          <PremiumUpsell
            variant="compact"
            active={history.is_paid}
            onAction={history.is_paid ? goToProfile : goToUpgrade}
          />
        )}
      </div>

      {/* Exam info row */}
      {!history ? (
        <Skeleton className="mb-5 h-24 w-full rounded-xl" />
      ) : (
        <Card bgcolor="white" padding="16px" borderRadius={12} className="!mb-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {history.exam.logo_url ? (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-gray-100">
                  <Image
                    src={history.exam.logo_url}
                    alt={history.exam.short_name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="h-12 w-12 shrink-0 rounded-full bg-gray-100" />
              )}
              <div>
                <p className="body-large !font-semibold">{history.exam.short_name}</p>
                <p className="body-small text-surface-gray-muted">{history.exam.name}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 md:gap-8">
              <IconStat
                icon={<FileText size={18} className="text-brand" />}
                value={history.total_tests}
                label="Total Tests"
              />
              <div className="h-8 w-px bg-gray-200" />
              <IconStat
                icon={<ChartSuccessBarIcon width={18} height={18} color="var(--color-brand)" />}
                value={
                  history.best_score ? `${history.best_score.score}/${history.best_score.total_questions}` : "-"
                }
                label="Best Score"
              />
              <div className="h-8 w-px bg-gray-200" />
              <IconStat
                icon={<ClockIcon size={18} color="var(--color-brand)" />}
                value={history.avg_time_minutes !== null ? `${history.avg_time_minutes} min` : "-"}
                label="Avg. Time"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Free-plan banner */}
      {history && !history.is_paid && (
        <div className="body-small mb-4 flex items-center gap-1.5 text-surface-gray-muted">
          <Info size={16} />
          <span>
            You are on Free Plan. Only today&apos;s test is available.{" "}
            <Link href={`/preparation/${examId}`} className="!font-semibold text-brand underline">
              Upgrade to unlock all tests.
            </Link>
          </span>
        </div>
      )}

      {!history ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : tests.length === 0 ? (
        <p className="body-medium text-surface-gray-muted">No daily tests generated yet — check back soon.</p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {pageTests.map((test) => (
              <DailyTestHistoryRow
                key={test.daily_test_id}
                test={test}
                title={testTitle(test.test_date)}
                isToday={test.test_date === dateKey(new Date())}
                onAttempt={() => handleAttempt(test)}
              />
            ))}
          </div>

          <div className="mt-4 flex flex-col items-center justify-between gap-3 md:flex-row">
            <p className="body-small text-surface-gray-muted">
              Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, tests.length)} of {tests.length}{" "}
              tests
            </p>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>

          <div className="mt-5">
            <PremiumUpsell
              variant="banner"
              active={history.is_paid}
              onAction={history.is_paid ? goToExploreMore : goToUpgrade}
            />
          </div>
        </>
      )}
    </div>
  );
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function testTitle(testDate: string): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (testDate === dateKey(today)) return "Today's Test";
  if (testDate === dateKey(yesterday)) return "Yesterday's Test";

  const formatted = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(testDate));
  return `${formatted} Test`;
}
