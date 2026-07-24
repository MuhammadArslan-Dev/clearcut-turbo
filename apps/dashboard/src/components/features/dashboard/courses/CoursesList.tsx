"use client";

import React, { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import CourseCard from "./CourseCard";
import { CourseCardSkeleton } from "./CourseCardSkeleton";
import { FiltersSkeleton } from "@/components/ui/widgets/filter/FiltersSkeleton";
import Filters from "@/components/ui/widgets/filter/Filters";
import { Exam, ExamMetadata } from "@/types/Exam";
import BuySigleCourseModal from "@/components/modals/course/buy-sigle-course/buy-sigle-course-modal";
import { useCourseStore } from "@/store/course/useCourseStore";
import { useCourseFilters } from "@/hooks/course/useCourseFilters";
import { useTranslations } from "next-intl";
import { useMyActiveCourses } from "@/hooks/course/useMyActiveCourses";

export default function CoursesList({ data }: { data?: Exam[] }) {
  const open = useCourseStore((s) => s.open);
  const { close } = useCourseStore();
  const { courses } = useMyActiveCourses();

   const enrolledIds = useMemo(
    () => new Set(courses?.courses?.map((c) => c?.exam_id) ?? []),
    [courses],
  );

  const availableCourses = useMemo(
    () => data?.filter((course) => !enrolledIds.has(course.id)),
    [data, enrolledIds],
  );
  useEffect(() => {
    close();
  }, []);
  const { stateTabs, setSelectedState, filteredExams } = useCourseFilters(availableCourses);
  const t = useTranslations("examType");


  return (
    <div>
      <div className="flex flex-col h-full min-h-0 gap-5 ">
        <div className="sticky -mt-1 -top-1  z-10 bg-white px-3 pt-2 pb-3 md:p-4 md:rounded-md ">
          {!data ? (
            <FiltersSkeleton />
          ) : (
            <Filters
              titleFont="body-small !font-semibold text-surface-gray-subtle"
              badgeFont="body-medium "
              paddingX="px-4"
              title={t("selectState")}
              borderRadius="full"
              marginX="-mx-3 px-3"
              FilterItem={stateTabs}
              onClick={setSelectedState}
            />
          )}
        </div>
        {/* 🔽 Courses Grid (ONLY this scrolls) */}
        <motion.div
          className="
          flex-1 min-h-0 overflow-y-auto
          grid gap-4
          sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4
          px-3 md:px-0
          pb-14 md:pb-0
        "
          initial="hidden"
          animate="show"
        >
          {!data ? (
            Array.from({ length: 4 }).map((_, index) => (
              <motion.div key={index}>
                <CourseCardSkeleton />
              </motion.div>
            ))
          ) : filteredExams.length > 0 ? (
            filteredExams.map((course, index) => {
              const metaData: ExamMetadata =
                typeof course.metadata === "string"
                  ? JSON.parse(course.metadata)
                  : (course.metadata ?? {});

              return (
                <motion.div key={index}>
                  <CourseCard
                    bgColor="white"
                    badge={course.status}
                    courseName={
                      course.short_name
                    }
                    examData={metaData?.cutoff}
                    examDate={metaData?.exam_date || null}
                    rating={12}
                    examMode={metaData?.exam_mode}
                    duration={metaData?.duration}
                    examType={course.exam_type + " Exam"}
                    logo={course.logo_url}
                    onClick={() => open("single", course!)}
                  />
                </motion.div>
              );
            })
          ) : (
            <p className="col-span-full text-center text-gray-500">
              No courses found
            </p>
          )}
        </motion.div>
        <BuySigleCourseModal />
      </div>
    </div>
  );
}
