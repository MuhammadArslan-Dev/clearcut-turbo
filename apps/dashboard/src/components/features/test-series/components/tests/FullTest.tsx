"use client";

import SectionHeaderCard from "@/components/ui/cards/preparation/chapter-list/SectionHeaderCard";
import Text from "@clearcut/ui/text";
import {
  FullLengthTestListData,
  getFullLengthTestList,
} from "@/lib/tests/getExam";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import React, { useEffect, useMemo, useCallback } from "react";
import TestCard from "../cards/TestCard";
import { Button } from "@clearcut/ui/button";
import { useTestSeriesModalStore } from "../../store/useTestSeriesModalStore";
import { useTestListDataStore } from "../../store/useTestListDataStore";
import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";
import { Skeleton } from "@/components/ui/skeleton";
import StatusChip from "@/components/ui/cards/preparation/chapter-list/StatusChip";
import { CircleIcon } from "@/components/ui/icons";
import { highlightTextUtil } from "@/utils/text/highlightTextUtil";
import { ParsedPaperName } from "@/components/layout/preparation/BottomBar";
import useLanguageSwitch from "@/hooks/useLanguageSwitch";
import CounterCard from "@/components/ui/cards/CounterCard";
import { LockIcon } from "lucide-react";
import { useGetCurrentCourseStore } from "@/store/course/useGetCurrentCourseStore";
import {
  PaywallSource,
  usePaywallsStore,
} from "@/components/features/PayWalls/usePaywallsStore";
import { trackEvent } from "@/lib/analytics/browser";

interface FullTestProps {
  courseId?: string | number;
}

