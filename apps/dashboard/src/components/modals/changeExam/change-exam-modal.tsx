import React, { useEffect, useState, useCallback } from "react";
import { CustomBottomSheet, CustomModal } from "../modals-bottom-sheet";
import { useIsMobile } from "@/hooks/useIsMobile";
import OptionSelectionCard from "@/components/ui/cards/option-selection-card";
import { useModalStore } from "@/store/modal/useModalStore";
import { CrossIcon } from "@/components/ui/icons";
import { useMyActiveCourses } from "@/hooks/course/useMyActiveCourses";
import { changeCourse, ExamEnrollmentWithExam } from "@/lib/dashboard/learning";
import { Button } from "@clearcut/ui/button";
import { useCourseStore } from "@/store/course/useCourseStore";

export default function ChangeExamModal() {
  const isMobile = useIsMobile();
  const { isOpen, closeModal, stack } = useModalStore();
  const active = stack[stack.length - 1];

  const { courses, clearCache, refetch } = useMyActiveCourses();
  const open = useCourseStore((s) => s.open); // kept (no design change)

  const activeCourse = courses?.active_course;
  const allCourses = courses?.courses ?? [];

  const [selected, setSelected] =
    useState<ExamEnrollmentWithExam | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔹 Initialize selected course
  useEffect(() => {
    if (activeCourse) setSelected(activeCourse);
  }, [activeCourse]);

  // 🔥 Change exam with double-click protection
  const changeExamHandler = useCallback(async () => {
    if (!selected || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await changeCourse(selected.group_code!);

      await refetch();
      clearCache();

      closeModal("change-exam");
    } catch (error) {
      console.error("Failed to change exam", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [selected, isSubmitting, refetch, clearCache, closeModal]);

  const Container = isMobile ? CustomBottomSheet : CustomModal;

  // 🔹 Modal guard
  if (!isOpen || active !== "change-exam") return null;

  return (
    <Container
      maxWidth="max-w-[650px] !rounded-t-lg w-full"
      isHeader={false}
      isOpen={isOpen}
      maxHeight="max-h-[70vh]"
      onClose={() => closeModal("change-exam")}
    >
      <div className="bg-gray-100 flex flex-col">

        {/* Header */}
        <div className="sticky top-0 z-10 flex flex-col gap-1 px-5 py-4 bg-white">
          <div className="flex justify-between w-full">
            <div className="heading-medium !font-semibold text-surface-gray-normal">
              Change Exam
            </div>

            <div
              className="cursor-pointer"
              onClick={() => closeModal("change-exam")}
            >
              <CrossIcon />
            </div>
          </div>

          <p className="body-small text-surface-gray-muted">
            You can switch exams anytime from “Learn”. Your progress will be
            saved.
          </p>
        </div>

        {/* Course List */}
        <div className="px-5 pb-3 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allCourses.map((item, index) => (
              <OptionSelectionCard
                key={index}
                padding="8px 20px"
                onClick={() => setSelected(item)}
                selected={item.id === selected?.id}
                showIcon
                content={
                  <span className="flex flex-col items-start">
                    <h6 className="heading-medium !font-semibold text-surface-gray-normal">
                      {item?.exam?.short_name} Exam
                    </h6>

                    <p className="body-small !font-normal text-surface-gray-muted">
                      {item?.exam?.state} ({item?.exam?.exam_type})
                    </p>
                  </span>
                }
              />
            ))}
          </div>
        </div>

        {/* Bottom Button */}
        <div className="px-3 pt-2 pb-4 bg-white sticky bottom-0 flex justify-center">
          <div className="w-full max-w-[400px]">
            <Button
              size="lg"
              sx={{ borderRadius: "50px" }}
              fullWidth
              onClick={changeExamHandler}
              disabled={!selected?.exam?.short_name || isSubmitting}
              loading={isSubmitting} // ✅ loader (Joy UI supported)
            >
              {`Continue with ${selected?.exam?.short_name}`}
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
}