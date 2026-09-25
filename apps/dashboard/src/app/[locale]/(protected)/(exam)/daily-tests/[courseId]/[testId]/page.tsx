"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, CalendarDays, Clock, Eye, FileText, Info, Lightbulb, RefreshCw, Target, TrendingUp, Trophy } from "lucide-react";
import { Area, AreaChart, CartesianGrid, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Card } from "@clearcut/ui/card";
import { Button } from "@clearcut/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDailyTestFlowNavigation } from "@/components/features/daily-tests/hooks/useDailyTestFlowNavigation";
import { useDailyTestAttempts } from "@/components/features/daily-tests/hooks/useDailyTestAttempts";
import { SECONDS_PER_QUESTION } from "@/components/features/daily-tests/constants";
import InfoRow from "@/components/features/daily-tests/InfoRow";
import { DailyTestAttemptSummary } from "@/lib/api/dailyTests";

// Attempt History for ONE daily test: every completed attempt (same
// DailyTest, same questions each time), a "Attempt Again" action, and a
// View Result link per attempt. Lives under the daily-tests layout, so it
// gets the same sidebar shell as the Daily Tests list.

const DATE_LOCALES: Record<string, string> = { en: "en-GB", hi: "hi-IN", mr: "mr-IN" };

const percentOf = (a: { score: number; total_questions: number }) =>
  a.total_questions > 0 ? Math.round((a.score / a.total_questions) * 100) : 0;

type ResultTone = "excellent" | "good" | "practice" | "improve";
const toneFor = (pct: number): ResultTone =>
  pct >= 80 ? "excellent" : pct >= 60 ? "good" : pct >= 40 ? "practice" : "improve";

const TONE_CLASS: Record<ResultTone, string> = {
  excellent: "bg-green-50 text-[var(--icon-positive-normal)]",
  good: "bg-green-50 text-[var(--icon-positive-normal)]",
  practice: "bg-amber-50 text-[var(--color-warning-strong)]",
  improve: "bg-red-50 text-[var(--icon-negative-normal)]",
};

