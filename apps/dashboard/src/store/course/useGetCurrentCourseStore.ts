import { ExamEnrollmentWithExam } from "@/lib/dashboard/learning";
import { Exam } from "@/types/Exam";
import { create } from "zustand";


type GetCurrentCourseState = {
    course: ExamEnrollmentWithExam | null;
    exam: Exam | null;

    setCourse: (course: ExamEnrollmentWithExam | null) => void;
    setExam: (exam: Exam | null) => void;
};

export const useGetCurrentCourseStore = create<GetCurrentCourseState>((set) => ({
    course: null,
    exam: null,
    setCourse: (course) => set({ course }),
    setExam: (exam) => set({ exam }),
}));