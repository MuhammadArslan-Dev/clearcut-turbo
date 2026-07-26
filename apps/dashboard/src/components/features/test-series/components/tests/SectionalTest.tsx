import { Button } from "@clearcut/ui/button";
import React, { useCallback, useEffect, useMemo } from "react";
import TestCard from "../cards/TestCard";
import Text from "@clearcut/ui/text";
import SectionHeaderCard from "@/components/ui/cards/preparation/chapter-list/SectionHeaderCard";
import { useTranslations } from "next-intl";
import StatusChip from "@/components/ui/cards/preparation/chapter-list/StatusChip";
import { useTestSeriesModalStore } from "../../store/useTestSeriesModalStore";
import { useTestListDataStore } from "../../store/useTestListDataStore";
import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";
import { useSectionalTestHook } from "../../hooks/useSectionalTestHook";
import { Skeleton } from "@/components/ui/skeleton";
import { LockIcon } from "@/components/ui/icons";
import useLanguageSwitch from "@/hooks/useLanguageSwitch";
import { ChangePaperButton } from "./FullTest";
import CounterCard from "@/components/ui/cards/CounterCard";
import { useGetCurrentCourseStore } from "@/store/course/useGetCurrentCourseStore";
import { trackEvent } from "@/lib/analytics/browser";
import { SectionalTestItem, SectionalSection } from "@/lib/tests/getExam";
import { handleOpenPaywall } from "@/components/features/PayWalls/PaywallFloatingWidget";
import { useRouter } from "@/i18n/navigation";

interface SectionalTestProps {
  courseId?: string | number;
}