export default function FullTest({ courseId }: FullTestProps) {
  const t = useTranslations();
  const cardT = useTranslations("testListContent");

  const { get } = useQueryParams();
  const testType = get("testType");

  const { open } = useTestSeriesModalStore();
  const { paper, setData, setPaper, setPapers } = useTestListDataStore();

  const { course: courseData } = useGetCurrentCourseStore();
  // Reward animation nudges free/trial users on tests they can already
  // attempt — once the course is purchased ("active"), it stays hidden.
  const isFreeUser = courseData?.status !== "active";
  const { open: openPaywall } = usePaywallsStore();

  /* ======================= QUERY ======================= */

  const { data, isLoading, error } = useQuery<FullLengthTestListData>({
    queryKey: ["full-test", courseId],
    enabled: !!courseId,
    queryFn: async () => (await getFullLengthTestList(courseId)).data,
    // Without this, staleTime defaults to 0 — every tab switch back to
    // Full-length Papers re-fetches in the background (invisible here since
    // cached data still renders first, but still a wasted request each time).
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  /* ======================= INIT PAPERS ======================= */

  // Only seed `paper` the FIRST time (when nothing is selected yet) — `paper`
  // is one shared, cross-tab selection (PaperSwitch/ChangePaperModal already
  // treat it that way), so it shouldn't get reset to this tab's own default
  // just because the user switched to it after picking a paper elsewhere.
  useEffect(() => {
    if (!data?.paper?.length) return;

    setPapers(data.paper);
    if (!paper) setPaper(data.activePaper);
  }, [data, paper, setPapers, setPaper]);

  /* ======================= DERIVED DATA ======================= */

  const tests = useMemo(
    () => (paper?.id ? (data?.tests?.[paper.id] ?? []) : []),
    [data, paper?.id],
  );

  const attempts = useMemo(() => data?.attempts ?? [], [data]);

  const mandatoryTests = useMemo(
    () => tests.filter((t) => t.st_status === "mandatory"),
    [tests],
  );

  const optionalTests = useMemo(
    () => tests.filter((t) => t.st_status === "optional"),
    [tests],
  );

  /* ======================= HELPERS ======================= */

  const isTestAttempted = useCallback(
    (testId: number, paperId?: number) =>
      attempts.some((a: any) => a.test_id === testId && a.paper_id === paperId),
    [attempts],
  );

  const getTestAttemptScore = useCallback(
    (testId: number) => {
      if (!Array.isArray(attempts)) return null;
      const attempt = attempts.find(
        (a: any) => a.test_id === testId && a.paper_id === paper?.id,
      );
      if (!attempt) return null;
      return {
        score: attempt.correct_answers ?? attempt.result?.correct ?? 0,
        total: attempt.total_questions ?? 150,
      };
    },
    [attempts, paper?.id],
  );

  /* ======================= RECOMMENDED TEST ======================= */

  const recommendedTest = useMemo(() => {
    if (!mandatoryTests.length || !paper?.id) return null;

    const index = mandatoryTests.findIndex(
      (t) => !isTestAttempted(t.id, paper.id),
    );

    return {
      index: index !== -1 ? index : 0,
      test: mandatoryTests[index !== -1 ? index : 0],
    };
  }, [mandatoryTests, paper?.id, isTestAttempted]);

  /* ======================= PROGRESS ======================= */

  const completedMandatoryCount = useMemo(
    () => mandatoryTests.filter((t) => isTestAttempted(t.id, paper?.id)).length,
    [mandatoryTests, paper?.id, isTestAttempted],
  );

  /* ======================= STORE DATA ======================= */

  useEffect(() => {
    if (!tests.length) return;

    setData(
      {
        id: recommendedTest?.test?.id ?? 0,
        title: `Full-length Test ${recommendedTest?.index! + 1}`,
        paperId: paper?.id ?? 0,
        courseId: courseId ?? 0,
        test: recommendedTest?.test ?? null,
        totalQuestions: 150,
      },
      {
        title: `${completedMandatoryCount} / ${mandatoryTests.length} Full-length Test`,
        subtitle: "Weekly",
        total: mandatoryTests.length,
        completed: completedMandatoryCount,
        testType: "mock",
      },
    );
  }, [
    tests,
    recommendedTest,
    mandatoryTests.length,
    completedMandatoryCount,
    paper?.id,
    courseId,
    setData,
    testType,
  ]);

  /* ======================= PAYWALL ======================= */

  // const handleOpenPaywall = useCallback(
  //   (source: PaywallSource) => {
  //     openPaywall("preparation-paywall", courseData?.exam!, source);

  //     trackEvent("Purchase Intent Initiated", {
  //       entry_point: source,
  //       product_id: courseData?.exam?.short_name!,
  //     });
  //   },
  //   [openPaywall, courseData],
  // );

  /* ======================= CARD RENDER ======================= */

  const renderTestCard = useCallback(
    (test: any) => {
      const isCompleted = isTestAttempted(test.id, paper?.id);
      const isMandatory = test.st_status === "mandatory";
      const isLocked = !!test.locked;
      const isRecommended = recommendedTest?.test?.id === test.id;

      return (
        <TestCard
          key={test.id}
          title={cardT("testCard.fullLengthTitle", {
            number: test.order,
          })}
          chip={
            !isCompleted && (
              <StatusChip
                variant="outline"
                tone="info"
                className={
                  isMandatory
                    ? "h-5 !text-brand !bg-brand/9 body-small !font-normal"
                    : "h-5 !bg-[var(--icon-positive-normal)]/9 !text-[var(--icon-positive-normal)] !border-[var(--icon-positive-normal)] body-small !font-normal"
                }
                label={
                  isMandatory
                    ? cardT("testCard.mustAttempt")
                    : cardT("testCard.extraPractice")
                }
              />
            )
          }
          showReward={isFreeUser && !isLocked}
          counter={{
            value: isLocked ? (
              <CounterCard
                width="w-8"
                height="h-8"
                borderColor="border-[#0083ff] border-2"
                value={<LockIcon size={20} color="#0083ff" />}
              />
            ) : (
              test.order
            ),
            custom: isLocked,
            colorKey: isCompleted ? "success" : "info",
            variant: isCompleted ? "filled" : "simple",
          }}
          time={{ value: cardT("testCard.duration", { time: 150 }) }}
          score={(() => {
            if (!isCompleted) return undefined;
            const s = getTestAttemptScore(test.id);
            if (!s) return undefined;
            return { value: cardT("testCard.score", { score: s.score, total: s.total }) };
          })()}
          marks={{
            value: cardT("testCard.questionsInfo", {
              count: 150,
              marks: 1,
            }),
          }}
          unlock={{
            text: cardT("testCard.startTest"),
            isShow: isLocked,
            variant: isRecommended ? "solid" : "outlined",
            onClick: () =>
              openPaywall(
                "test-locked-modal",
                courseData?.exam!,
                "full_test_card_clicked",
                courseData,
              ),
          }}
          startTest={{
            text: cardT("testCard.startTest"),
            isShow: !isLocked,
            variant: isRecommended ? "solid" : "outlined",
            onClick: () =>
              isLocked
                ? openPaywall(
                    "test-locked-modal",
                    courseData?.exam!,
                    "full_test_card_clicked",
                    courseData,
                  )
                : open("pre-test-confirmation", { test }),
          }}
          viewReport={{
            text: cardT("testCard.viewReport"),
            isShow: isCompleted,
            onClick: () =>
              isLocked
                ? openPaywall(
                    "test-locked-modal",
                    courseData?.exam!,
                    "full_test_card_clicked",
                    courseData,
                  )
                : open("attempt-history", { test }),
          }}
        />
      );
    },
    [
      cardT,
      courseData,
      getTestAttemptScore,
      isTestAttempted,
      open,
      openPaywall,
      paper?.id,
      recommendedTest,
    ],
  );

  /* ======================= STATES ======================= */

  if (isLoading) return <FullTestSkeleton />;
  if (error) return <div>Error</div>;

  /* ======================= UI ======================= */

  return (
    <div className="flex flex-col gap-4">
      <div className="h-0.5 bg-gray-200" />
      <div className="flex flex-col gap-2">
       

        <div className="space-y-2">
          <div className="grid xl:grid-cols-2 px-3 py-3 md:rounded-md gap-y-3 gap-x-8 bg-brand/12">
            {mandatoryTests.map(renderTestCard)}
          </div>

          <div className="grid xl:grid-cols-2 px-3 gap-y-3 gap-x-8">
            {optionalTests.map(renderTestCard)}
          </div>
        </div>

        <div className="sticky md:flex hidden bottom-2 z-20 justify-center w-full">
          <ChangePaperButton />
        </div>
      </div>
    </div>
  );
}

export const ChangePaperButton = () => {
  const { paper } = useTestListDataStore();
  const { locale } = useLanguageSwitch();
  const changeP = useTranslations("modals.changePaper");
  const { open } = useTestSeriesModalStore();

  const parsedName = useMemo<ParsedPaperName>(() => {
    if (!paper?.name) return {};

    if (typeof paper.name === "object") return paper.name;

    try {
      return JSON.parse(paper.name);
    } catch {
      return {};
    }
  }, [paper?.name]);

  const localizedName = parsedName?.[locale]?.name ?? paper?.name ?? "";

  return (
    <div className="mx-h-[72px] max-w-[400px] md:rounded-xl flex items-center px-4 py-3 md:border md:border-brand bg-white">
      <div className="flex items-center justify-between w-full">
        <div className="hidden 2md:flex items-center gap-3 bg-[var(--color-primary-subtle)] rounded-md px-4 py-3">
          <Text
            as="span"
            variant="body-large"
            weight="normal"
            color="gray-muted"
            className="hidden 2lg:block truncate"
          >
            {highlightTextUtil(
              `${changeP("title")} : ${localizedName}`,
              [localizedName],
              "body-large text-surface-gray-subtle !font-semibold",
            )}
          </Text>

          <Button
            size="sm"
            variant="outlined"
            sx={{ borderRadius: "50px" }}
            onClick={() => open("change-paper-modal")}
          >
            <div className="flex items-center gap-2">
              <span className="body-small !font-semibold hidden lg:block">
                {changeP("title")}
              </span>
              <CircleIcon size={20} color="#0083ff" />
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};
/* -------------------------------------------------------------------------- */
/*                               SKELETON UI                                  */
/* -------------------------------------------------------------------------- */

const FullTestSkeleton = () => {
  return (
    <div className="flex flex-col gap-4 animate-pulse px-4">
      {/* Header */}
      <Skeleton className="h-12 rounded-md" />

      {/* Cards */}
      <div className="space-y-4">
        {[1, 2].map((row) => (
          <div key={row} className="grid xl:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="h-24 rounded-md" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
