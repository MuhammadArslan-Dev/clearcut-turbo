"use client";

import { Button } from "@mui/joy";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import TestCard from "../cards/TestCard";
import Text from "@clearcut/ui/text";
import SectionHeaderCard from "@/components/ui/cards/preparation/chapter-list/SectionHeaderCard";
import { useTranslations } from "next-intl";
import StatusChip from "@/components/ui/cards/preparation/chapter-list/StatusChip";
import { useTestSeriesModalStore } from "../../store/useTestSeriesModalStore";
import { useTestListDataStore } from "../../store/useTestListDataStore";
import { useQuery } from "@tanstack/react-query";
import {
  getChapterTestList,
  SectionalTestItem,
  SectionalTestV2Data,
  SectionalSection,
  ChapterItem,
} from "@/lib/tests/getExam";
import { Skeleton } from "@/components/ui/skeleton";
import { LockIcon } from "@/components/ui/icons";
import { ChangePaperButton } from "./FullTest";
import CounterCard from "@/components/ui/cards/CounterCard";
import { useGetCurrentCourseStore } from "@/store/course/useGetCurrentCourseStore";
import { trackEvent } from "@/lib/analytics/browser";
import { handleOpenPaywall } from "@/components/features/PayWalls/PaywallFloatingWidget";
import { useRouter } from "@/i18n/navigation";
import SectionSwitchUI from "@/components/ui/tabs/SectionSwitchUI";
import { TabItem } from "@/components/ui/tabs/TabSwitch";
import { ArrowRightIcon } from "lucide-react";
import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";

interface ChapterTestProps {
  courseId?: string | number;
}

