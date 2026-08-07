import { create } from "zustand";
import type { ExamEnrollmentWithExam } from "@/lib/dashboard/learning";

type SwiperCourseStore = {
  /** The course currently visible in the mobile Swiper. null = show default active course. */
  focusedCourse: ExamEnrollmentWithExam | null;
  /** True when the mobile Swiper is on the trailing "Add Exam" slide (no course). */
  onAddExamSlide: boolean;
  setFocusedCourse: (course: ExamEnrollmentWithExam | null) => void;
  setOnAddExamSlide: (value: boolean) => void;
  reset: () => void;
};

export const useSwiperCourseStore = create<SwiperCourseStore>((set) => ({
  focusedCourse: null,
  onAddExamSlide: false,
  setFocusedCourse: (course) => set({ focusedCourse: course }),
  setOnAddExamSlide: (value) => set({ onAddExamSlide: value }),
  reset: () => set({ focusedCourse: null, onAddExamSlide: false }),
}));
