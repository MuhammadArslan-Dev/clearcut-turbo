"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Info } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Card } from "@clearcut/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import DailyTestHistoryRow from "@/components/features/daily-tests/DailyTestHistoryRow";
import PremiumUpsell from "@/components/features/daily-tests/PremiumUpsell";
import InfoStrip from "@/components/features/attempt-ui/InfoStrip";
import Pagination from "@/components/ui/widgets/pagination/Pagination";
import { useDailyTestFlowNavigation } from "@/components/features/daily-tests/hooks/useDailyTestFlowNavigation";
import { useEnrollmentForCourse } from "@/components/features/daily-tests/hooks/useEnrollmentForCourse";
import { usePaywallsStore } from "@/components/features/PayWalls/usePaywallsStore";
import { useDailyTestHistory } from "@/components/features/daily-tests/hooks/useDailyTestHistory";
import { DailyTestHistoryItem } from "@/lib/api/dailyTests";

// Same lazy-loaded interstitial the preparation/test-series shells mount.
const LockedContentModal = dynamic(() => import("@/components/features/PayWalls/LockedContentModal"), { ssr: false });

const PAGE_SIZE = 5;

export default function DailyTestHistoryPage() {
  const router = useRouter();
  const flow = useDailyTestFlowNavigation();
  const t = useTranslations("DailyTests");
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;

  const { history, isError } = useDailyTestHistory(courseId);
  const [page, setPage] = useState(1);

  // API returns tests oldest-first; the design pins "Today's Test" at the top.
  const tests = useMemo(() => (history ? [...history.tests].reverse() : []), [history]);

  // Months that have tests, newest first ("2026-09"); always shows the latest month.
  const months = useMemo(() => Array.from(new Set(tests.map((x) => x.test_date.slice(0, 7)))), [tests]);
  const activeMonth = months[0] ?? "";
  const monthTests = useMemo(() => tests.filter((x) => x.test_date.startsWith(activeMonth)), [tests, activeMonth]);

  const totalPages = Math.max(1, Math.ceil(monthTests.length / PAGE_SIZE));
  const pageTests = monthTests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAttempt = (test: DailyTestHistoryItem) => {
    // Locked rows open the same unlock modal as the Upgrade CTAs.
    if (test.locked) {
      goToUpgrade();
      return;
    }
    // Full-screen attempt experience lives outside daily-tests' own
    // DashboardShell-wrapped layout — see daily-test-attempt/layout.tsx.
    flow.push(`/daily-test-attempt/${courseId}/${test.test_id}`);
  };

  const course = useEnrollmentForCourse(courseId);
  const openPaywall = usePaywallsStore((s) => s.open);
  // Every Upgrade CTA opens the shared unlock modal; its "Unlock Now"
  // continues to the existing /payment/initiated flow.
  const goToUpgrade = () => {
    if (!course?.exam) return;
    openPaywall("daily-tests-locked-modal", course.exam, "daily_tests_page_clicked", course);
  };
  const goToProfile = () => router.push(`/dashboard/profile`);

  if (isError) {
    return (
      <div className="mx-auto max-w-[1200px] p-4 md:p-6">
        <p className="body-medium text-red-500">{t("list.loadFailed")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-4 p-4 md:p-6">
      {/* Header: exam, title, upgrade card, tabs, info strip */}
      <Card bgcolor="white" border="border-gray-200" padding="20px" borderRadius={12} className="!h-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-4">
            {history?.exam.logo_url ? (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-gray-100">
                <Image src={history.exam.logo_url} alt={history.exam.short_name} fill className="object-cover" unoptimized />
              </div>
            ) : (
              <div className="h-16 w-16 shrink-0 rounded-full bg-gray-100" />
            )}
            <div>
              <h1 className="heading-xlarge !font-bold">
                {t("list.title", { exam: history?.exam.short_name ?? t("list.defaultExam") })}
              </h1>
              <p className="body-medium text-surface-gray-muted">{history?.exam.name ?? ""}</p>
            </div>
          </div>

          {history && (
            <PremiumUpsell
              variant="compact"
              active={history.is_paid}
              onAction={history.is_paid ? goToProfile : goToUpgrade}
            />
          )}
        </div>

        <p className="body-medium mt-3 text-surface-gray-muted">{t("list.headerDesc")}</p>

        <div className="mt-4">
          <InfoStrip>{t("list.infoStrip")}</InfoStrip>
        </div>
      </Card>

      <div className="flex flex-col gap-4">
        {/* Main card */}
        <Card bgcolor="white" border="border-gray-200" padding="20px" borderRadius={12} className="!h-auto min-w-0">
          <>
              {history && !history.is_paid && (
                <div className="body-small mb-4 flex items-center gap-1.5 text-surface-gray-muted">
                  <Info size={16} />
                  <span>
                    {t("list.freePlan")}{" "}
                    <button type="button" onClick={goToUpgrade} className="!font-semibold text-brand underline cursor-pointer">
                      {t("list.upgradeToUnlock")}
                    </button>
                  </span>
                </div>
              )}

              {!history ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                  ))}
                </div>
              ) : monthTests.length === 0 ? (
                <p className="body-medium text-surface-gray-muted">{t("list.noTests")}</p>
              ) : (
                <>
                  <div className="flex flex-col gap-3">
                    {pageTests.map((test) => (
                      <DailyTestHistoryRow
                        key={test.test_id}
                        test={test}
                        title={testTitle(test.test_date, t)}
                        isToday={test.test_date === dateKey(new Date())}
                        onAttempt={() => handleAttempt(test)}
                        onViewHistory={() => flow.push(`/daily-tests/${courseId}/${test.test_id}`)}
                        onAttemptAgain={() => flow.push(`/daily-test-attempt/${courseId}/${test.test_id}/new`)}
                      />
                    ))}
                  </div>

                  <div className="mt-4 flex flex-col items-center justify-between gap-3 md:flex-row">
                    <p className="body-small text-surface-gray-muted">
                      {t("list.showing", {
                        from: (page - 1) * PAGE_SIZE + 1,
                        to: Math.min(page * PAGE_SIZE, monthTests.length),
                        total: monthTests.length,
                      })}
                    </p>
                    <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                  </div>
                </>
              )}
          </>
        </Card>
      </div>

      <LockedContentModal />
    </div>
  );
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// "Today's Test" / "Yesterday's Test" / "Daily Test" — the date itself is shown
// in the row's date block.
function testTitle(testDate: string, t: (key: string) => string): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (testDate === dateKey(today)) return t("list.today");
  if (testDate === dateKey(yesterday)) return t("list.yesterday");
  return t("list.defaultExam");
}