export default React.memo(function ChapterTest({ courseId }: ChapterTestProps) {
  const t = useTranslations();
  const cardT = useTranslations("testListContent");
  const router = useRouter();

  const { course: courseData } = useGetCurrentCourseStore();
  const { open } = useTestSeriesModalStore();
  const { paper, setData, setPaper, setPapers } = useTestListDataStore();
  const { set: setQueryParam } = useQueryParams();

  const [selectedSection, setSelectedSection] = useState<SectionalSection | null>(null);

  /* ================= QUERY ================= */

  const { data, isLoading, error, refetch } = useQuery<SectionalTestV2Data>({
    queryKey: ["chapter-test", courseId, paper?.id ?? null],
    enabled: !!courseId,
    queryFn: async () => {
      const res = await getChapterTestList(courseId, paper?.id);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  /* ================= DATA INIT ================= */

  useEffect(() => {
    if (!data?.papers?.length) return;
    setPapers(data.papers);
    setPaper(data.paper);
  }, [data, setPaper, setPapers]);

  // Reset to null when paper changes; auto-select below will pick first section
  useEffect(() => {
    setSelectedSection(null);
  }, [paper?.id]);

  /* ================= DERIVED DATA ================= */

  const sections = useMemo(() => data?.sections ?? [], [data]);

  // Auto-switch to sectional-tests if chapter test data is empty after loading
  useEffect(() => {
    if (!isLoading && !error && data && sections.length === 0) {
      setQueryParam({ testType: "chapter-tests" });
    }
  }, [isLoading, error, data, sections.length, setQueryParam]);

  // Auto-select first section once sections load
  useEffect(() => {
    if (sections.length > 0 && !selectedSection) {
      setSelectedSection(sections[0]);
    }
  }, [sections, selectedSection]);

  const sectionItems = useMemo<TabItem[]>(
    () => sections.map((s) => ({ id: String(s.id), label: s.name })),
    [sections],
  );

  const activeChapters = useMemo(
    () =>
      selectedSection
        ? selectedSection.chapters.filter((c) => c.total_tests > 0 || c.tests.length > 0)
        : [],
    [selectedSection],
  );

  /* ================= RECOMMENDED TEST (scoped to selected section) ================= */

  const sectionRecommendedTest = useMemo(() => {
    if (!selectedSection) return null;
    for (const chapter of selectedSection.chapters) {
      const pending = chapter.tests.find((t) => t.is_mandatory && !t.is_attempted);
      if (pending) return { chapter, test: pending };
    }
    for (const chapter of selectedSection.chapters) {
      const first = chapter.tests.find((t) => t.is_mandatory);
      if (first) return { chapter, test: first };
    }
    return null;
  }, [selectedSection]);

  const sectionTotalChapters = useMemo(
    () => selectedSection?.chapters.length ?? 0,
    [selectedSection],
  );

  const sectionCompletedChapters = useMemo(
    () =>
      selectedSection?.chapters.filter(
        (c) => c.mandatory_count > 0 && c.attempted_count >= c.mandatory_count,
      ).length ?? 0,
    [selectedSection],
  );

  /* ================= STORE DATA (sidebar) ================= */

  useEffect(() => {
    if (!sectionRecommendedTest || !selectedSection) return;
    setData(
      {
        id: sectionRecommendedTest.test.id,
        title: `${sectionRecommendedTest.chapter.name} - Chapter Test ${sectionRecommendedTest.test.test_number}`,
        paperId: data?.paper?.id ?? 0,
        courseId: courseId ?? 0,
        test: sectionRecommendedTest.test as any,
        totalQuestions: sectionRecommendedTest.test.number_of_questions,
      },
      {
        title: `${sectionCompletedChapters} / ${sectionTotalChapters} Chapter Test`,
        subtitle: selectedSection.name,
        total: sectionTotalChapters,
        completed: sectionCompletedChapters,
        testType: "chapter",
      },
    );
  }, [
    sectionRecommendedTest,
    selectedSection,
    sectionCompletedChapters,
    sectionTotalChapters,
    data?.paper?.id,
    courseId,
    setData,
  ]);

  /* ================= ACTION HANDLERS ================= */

  const handleStartTest = useCallback(
    (test: SectionalTestItem, chapter: ChapterItem) => {
      open("pre-test-confirmation", {
        test: {
          ...test,
          order: String(test.test_number),
          st_status: test.is_mandatory ? "mandatory" : "optional",
        } as any,
        sectionId: chapter.id,
      });
      trackEvent("Test Card Clicked", {
        test_id: test.id.toString(),
        test_name: "Chapter Test " + test.test_number,
        test_status: test.is_mandatory ? "mandatory" : "optional",
      });
    },
    [open],
  );

  const handleViewHistory = useCallback(
    (test: SectionalTestItem, chapter: ChapterItem) => {
      open("attempt-history", {
        test: {
          ...test,
          order: String(test.test_number),
          st_status: test.is_mandatory ? "mandatory" : "optional",
          metadata: {
            ...((test as any).metadata ?? {}),
            section_name: selectedSection?.name ?? "",
            chapter_name: chapter.name ?? "",
          },
        } as any,
        sectionId: chapter.id,
      });
      trackEvent("Test Details Viewed", {
        test_id: test.id.toString(),
        test_name: "Chapter Test " + test.test_number,
        source: "test_dashboard",
        test_type: "chapter",
        test_status: test.is_mandatory ? "mandatory" : "optional",
        attempt_number: 1,
        is_retake: false,
      });
    },
    [open, selectedSection],
  );

  /* ================= RENDER TEST CARD ================= */

  const renderTestCard = useCallback(
    (test: SectionalTestItem, chapter: ChapterItem) => {
      const isCompleted = test.is_attempted;
      const isLocked = !!test.locked;
      const isRecommended =
        sectionRecommendedTest?.test.id === test.id &&
        sectionRecommendedTest?.chapter.id === chapter.id;
      const durationMin = Math.round(10);

      return (
        <TestCard
          key={test.id}
          title={cardT("testCard.chapterTitle", { number: test.test_number })}
          chip={
            !isCompleted && (
              <StatusChip
                variant="outline"
                tone="info"
                className="h-5 !text-brand !bg-brand/9 body-small !font-normal"
                label={cardT("testCard.mustAttempt")}
              />
            )
          }
          counter={{
            value: isLocked ? (
              <CounterCard
                width="w-8"
                height="h-8"
                borderColor="border-[#0083ff] border-2"
                value={<LockIcon size={20} color="#0083ff" />}
              />
            ) : (
              test.test_number
            ),
            custom: isLocked,
            colorKey: isCompleted ? "success" : "info",
            variant: isCompleted ? "filled" : "simple",
          }}
          time={{ value: cardT("testCard.duration", { time: durationMin }) }}
          score={
            isCompleted && test.attempt
              ? {
                value: cardT("testCard.score", {
                  score:
                    test.attempt?.correct_answers ?? test.attempt?.result?.correct ?? 0,
                  total: test.attempt?.total_questions ?? test.number_of_questions,
                }),
              }
              : undefined
          }
          marks={{
            value: cardT("testCard.questionsInfo", {
              count: test.number_of_questions,
              marks: 1,
            }),
          }}
          unlock={{
            text: cardT("testCard.startTest"),
            isShow: isLocked,
            variant: isRecommended ? "solid" : "outlined",
            onClick: () => handleOpenPaywall(router, "full_test_card_clicked", courseData),
          }}
          startTest={{
            text: cardT("testCard.startTest"),
            isShow: !isLocked,
            variant: isRecommended ? "solid" : "outlined",
            onClick: () =>
              isLocked
                ? handleOpenPaywall(router, "full_test_card_clicked", courseData)
                : handleStartTest(test, chapter),
          }}
          viewReport={{
            text: cardT("testCard.viewReport"),
            isShow: isCompleted,
            onClick: () =>
              isLocked
                ? handleOpenPaywall(router, "full_test_card_clicked", courseData)
                : handleViewHistory(test, chapter),
          }}
          announcement={isRecommended ? "Next recommended chapter test" : undefined}
        />
      );
    },
    [cardT, courseData, handleStartTest, handleViewHistory, sectionRecommendedTest, router],
  );

  /* ================= LOADING / ERROR STATES ================= */

  if (isLoading) return <ChapterTestSkeleton />;

  if (error)
    return (
      <div className="py-8 text-center space-y-3">
        <p>Failed to load tests.</p>
        <Button size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );

  if (!data) return <div>No data found</div>;
  if (!sections.length)
    return <div className="py-8 text-center">No sections available.</div>;

  /* ================= UI ================= */

  return (
    <div className="flex flex-col gap-4 md:pb-16">

      {/* ── Section Tabs ── */}
      <div className="sticky top-0 z-20 w-full flex justify-center bg-white">
        <SectionSwitchUI
          layoutId="chapter-test-section-tab"
          items={sectionItems}
          active={selectedSection?.id?.toString() ?? null}
          changeSection={(id) => {
            const section = sections.find((s) => String(s.id) === id);
            if (section) setSelectedSection(section);
          }}
        />
      </div>

      {/* ── Chapter list for selected section ── */}
      {!activeChapters.length ? (
        <div className="py-8 text-center text-surface-gray-muted">
          No chapter tests available for this section.
        </div>
      ) : (
        <>
          {activeChapters.map((chapter, chapterIndex) => {
            const mandatoryTests = chapter.tests.filter((t) => t.is_mandatory);
            const optionalTests = chapter.tests.filter((t) => !t.is_mandatory);

            return (
              <React.Fragment key={chapter.id}>
                <div className="h-0.5 bg-gray-200" />

                <div className="flex flex-col gap-2">
                  <SectionHeaderCard
                    trailingIcon={<div className="cursor-pointer">
                      <CounterCard
                        width="w-[100px]"
                        height="h-8"
                        borderColor="border-[#0083ff] border-2"
                        value={
                          <div className="flex items-center gap-2">
                            <Text
                              as="p"
                              variant="body-medium"
                              weight="normal"
                              color="primary-normal"
                            >
                              {chapter.tests.length} Tests
                            </Text>
                          </div>
                        }
                      />
                    </div>}
                    breadcrumb={
                      <div className="flex gap-1">
                        <Text
                          as="p"
                          variant="body-medium"
                          weight="normal"
                          className="!font-normal text-surface-gray-muted"
                        >
                          {t("common.section")} {chapterIndex + 1}
                        </Text>
                        <Text
                          as="p"
                          variant="body-small"
                          weight="normal"
                          className="!font-normal text-surface-gray-muted"
                        >
                          • {chapter.attempted_count} / {chapter.mandatory_count}{" "}
                          {t("course.courseStatus.completed")}
                        </Text>
                      </div>
                    }
                    title={chapter.name}
                    cursor="cursor-pointer"
                    onClick={() => { }}
                    titleClassName="!heading-small !font-semibold text-surface-gray-normal"
                    breadcrumbClassName="body-medium !font-normal text-surface-gray-muted"
                    radiusClassName="md:rounded-md"
                    bgClassName="bg-white"
                    containerClassName="px-4 py-3 sticky top-[44px] md:top-[46px] z-10"
                  />

                  <div className="space-y-2">
                    {mandatoryTests.length > 0 && (
                      <div className="grid xl:grid-cols-2 px-3 py-3 md:rounded-md gap-y-3 gap-x-8 bg-brand/12">
                        {mandatoryTests.map((test) => renderTestCard(test, chapter))}
                      </div>
                    )}

                    {optionalTests.length > 0 && (
                      <div className="grid xl:grid-cols-2 px-3 gap-y-3 gap-x-8">
                        {optionalTests.map((test) => renderTestCard(test, chapter))}
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}

          <div className="sticky md:flex hidden bottom-2 z-20 justify-center w-full">
            <ChangePaperButton />
          </div>
        </>
      )}
    </div>
  );
});

/* ================= SKELETON ================= */

const ChapterTestSkeleton = () => (
  <div className="flex flex-col gap-3 animate-pulse px-3">
    <div className="flex gap-2 py-2">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-8 w-28 rounded-full" />
      ))}
    </div>
    {[1, 2].map((i) => (
      <div key={i} className="space-y-3">
        <Skeleton className="h-12 rounded-md" />
        <div className="grid xl:grid-cols-2 gap-3">
          {[1, 2].map((j) => (
            <Skeleton key={j} className="h-24 rounded-md" />
          ))}
        </div>
      </div>
    ))}
  </div>
);