export default function DailyTestAttemptHistoryPage() {
  const flow = useDailyTestFlowNavigation();
  const t = useTranslations("DailyTests");
  const locale = useLocale();
  const params = useParams<{ courseId: string; testId: string }>();
  const { courseId, testId } = params;
  const { data, isLoading, isError } = useDailyTestAttempts(courseId, testId);

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(DATE_LOCALES[locale] ?? "en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [locale],
  );
  const dateTimeFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(DATE_LOCALES[locale] ?? "en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [locale],
  );

  const formatDuration = (seconds: number | null) => {
    if (seconds == null) return "-";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return minutes === 0
      ? t("history.timeSec", { seconds: secs })
      : t("history.timeMinSec", { minutes, seconds: secs });
  };

  const attempts = data?.attempts ?? [];
  // API returns newest first; the chart and first→best maths want oldest first.
  const chronological = useMemo(() => [...attempts].sort((a, b) => a.attempt_number - b.attempt_number), [attempts]);
  const first = chronological[0];
  const best = useMemo(
    () => chronological.reduce<DailyTestAttemptSummary | null>((b, a) => (!b || percentOf(a) > percentOf(b) ? a : b), null),
    [chronological],
  );
  const bestTime = useMemo(() => {
    const times = attempts.map((a) => a.time_taken_seconds).filter((s): s is number => s != null);
    return times.length ? Math.min(...times) : null;
  }, [attempts]);

  const improvementPoints = first && best ? percentOf(best) - percentOf(first) : 0;
  const improvementRelative =
    first && best && first.score > 0 ? Math.round(((best.score - first.score) / first.score) * 100) : null;

  const totalQuestions = data?.total_questions ?? first?.total_questions ?? 0;
  const durationMinutes = Math.round((totalQuestions * SECONDS_PER_QUESTION) / 60);
  const examName = data?.exam?.short_name ?? t("list.defaultExam");
  const testDate = data?.test_date ? dateFmt.format(new Date(data.test_date)) : "";
  const title = data?.is_today ? t("history.titleToday") : testDate ? t("history.titleDated", { date: testDate }) : t("list.defaultExam");

  const backToList = () => flow.goUp(`/daily-tests/${courseId}`);
  const attemptAgain = () => flow.push(`/daily-test-attempt/${courseId}/${testId}/new`);
  const viewResult = (attemptId: string) => flow.push(`/daily-test-attempt/${courseId}/${testId}/${attemptId}`);

  if (isError) {
    return (
      <div className="mx-auto max-w-[1200px] p-4 md:p-6">
        <p className="body-medium text-red-500">{t("history.loadFailed")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-4 p-4 md:p-6">
      <button
        onClick={backToList}
        className="body-medium flex w-fit cursor-pointer items-center gap-2 !font-medium text-brand"
      >
        <ArrowLeft size={16} />
        {t("history.back")}
      </button>

      {/* Header */}
      <Card bgcolor="white" border="border-gray-200" padding="16px" borderRadius={12}>
        {isLoading || !data ? (
          <Skeleton className="h-14 w-full" />
        ) : (
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand/9 text-brand">
                <CalendarDays size={22} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="heading-medium !font-semibold">{title}</h1>
                  {attempts.length > 0 && (
                    <span className="body-small rounded-full bg-green-50 px-3 py-1 !font-medium text-[var(--icon-positive-normal)]">
                      {t("history.attemptedTimes", { count: attempts.length })}
                    </span>
                  )}
                </div>
                <p className="body-medium text-surface-gray-muted">
                  {[testDate, examName].filter(Boolean).join(" • ")}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-1 md:items-end">
              <Button
                size="lg"
                sx={{ borderRadius: "50px", paddingX: "28px" }}
                disabled={data.locked}
                leftIcon={<RefreshCw size={16} />}
                onClick={attemptAgain}
              >
                {t("history.attemptAgain")}
              </Button>
              <p className="body-small text-surface-gray-muted">
                {data.locked ? t("history.lockedHint") : t("history.canAttemptMultiple")}
              </p>
            </div>
          </div>
        )}
      </Card>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <Card bgcolor="white" border="border-gray-200" padding="20px" borderRadius={12}>
            <h2 className="heading-small !font-semibold">{t("history.title")}</h2>
            <p className="body-medium mb-4 text-surface-gray-muted">{t("history.subtitle")}</p>

            {isLoading || !data ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-40 w-full rounded-xl" />
              </div>
            ) : attempts.length === 0 ? (
              <p className="body-medium text-surface-gray-muted">{t("history.noAttempts")}</p>
            ) : (
              <>
                {/* Summary tiles */}
                <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <SummaryTile
                    icon={<FileText size={20} />}
                    tone="bg-brand/9 text-brand"
                    value={String(attempts.length)}
                    label={t("history.totalAttempts")}
                  />
                  <SummaryTile
                    icon={<Trophy size={20} />}
                    tone="bg-green-50 text-[var(--icon-positive-normal)]"
                    value={best ? `${best.score} / ${best.total_questions}` : "-"}
                    label={t("history.bestScore")}
                    sub={best ? `(${percentOf(best)}%)` : undefined}
                  />
                  <SummaryTile
                    icon={<Clock size={20} />}
                    tone="bg-purple-50 text-purple-600"
                    value={formatDuration(bestTime)}
                    label={t("history.bestTime")}
                  />
                  <SummaryTile
                    icon={<TrendingUp size={20} />}
                    tone="bg-amber-50 text-[var(--color-warning-strong)]"
                    value={attempts.length > 1 ? `${improvementPoints >= 0 ? "+" : ""}${improvementPoints}%` : "-"}
                    label={t("history.improvement")}
                    sub={t("history.improvementSub")}
                  />
                </div>

                {/* Attempts table */}
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full min-w-[640px] text-left">
                    <thead className="bg-[var(--background-gray-subtle)]">
                      <tr className="body-medium !font-semibold text-surface-gray-normal">
                        <th className="px-4 py-3">{t("history.colNumber")}</th>
                        <th className="px-4 py-3">{t("history.colAttemptedAt")}</th>
                        <th className="px-4 py-3">{t("history.colTimeTaken")}</th>
                        <th className="px-4 py-3">{t("history.colScore")}</th>
                        <th className="px-4 py-3">{t("history.colResult")}</th>
                        <th className="px-4 py-3">{t("history.colAction")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attempts.map((a) => {
                        const pct = percentOf(a);
                        const tone = toneFor(pct);
                        return (
                          <tr key={a.attempt_id} className="border-t border-gray-100">
                            <td className="body-medium px-4 py-3 !font-semibold">{a.attempt_number}</td>
                            <td className="body-medium px-4 py-3">
                              {a.completed_at ? dateTimeFmt.format(new Date(a.completed_at)) : "-"}
                            </td>
                            <td className="body-medium px-4 py-3">{formatDuration(a.time_taken_seconds)}</td>
                            <td className="px-4 py-3">
                              <p className="body-medium !font-semibold leading-tight">
                                {a.score} / {a.total_questions}
                              </p>
                              <p className="body-small leading-tight text-surface-gray-muted">({pct}%)</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`body-small rounded-full px-3 py-1 !font-medium ${TONE_CLASS[tone]}`}>
                                {t(`history.${tone === "excellent" ? "excellent" : tone === "good" ? "goodEffort" : tone === "practice" ? "keepPracticing" : "needsImprovement"}`)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => viewResult(a.attempt_id)}
                                className="body-medium flex cursor-pointer items-center gap-2 rounded-md border border-brand px-4 py-1.5 !font-medium text-brand hover:bg-brand/9"
                              >
                                <Eye size={16} />
                                {t("history.viewResult")}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="body-medium mt-4 flex items-start gap-2 rounded-lg bg-[var(--color-primary-bg-soft)] px-4 py-3 text-brand">
                  <Info size={18} className="mt-0.5 shrink-0" />
                  <span>{t("history.note")}</span>
                </div>
              </>
            )}
          </Card>

          {/* Progress chart — only meaningful with 2+ attempts */}
          {data && chronological.length > 1 && (
            <Card bgcolor="white" border="border-gray-200" padding="20px" borderRadius={12}>
              <div className="flex flex-col gap-4 lg:flex-row">
                <div className="min-w-0 flex-1">
                  <h2 className="heading-small !font-semibold">{t("history.progressTitle")}</h2>
                  <p className="body-medium mb-2 text-surface-gray-muted">
                    {improvementPoints > 0 ? t("history.progressImproving") : t("history.progressKeepGoing")}
                  </p>
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chronological.map((a) => ({
                          name: t("history.chartAttempt", { number: a.attempt_number }),
                          score: a.score,
                          label: `${a.score} (${percentOf(a)}%)`,
                        }))}
                        margin={{ top: 24, right: 24, left: -16, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis domain={[0, totalQuestions || "auto"]} allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Area
                          type="monotone"
                          dataKey="score"
                          stroke="var(--color-brand)"
                          strokeWidth={2}
                          fill="var(--color-brand)"
                          fillOpacity={0.12}
                          dot={{ r: 4, fill: "var(--color-brand)", stroke: "var(--color-brand)" }}
                          isAnimationActive={false}
                        >
                          <LabelList dataKey="label" position="top" style={{ fontSize: 12 }} />
                        </Area>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-center justify-center gap-1 rounded-xl bg-[var(--color-primary-bg-soft)] p-5 text-center lg:w-[260px]">
                  <Target size={28} className="text-brand" />
                  <p className="body-medium text-surface-gray-muted">{t("history.improvedBy")}</p>
                  <p className="heading-large !font-bold text-brand">
                    {improvementRelative != null
                      ? `${improvementRelative >= 0 ? "+" : ""}${improvementRelative}%`
                      : `${improvementPoints >= 0 ? "+" : ""}${improvementPoints}%`}
                  </p>
                  {first && best && (
                    <p className="body-medium !font-medium">
                      {t("history.fromTo", {
                        from: `${first.score}/${first.total_questions}`,
                        to: `${best.score}/${best.total_questions}`,
                      })}
                    </p>
                  )}
                  <p className="body-small mt-2 italic text-surface-gray-muted">{t("history.quote")}</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Test information + tip */}
        <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-[300px]">
          <Card bgcolor="white" border="border-gray-200" padding="16px" borderRadius={12}>
            <div className="mb-3 flex items-center gap-2">
              <FileText size={18} className="text-brand" />
              <p className="body-large !font-semibold">{t("history.testInformation")}</p>
            </div>
            <div className="flex flex-col gap-3">
              <InfoRow icon={<FileText size={16} />} label={t("attempt.exam")} value={examName} />
              <InfoRow icon={<Clock size={16} />} label={t("attempt.section")} value={data?.section_name ?? "—"} />
              <InfoRow icon={<FileText size={16} />} label={t("attempt.totalQuestions")} value={String(totalQuestions)} />
              <InfoRow icon={<Clock size={16} />} label={t("attempt.totalMarks")} value={String(totalQuestions)} />
              <InfoRow
                icon={<Clock size={16} />}
                label={t("attempt.timeDuration")}
                value={t("attempt.minutesValue", { count: durationMinutes })}
              />
            </div>
          </Card>

          <div className="flex items-start gap-3 rounded-xl bg-[var(--color-primary-bg-soft)] p-4">
            <Lightbulb size={22} className="mt-0.5 shrink-0 text-brand" />
            <div>
              <p className="body-medium !font-semibold text-brand">{t("history.tip")}</p>
              <p className="body-medium text-surface-gray-muted">{t("history.tipBody")}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SummaryTile({
  icon,
  tone,
  value,
  label,
  sub,
}: {
  icon: React.ReactNode;
  tone: string;
  value: string;
  label: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-[var(--background-gray-subtle)] p-3">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tone}`}>{icon}</span>
      <div className="min-w-0">
        <p className="body-large !font-semibold leading-tight">{value}</p>
        <p className="body-small leading-tight text-surface-gray-muted">{label}</p>
        {sub && <p className="body-xsmall leading-tight text-surface-gray-muted">{sub}</p>}
      </div>
    </div>
  );
}
