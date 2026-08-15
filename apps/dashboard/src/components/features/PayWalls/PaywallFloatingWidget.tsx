import Button from "@clearcut/ui/button";
import { Card } from "@clearcut/ui/card";
import Text from "@clearcut/ui/text";
import { useGetCurrentCourseStore } from "@/store/course/useGetCurrentCourseStore";
import React, { useMemo } from "react";
import { PaywallSource, usePaywallsStore } from "./usePaywallsStore";
import { useRouter } from "@/i18n/navigation";
import { ExamEnrollmentWithExam } from "@/lib/dashboard/learning";
import { ChevronIcon } from "@/components/ui/icons";

export default function PaywallFloatingWidget() {
  const { course } = useGetCurrentCourseStore();

  const router = useRouter();

  const examTitle = useMemo(
    () => course?.exam?.short_name ?? "",
    [course?.exam?.short_name],
  );

  const hasActive = useMemo(
    () => course?.status === "trial" || course?.status === "trial_end",
    [course?.status],
  );

  return (
    hasActive && (
      <div className="px-3 md:px-4">
        <Card
          padding="12px 16px"
          bgcolor="bg-white"
          borderwidth={2}
          bordercolor="var(--color-brand)"
        >
          <div className="flex w-full flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <Text as="h6" variant="heading-large" weight="semibold">
                {examTitle}
              </Text>
              <Text
                variant="body-large"
                weight="normal"
                className="text-surface-gray-subtle whitespace-nowrap"
              >
                <Text
                  as="span"
                  variant="heading-large"
                  weight="semibold"
                  className="text-surface-gray-normal"
                >
                  ₹99
                </Text>
                /month • All subjects
              </Text>
            </div>

            <Button
              onClick={() => {
                handleOpenPaywall(router, "floating_widget_clicked", course);
              }}
              size="md"
              rounded="50px"
              color="primary"
              fullWidth
              rightIcon={
                <ChevronIcon size={20} type="double" variant="right" color="white" />
              }
            >
              Unlock {examTitle} course to finish syllabus
            </Button>
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
