import Button from "@clearcut/ui/button";
import { Card } from "@clearcut/ui/card";
import Text from "@clearcut/ui/text";
import { useLevels } from "@/hooks/onboarding/useLevels";
import { LevelTranslation } from "@/lib/api/onboarding";
import { useGetCurrentCourseStore } from "@/store/course/useGetCurrentCourseStore";
import { parseTranslation } from "@/utils/text/translation";
import { useLocale } from "next-intl";
import React, { useCallback, useMemo } from "react";
import { FALLBACK_IMAGE } from "./PreparationPaywall";
import StatusChip from "@/components/ui/cards/preparation/chapter-list/StatusChip";
import { Skeleton } from "@/components/ui/skeleton";
import { PaywallSource, usePaywallsStore } from "./usePaywallsStore";
import { useRouter } from "@/i18n/navigation";
import { ExamEnrollmentWithExam } from "@/lib/dashboard/learning";

export default function PaywallFloatingWidget() {
  const locale = useLocale(); // "en", "hi", etc.
  const { course } = useGetCurrentCourseStore();
  const { open: openPaywall } = usePaywallsStore();

  const router = useRouter();

  const {
    levels: levelsRaw = [],
    loading: levelsLoading,
    error,
  } = useLevels(course?.exam?.id);

  /* ---------------------------------- memoized derived values ---------------------------------- */

  const rootLevels = useMemo(
    () => levelsRaw?.filter((item) => item.parent_id === null) ?? [],
    [levelsRaw],
  );

  const papers = useMemo(() => {
    return rootLevels.map((item) => {
      const translation = parseTranslation<LevelTranslation>(item.translation);
      const t = translation?.[locale];

      return {
        id: item.id,
        name: t?.name ?? item.name,
        group: t?.group ?? item.group,
        detail: t?.detail ?? "",
        slug: item.slug,
      };
    });
  }, [rootLevels, locale]);

  const examTitle = useMemo(
    () => `${course?.exam?.short_name ?? ""} Exam`,
    [course?.exam?.short_name],
  );

  const examPrice = useMemo(
    () => JSON.parse(course?.exam?.price ?? "{}") ?? 0,
    [course?.exam?.price],
  );

  const examLogo = useMemo(
    () => course?.exam?.logo_url || FALLBACK_IMAGE,
    [course?.exam?.logo_url],
  );

  const hasActive = useMemo(
    () => course?.status === "trial" || course?.status === "trial_end",
    [course?.status],
  );

  return (
    hasActive && (
      <div className="px-3 md:px-4 ">
        <Card padding={"8px 16px"} bgcolor="bg-white" className="">
          <div className="flex w-full flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col w-full gap-1">
                <div className="flex w-full items-center justify-between">
                  <Text as="h6" variant="heading-medium" weight="semibold">
                    {examTitle}
                  </Text>
                  <p className="heading-large !font-semibold text-surface-gray-normal">
                    {"₹" + 99}{" "}
                    <Text className="line-through" variant="body-medium">
                      {"₹" + examPrice?.actual_price}
                    </Text>
                  </p>
                </div>

                <div>
                  {levelsLoading ? (
                    <Skeleton className="h-6 rounded-full" />
                  ) : papers.length > 0 ? (
                    <StatusChip
                      className="!text-brand !bg-brand/9 !body-medium !font-semibold"
                      label={papers.map((item) => item.name).join(" + ")}
                    />
                  ) : null}
                </div>
              </div>
            </div>
            <div>
              <Button
                onClick={() => {
                  handleOpenPaywall(router, "floating_widget_clicked", course);
                }}
                size="lg"
                rounded="50px"
                color="success"
                fullWidth
                rightIcon={<div></div>}
              >
                Unlock {course?.exam?.short_name} Exam to finish syllabus
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  );
}

export const handleOpenPaywall = (
  router: any,
  source: PaywallSource,
  course: ExamEnrollmentWithExam | null | undefined,
) => {
  router.push(
    `/payment/initiated?exam_id=${course?.group_code}&course_name=${encodeURIComponent(
      course?.exam?.short_name || "",
    )}&source=${source}`,
  );
};
