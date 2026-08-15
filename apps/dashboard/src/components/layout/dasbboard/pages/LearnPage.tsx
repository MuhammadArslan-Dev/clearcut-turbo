"use client";
import RemainingTimeWrapper from "@/components/ui/widgets/timer/RemainingTimeWrapper";
import { isExamDatePassed } from "@/utils/date/dateUtils";
import NextMilestone from "@/components/ui/widgets/nextmilestone/NextMilestone";
import TodayGoals from "@/components/ui/widgets/todaygoals/TodayGoals";
import LearningStreak from "@/components/ui/widgets/learningstreaks/LearningStreak";
import MainContainer from "@/components/ui/main-container";
import ResumeBarWrap from "@/components/features/navigation/bottom-bar/resume-bar/ResumeBarWrap";
import MyCoursesWrapTwo from "@/components/features/dashboard/mycourse/MyCoursesWrapTwo";
import { useEffect, useMemo, useRef } from "react";

import ChangeExamModal from "@/components/modals/changeExam/change-exam-modal";
import { useMyActiveCourses } from "@/hooks/course/useMyActiveCourses";
import { ExamMetadata } from "@/types/Exam";
import ContactUsModal from "@/components/modals/contact-us/ContactUsModal";
import { useCourseStore } from "@/store/course/useCourseStore";
import { useRouter } from "@/i18n/navigation";
import QuickRevision from "@/components/ui/widgets/quick-revision/quick-revision";
import AppDownloadWidget from "@/components/ui/widgets/app-download/app-download-widget";
import { useSwiperCourseStore } from "@/store/dashboard/useSwiperCourseStore";