export default React.memo(function SectionalTest({ courseId }: SectionalTestProps) {
  const t = useTranslations();
  const cardT = useTranslations("testListContent");
  const router = useRouter();

  const { course: courseData } = useGetCurrentCourseStore();
  const { open } = useTestSeriesModalStore();
  const { paper, setData, setPaper, setPapers } = useTestListDataStore();
  const { get } = useQueryParams();
  const testType = get("testType");

  const { data, isLoading, error, refetchData } = useSectionalTestHook(courseId, paper?.id);

  /* ================= DATA INIT ================= */

  useEffect(() => {
    if (!data?.papers?.length) return;
    setPapers(data.papers);
    setPaper(data.paper);
  }, [data, setPaper, setPapers]);

  /* ================= DERIVED DATA ================= */

  const sections = useMemo(() => data?.sections ?? [], [data]);

  const totalSections = sections.length;

  const completedSections = useMemo(
    () =>
      sections.filter(
        (s) => s.mandatory_count > 0 && s.attempted_count >= s.mandatory_count,
      ).length,
    [sections],
  );

  /* ================= RECOMMENDED TEST ================= */

  const recommendedTest = useMemo(() => {
    for (const section of sections) {
      const pending = section.tests.find((t) => t.is_mandatory && !t.is_attempted);
      if (pending) return { section, test: pending };
    }

    // All mandatory done — return first mandatory test of first section
    for (const section of sections) {
      const first = section.tests.find((t) => t.is_mandatory);
      if (first) return { section, test: first };
    }

    return null;
  }, [sections]);

  /* ================= STORE DATA ================= */

  useEffect(() => {
    if (!recommendedTest) return;

    setData(
      {
        id: recommendedTest.test.id,
        title: `${recommendedTest.section.name} - Sectional Test ${recommendedTest.test.test_number}`,
        paperId: data?.paper?.id ?? 0,
        sectionId: recommendedTest.section.id,
        courseId: courseId ?? 0,
        test: recommendedTest.test as any,
        totalQuestions: recommendedTest.test.number_of_questions,
      },
      {
        title: `${completedSections} / ${totalSections} Sectional Test`,
        subtitle: "Weekly",
        total: totalSections,
        completed: completedSections,
        testType: "mock",
      },
    );
  }, [recommendedTest, completedSections, totalSections, data?.paper?.id, courseId, setData, testType]);

  /* ================= ACTION HANDLERS ================= */

  const handleStartTest = useCallback(
    (test: SectionalTestItem, section: SectionalSection) => {
      open("pre-test-confirmation", {
        test: { ...test, order: String(test.test_number), st_status: test.is_mandatory ? "mandatory" : "optional" } as any,
        sectionId: section.id,
      });

      trackEvent("Test Card Clicked", {
        test_id: test.id.toString(),
        test_name: "Sectional Test " + test.test_number,
        test_status: test.is_mandatory ? "mandatory" : "optional",
      });
    },
    [open],
  );

  const handleViewHistory = useCallback(
    (test: SectionalTestItem, section: SectionalSection) => {
      open("attempt-history", {
        test: {
          ...test,
          order: String(test.test_number),
          st_status: test.is_mandatory ? "mandatory" : "optional",
          metadata: {
            ...((test as any).metadata ?? {}),
            section_name: section.name ?? "",
          },
        } as any,
        sectionId: section.id,
      });

      trackEvent("Test Details Viewed", {
        test_id: test.id.toString(),
        test_name: "Sectional Test " + test.test_number,
        source: "test_dashboard",
        test_type: "sectional",
        test_status: test.is_mandatory ? "mandatory" : "optional",
        attempt_number: 1,
        is_retake: false,
      });
    },
    [open],
  );

  /* ================= RENDER CARD ================= */

  const renderTestCard = useCallback(
    (test: SectionalTestItem, section: SectionalSection) => {
      const isCompleted = test.is_attempted;
      const isLocked = !!test.locked;

      const isRecommended =
        recommendedTest?.test.id === test.id &&
        recommendedTest?.section.id === section.id;

      const durationMin = Math.round(test.total_time / 60);

      return (
        <TestCard
          key={test.id}
          title={cardT("testCard.sectionalTitle", { number: test.test_number })}
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
                    score: test.attempt?.correct_answers ?? test.attempt?.result?.correct ?? 0,
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
                : handleStartTest(test, section),
          }}
          viewReport={{
            text: cardT("testCard.viewReport"),
            isShow: isCompleted,
            onClick: () =>
              isLocked
                ? handleOpenPaywall(router, "full_test_card_clicked", courseData)
                : handleViewHistory(test, section),
          }}
          announcement={isRecommended ? "Next recommended sectional test" : undefined}
        />
      );
    },
    [cardT, courseData, handleStartTest, handleViewHistory, recommendedTest, router],
  );

  /* ================= STATES ================= */

  if (isLoading) return <SectionalTestSkeleton />;

  if (error)
    return (
      <div className="py-8 text-center space-y-3">
        <p>Failed to load tests.</p>
        <Button size="sm" onClick={refetchData}>
          Retry
        </Button>
      </div>
    );

  if (!data) return <div>No data found</div>;
  if (!sections.length)
    return <div className="py-8 text-center">No tests available.</div>;

  /* ================= UI ================= */

  return (
    <div className="flex flex-col gap-4">
      {sections.map((section, sectionIndex) => {
        const mandatoryTests = section.tests.filter((t) => t.is_mandatory);
        const optionalTests = section.tests.filter((t) => !t.is_mandatory);

        return (
          <React.Fragment key={section.id}>
            <div className="h-0.5 bg-gray-200" />

            <div className="flex flex-col gap-2">
              <SectionHeaderCard
                breadcrumb={
                  <div className="flex gap-1">
                    <Text
                      as="p"
                      variant="body-medium"
                      weight="normal"
                      className="!font-normal text-surface-gray-muted"
                    >
                      {t("common.section")} {sectionIndex + 1}
                    </Text>

                    <Text
                      as="p"
                      variant="body-small"
                      weight="normal"
                      className="!font-normal text-surface-gray-muted"
                    >
                      • {section.attempted_count} / {section.mandatory_count}{" "}
                      {t("course.courseStatus.completed")}
                    </Text>
                  </div>
                }
                title={section.name}
                cursor="cursor-pointer"
                onClick={() => {}}
                titleClassName="!heading-small !font-semibold text-surface-gray-normal"
                breadcrumbClassName="body-medium !font-normal text-surface-gray-muted"
                radiusClassName="md:rounded-md"
                bgClassName="bg-white"
                containerClassName="px-4 py-3 sticky top-0 md:top-2 z-10"
              />

              <div className="space-y-2">
                <div className="grid xl:grid-cols-2 px-3 py-3 md:rounded-md gap-y-3 gap-x-8 bg-brand/12">
                  {mandatoryTests.map((test) => renderTestCard(test, section))}
                </div>

                {optionalTests.length > 0 && (
                  <div className="grid xl:grid-cols-2 px-3 gap-y-3 gap-x-8">
                    {optionalTests.map((test) => renderTestCard(test, section))}
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
    </div>
  );
});

/* ================= SKELETON ================= */

const SectionalTestSkeleton = () => (
  <div className="flex flex-col gap-5 animate-pulse px-4">
    {[1, 2].map((section) => (
      <div key={section} className="space-y-4">
        <Skeleton className="h-12 rounded-md" />
        <div className="grid xl:grid-cols-2 gap-4">
          {[1, 2].map((item) => (
            <Skeleton key={item} className="h-24 rounded-md" />
          ))}
        </div>
      </div>
    ))}
  </div>
);
