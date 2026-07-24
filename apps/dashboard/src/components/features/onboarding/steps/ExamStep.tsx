"use client";

import React, { useEffect, useState, useCallback } from "react";
import StepIndicatorCard from "../indicator/StepIndicatorCard";
import Skeleton from "@mui/joy/Skeleton";
import { Card } from "@clearcut/ui/card";
import CheckIcon from "@/components/ui/icons/check-icon";
import { useExams } from "@/hooks/onboarding/useExams";
import { Exam } from "@/types/Exam";
import { StepProps } from "@/types/onboarding/onboarding";
import MainContainer from "@/components/ui/main-container";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics/browser";
import useButtonArrowAnimation from "@/hooks/useButtonArrowAnimation";
import ShimmerButton from "@/components/ui/button/shimmer-button";
import { RotatingBadge } from "@/components/ui/animation/RotatingBadge";
import { enrolledToCourse } from "@/lib/api/onboarding";
import { AppLanguageCode } from "@/lib/analytics/events/onboarding";
import { useCourseFilters } from "@/hooks/course/useCourseFilters";
import Filters from "@/components/ui/widgets/filter/Filters";
import { ChevronIcon } from "@/components/ui/icons";
import MainButton from "@/components/ui/button/main-button";

export default function ExamStep({
  data,
  steps,
  currentStep,
  updateData,
  goBack,
}: StepProps) {
  const t = useTranslations("");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔹 Reset level on mount
  useEffect(() => {
    updateData({ level: null });

    const params = new URLSearchParams(searchParams.toString());
    params.delete("level");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { exams: examsResponse, loading, error } = useExams(data.language);

  // 🔹 Normalize exams safely
  const exams: Exam[] = Array.isArray(examsResponse)
    ? examsResponse
    : (examsResponse?.data ?? []);

  const {
    stateTabs: stateTabs2,
    setSelectedState: setSelectedState2,
    filteredExams: filteredExams2,
  } = useCourseFilters(exams);

  // 🔹 Select exam
  const selectExam = useCallback(
    (exam: Exam) => updateData({ exam }),
    [updateData],
  );

  // 🔹 Restore upcoming course
  useEffect(() => {
    const course = localStorage.getItem("UPCOMING_COURSE");
    if (!course) return;

    const alreadySelected = exams.find(
      (item) => item?.short_name?.toLowerCase() === course.toLowerCase(),
    );

    if (alreadySelected) {
      selectExam(alreadySelected);
      localStorage.removeItem("UPCOMING_COURSE");
    }
  }, [exams, selectExam]);

  const isLoading = loading && !error;

  const { buttonPhase } = useButtonArrowAnimation({
    data: !!data.exam || null,
  });

  // 🔥 Enroll handler with double-click protection
  const handleEnroll = useCallback(async () => {
    if (!data?.exam || isSubmitting) return;

    setIsSubmitting(true);

    try {
      trackEvent("Onboarding Step Completed", {
        step_number: 2,
        step_name: "exam_selection",
        exam_choice: data?.exam?.short_name,
      });
      const response = await enrolledToCourse({
        exam_id: data.exam.id,
      });

      if (response.status) {
        trackEvent("Onboarding Completed", {
          entry_step_name: "language_selection",
          up_onboarding_status: "completed",
          up_chosen_exam_id: data.exam.short_name ?? "",
          up_preferred_app_language: data.language as AppLanguageCode,
        });

        router.replace("/dashboard?user_type=new");
      } else {
        console.error(response.message);
      }
    } catch (err) {
      console.error("Enrollment failed", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [data, isSubmitting, router]);

  return (
    <MainContainer maxWidth={"max-w-[850px]"} padding="md:pt-20">
      <div className="flex flex-col gap-2 pb-[60px] md:pb-0">
        <StepIndicatorCard
          data={steps}
          currentStep={currentStep}
          title={t("Onboarding.exam.select_exam")}
          titleHeightLight={t("Onboarding.exam.highlight_text")}
          description={t("Onboarding.exam.description")}
          goBack={goBack}
        />

        {/* 🔹 Filters */}
        <div className="bg-white p-3 flex flex-col gap-2">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rectangular"
                  width={80}
                  height={32}
                  sx={{ borderRadius: "999px" }}
                />
              ))
            ) : error ? (
              <p className="text-sm text-red-500">Failed to load exams.</p>
            ) : (
              <Filters
                titleFont="body-small !font-semibold text-surface-gray-subtle"
                badgeFont="body-medium"
                paddingX="px-4"
                title={t("examType.selectState")}
                borderRadius="full"
                marginX="-mx-3 px-3"
                FilterItem={stateTabs2}
                onClick={setSelectedState2}
              />
            )}
          </div>
        </div>

        {/* 🔹 Exam Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-3 py-4 bg-white mb-3.5 md:mb-0">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card
                key={i}
                padding={"12px 20px"}
                borderRadius={4}
                bgcolor="white"
                bordercolor="#eee"
              >
                <Skeleton variant="rectangular" width="100%" height={48} />
              </Card>
            ))
          ) : error ? (
            <p className="text-sm text-red-500">Failed to load exams.</p>
          ) : (
            filteredExams2.map((exam, index) => {
              const selected = data?.exam?.exam_id === exam.exam_id;

              return (
                <Card
                  key={exam.exam_id}
                  padding={"8px 20px"}
                  borderRadius={8}
                  cursor="pointer"
                  bgcolor={selected ? "var(--color-primary-subtle)" : "white"}
                  bordercolor={selected ? "var(--color-brand)" : "#ccc"}
                  className={`exam-card transition-all duration-200 ease-out ${
                    selected
                      ? "scale-[1.005]"
                      : "hover:-translate-y-0.5 hover:shadow-sm"
                  }`}
                  style={{ animationDelay: `${index * 70}ms` }}
                  onClick={() => selectExam(exam)}
                >
                  <div className="flex justify-between items-center w-full">
                    <div>
                      <p className="heading-medium !font-semibold text-surface-gray-normal">
                        {exam.short_name} Exam
                      </p>
                      <p className="body-small text-surface-gray-muted">
                        {exam.state} ({exam.exam_type})
                      </p>
                    </div>

                    {selected ? (
                      <CheckIcon size={16} />
                    ) : (
                      <div className="border border-gray-400 w-4 h-4 rounded-full" />
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* 🔹 Bottom Button */}
        <div className="py-2 px-4 bg-white fixed bottom-0 left-0 right-0 md:static">
          <div className="flex flex-col gap-2 items-center">
           <MainButton
              text={t("actions.continue")}
              fullWidth={true}
              showShimmer={
                buttonPhase === "shimmer" ||
                (buttonPhase === "icon" && !isSubmitting)
              }
              disabled={!data.exam || isSubmitting}
              onClick={handleEnroll}
              loading={isSubmitting} // ✅ loader support
            />
            

            <RotatingBadge
              animationDuration={0.45}
              direction="up"
              items={["Videos", "Notes", "PDFs", "Tests"]}
            />
          </div>
        </div>
      </div>
    </MainContainer>
  );
}