export default function LearnPage() {
  const {
    courses,
    activeCourse,
    isLoading,
    allCourses,
    isFetching,
  } = useMyActiveCourses();
  const { close } = useCourseStore();

  const router = useRouter();

  useEffect(() => {
    close();
  }, []);

  const hasChecked = useRef(false);

  useEffect(() => {
    if (isLoading || isFetching) return;

    // prevent multiple redirects
    if (hasChecked.current) return;

    hasChecked.current = true;

    if (!courses?.active_course) {
      router.replace("/dashboard/my-courses");
    }
  }, [isLoading, isFetching, courses?.active_course]);

  const focusedCourse = useSwiperCourseStore((s) => s.focusedCourse);
  const onAddExamSlide = useSwiperCourseStore((s) => s.onAddExamSlide);
  const displayCourse = focusedCourse ?? activeCourse;

  // On mobile, when the course Swiper reaches the trailing "Add Exam" slide,
  // hide all the course-specific widgets below the card. They reappear (bound to
  // the focused course) as soon as the user scrolls back to any course slide.
  // Desktop has no Swiper, so this flag stays false there.
  const hideWidgetsOnMobile = onAddExamSlide ? "hidden md:block" : "";
  const hideWidgetsRowOnMobile = onAddExamSlide ? "hidden md:flex" : "";

  const exam = useMemo(() => displayCourse?.exam, [displayCourse]);

  // ✅ Memoize metadata parsing
  const metaData = useMemo<ExamMetadata>(() => {
    if (!exam?.metadata) return {};
    return typeof exam.metadata === "string"
      ? JSON.parse(exam.metadata)
      : exam.metadata;
  }, [exam?.metadata]);

  const milestoneDate = metaData?.exam_date;
  // Same rule the countdown widget applies to hide itself, so the layout and
  // the widget can never disagree about whether that slot is occupied.
  const countdownFinished = isExamDatePassed(milestoneDate);

  return (
    <>
      {/* Main column */}
      <div className="flex flex-1 flex-col min-h-0 min-w-0">
        {/* Only this part scrolls */}
        <main className="flex-1 mb-16 md:mb-0 overflow-y-auto px-0 md:px-3 md:py-6 -my-2 transition-opacity duration-200">
          {/* 
           bg-[url('/images/clear_cutoff_doodle.png')]
      bg-cover bg-center bg-no-repeat */}
          {/* <button
            className=" p-4 text-white bg-red-500 cursor-pointer rounded-lg ml-4"
            onClick={() => {
              logger.warn("Manual test error", {
                tags: { module: "test" },
              });
            }}
          >
            Send Error
          </button> */}
          {/* <div className="space-y-6"> */}
          <MainContainer maxWidth="max-w-[900px]" padding="pb-[114px] md:pb-0">
            <div className="flex flex-col gap-2 md:gap-4">
              <div className="flex flex-col md:flex-row gap-2 md:gap-4">
                {/* No mobile max-width: below `md` this column is the whole page, so the
                    My Courses card should stretch edge to edge. The old
                    `max-w-[480px]` capped it, which left dead space on any viewport
                    wider than 480px but narrower than `md`. The 380px cap still
                    applies from `md` up, where it is a real side column. */}
                <div className="w-full md:max-w-[380px] space-y-2 md:space-y-4">
                  <MyCoursesWrapTwo
                    activeCourse={activeCourse}
                    allCourses={allCourses}
                    data={courses}
                    isLoading={isFetching}
                  />
                  {/* The countdown hides itself once the exam date passes, but its
                      WRAPPERS used to stay behind — and the parent `space-y-*`
                      still applied margin to them, leaving a phantom gap under
                      My Courses. Gating the wrappers on the same shared
                      `isExamDatePassed` rule the widget uses means the column
                      reflows properly instead of holding empty space. */}
                  {!countdownFinished && (
                    <div className={hideWidgetsOnMobile}>
                      {milestoneDate?.toLowerCase() !== "upcoming" ? (
                        <div className="w-full max-w-[400px] overflow-hidden">
                          <RemainingTimeWrapper rounded="md:rounded-md" exam={exam} />
                        </div>
                      ) : <NextMilestone rounded="md:rounded-md" exam={exam} />}
                    </div>
                  )}
                  {/* Once the countdown retires, its slot would otherwise sit
                      empty: the row is a flex container, so the left column is
                      still STRETCHED to the right column's height (measured
                      680.1px) while holding only the My Courses card. Promoting
                      Quick Revision into that slot fills it and rebalances the
                      two columns instead of leaving a tall blank. It renders in
                      exactly one place either way — see the matching
                      `countdownFinished` guard in the right column. */}
                  {countdownFinished && (
                    <div className={hideWidgetsOnMobile}>
                      <QuickRevision />
                    </div>
                  )}
                </div>
                <div className={`flex-1 space-y-2 md:space-y-4 ${hideWidgetsOnMobile}`}>
                  <TodayGoals rounded="md:rounded-md" exam={exam} />
                  {milestoneDate?.toLowerCase() !== "upcoming" ? <NextMilestone rounded="md:rounded-md" exam={exam} /> : null}
                  {!countdownFinished && <QuickRevision />}
                </div>
              </div>

              <div className={`flex flex-col md:flex-row gap-2 md:gap-4 ${hideWidgetsRowOnMobile}`}>

                <div className="flex-1 overflow-hidden">
                  <LearningStreak rounded="md:rounded-md" />
                </div>
              </div>

              <div className={`flex flex-col md:flex-row gap-2 md:gap-4 ${hideWidgetsRowOnMobile}`}>
                <div className="flex-1 overflow-hidden">
                  <AppDownloadWidget
                    rounded="md:rounded-md"
                    examTitle={exam?.short_name}
                  />
                </div>
              </div>
            </div>
          </MainContainer>

          {/* <MyCoursesWrap /> */}

          {/* <MyCoursesWrap /> */}
          {/* <div className="block md:hidden w-full mt-4 fixed bottom-14">
            <ResumeBarWrap />
          </div> */}
          {/* </div> */}
        </main>
        <div className="hidden md:block">
          <ResumeBarWrap />
        </div>
        <ContactUsModal />

        {/* <Footer /> */}
      </div>
      <ChangeExamModal />
    </>
  );
}
