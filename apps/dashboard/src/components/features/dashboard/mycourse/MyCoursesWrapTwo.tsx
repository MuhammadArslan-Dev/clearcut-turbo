"use client";

import { useEffect, useMemo } from "react";
import MyCourseCard from "./MyCourseCard";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperClass } from "swiper";
import { Pagination } from "swiper/modules";
import { useSwiperCourseStore } from "@/store/dashboard/useSwiperCourseStore";

import "swiper/css";
import "swiper/css/pagination";

import EditCourseModal from "@/components/modals/course/edit-course-modal/edit-course-modal";
import { useCourseStore } from "@/store/course/useCourseStore";
import BuySigleCourseModal from "@/components/modals/course/buy-sigle-course/buy-sigle-course-modal";
import FullCoursePaymentModal from "@/components/modals/payment/full-course-payment-modal";
import {
  ExamEnrollmentWithExam,
  MyCoursesResponse,
} from "@/lib/dashboard/learning";
import { MyCourseCardSkeleton } from "./MyCourseCardSkeleton";
import { ExamMetadata } from "@/types/Exam";
import { useRouter } from "@/i18n/navigation";
import PaymentSuccessModal from "@/components/modals/payment/success/payment-success-modal";
import PaymentFailedModal from "@/components/modals/payment/failed/payment-failed-modal";
import PaymentFailedWarningModal from "@/components/modals/payment/failed-warning/payment-failed-warning-modal";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics/browser";
import { ChevronRight } from "lucide-react";
import { Button } from "@clearcut/ui/button";
import MainPaywall from "../../PayWalls/MainPaywall";
import { usePaywallsStore } from "../../PayWalls/usePaywallsStore";
import { useCourseProgressSummary } from "@/hooks/course/useCourseProgressSummary";

function CourseSlideCard({
  exam,
  onContinue,
  onEdit,
  onUnlock,
}: {
  exam: ExamEnrollmentWithExam;
  onContinue: () => void;
  onEdit: () => void;
  onUnlock?: () => void;
}) {
  const { data: progress } = useCourseProgressSummary(exam.group_code);
  return (
    <MyCourseCard
      cardClasses="!rounded-2xl !md:rounded-xl"
      bgColor="bg-[#0053A2]"
      price={exam.exam.price}
      badge={exam.status}
      courseName={`${exam.exam?.short_name} Exam`}
      logo={exam.exam?.logo_url}
      maxWidth="400px"
      topics={{
        completed: progress?.chapters_completed ?? 0,
        total: progress?.chapters_total ?? 0,
      }}
      tests={{
        completed: progress?.tests_attempted ?? 0,
        total: progress?.tests_total ?? 0,
      }}
      continueClick={onContinue}
      editClick={onEdit}
      unlockClick={onUnlock}
    />
  );
}

export default function MyCoursesWrapTwo({
  data,
  activeCourse,
  allCourses,
  isLoading,
}: {
  allCourses?: ExamEnrollmentWithExam[] | [null];
  activeCourse?: ExamEnrollmentWithExam | null;
  data?: MyCoursesResponse | null;
  isLoading?: boolean;
}) {
  const open = useCourseStore((s) => s.open);
  const setFocusedCourse = useSwiperCourseStore((s) => s.setFocusedCourse);
  const setOnAddExamSlide = useSwiperCourseStore((s) => s.setOnAddExamSlide);
  const resetFocusedCourse = useSwiperCourseStore((s) => s.reset);
  const { data: progressSummary } = useCourseProgressSummary(activeCourse?.group_code);

  // Always reset when the component unmounts (user leaves dashboard).
  useEffect(() => () => resetFocusedCourse(), []);
  const t = useTranslations();
  const { isOpen, mode, open: openPaywall } = usePaywallsStore();

  // ✅ Stable exam object
  const exam = useMemo(() => activeCourse?.exam, [activeCourse?.exam]);

  const route = useRouter();

  const metaData: ExamMetadata =
    typeof exam?.metadata === "string"
      ? JSON.parse(exam?.metadata)
      : (exam?.metadata ?? {});

  const courses = allCourses ?? [];
  const activeExam = activeCourse;

  const orderedCourses = activeExam
    ? [activeExam, ...courses.filter((course) => course?.id !== activeExam.id)]
    : courses;

  // ✅ Shared card props (no duplication)
  const cardProps = {
    bgColor: "bg-[#0053A2] !important",
    price: exam?.price,
    badge: activeExam?.status,
    courseName: `${exam?.short_name} Exam`,
    logo: exam?.logo_url,

    topics: {
      completed: progressSummary?.chapters_completed ?? 0,
      total: progressSummary?.chapters_total ?? 0,
    },
    tests: {
      completed: progressSummary?.tests_attempted ?? 0,
      total: progressSummary?.tests_total ?? 0,
    },

    maxWidth: "350px",

    continueClick: activeExam?.stage_id
      ? async () => {
          await trackEvent("Content Started", {
            source: "learn_dashboard",
            exam_name: exam?.short_name!,
          });
          route.push(`/preparation/${activeExam?.group_code}`);
          // window.location.href = `https://app.clearcutoff.in/prepration/${
          //   activeExam?.uuid
          // }?token=${token()}`;
        }
      : () => open("single", exam!),

    editClick: async () => {
      await trackEvent("Exam Edit Started", {
        exam_name: "REET_2025",
      });
      open("edit", exam!);
    },

    // No subject selected yet (new user, stage_id null) → only "Continue
    // Learning" should show, so this stays undefined until they've picked one.
    unlockClick:
      !activeExam?.stage_id || activeExam?.status === "active"
        ? undefined
        : () =>
            route.push(
              `/payment/initiated?exam_id=${activeExam?.group_code}&course_name=${activeExam?.exam?.short_name}&source=my_courses_card_clicked`,
            ),
    // unlockClick:
    //   activeExam?.status === "active"
    //     ? null
    //     : () => openPaywall("main-paywall", exam!, "my_courses_card_clicked"),
  };

  return (
    <section className="space-y-3">
      <div className="bg-[#0053A2] px-5 h-full pb-1 pt-4 md:p-4 md:rounded-md flex flex-col md:gap-3">
        <div className="heading-large !font-semibold text-white">
          {t("myCourses.title")}
        </div>

        {/* 📱 MOBILE */}
        <div className="md:hidden">
          <Swiper
            modules={[Pagination]}
            pagination={{ clickable: true }}
            spaceBetween={20}
            slidesPerView={1}
            className="!pt-4 !pb-7 !-mx-5 !px-5 !h-full"
            onSlideChange={(swiper: SwiperClass) => {
              // The trailing "Add Exam" slide sits after every course slide.
              const onAddExamSlide = swiper.activeIndex >= orderedCourses.length;
              setOnAddExamSlide(onAddExamSlide);

              const realCourse = (orderedCourses[swiper.activeIndex] ?? null) as ExamEnrollmentWithExam | null;
              // If user is back on the default active course slide or on the
              // "Add Exam" slide, clear the override so widgets revert to normal.
              if (!realCourse || realCourse.id === activeCourse?.id) {
                setFocusedCourse(null);
              } else {
                setFocusedCourse(realCourse);
              }
            }}
          >
            {isLoading ||
              (orderedCourses.length === 0 && (
                <SwiperSlide className="!h-full">
                  <MyCourseCardSkeleton />
                </SwiperSlide>
              ))}
            {orderedCourses.map((exam, index) => (
              <SwiperSlide key={exam?.id ?? index}>
                {exam && (
                  <CourseSlideCard
                    exam={exam}
                    onContinue={() => {
                      if (exam.stage_id) {
                        (async () => {
                          await trackEvent("Content Started", {
                            source: "learn_dashboard",
                            exam_name: exam.exam?.short_name!,
                          });
                          route.push(`/preparation/${exam.group_code}`);
                        })();
                      } else {
                        open("single", exam.exam!);
                      }
                    }}
                    onEdit={async () => {
                      await trackEvent("Exam Edit Started", {
                        exam_name: exam.exam?.short_name!,
                      });
                      open("edit", exam.exam!);
                    }}
                    onUnlock={
                      !exam.stage_id || exam.status === "active"
                        ? undefined
                        : async () => {
                            trackEvent("Purchase Intent Initiated", {
                              entry_point: "learn_dashboard",
                              product_id: exam.exam?.short_name!,
                            });
                            route.push(
                              `/payment/initiated?exam_id=${exam.group_code}&course_name=${exam.exam?.short_name}&source=my_courses_card_clicked`,
                            );
                          }
                    }
                  />
                )}
              </SwiperSlide>
            ))}

            <SwiperSlide className="!h-full">
              <div>
                <div className="border flex flex-col items-center justify-between border-white rounded-2xl md:rounded-xl pt-6 pb-2 h-[256px]  text-center">
                  <h3 className="text-white heading-xlarge font-semibold">
                    Studying for more than one exam?
                  </h3>

                  <div className="flex flex-col gap-2 px-2 py-1 ">
                    <Button
                      fullWidth
                      variant="plain"
                      sx={{
                        borderRadius: "50px",
                        backgroundColor: "white",
                      }}
                      onClick={() => route.push("/dashboard/my-courses")}
                    >
                      <p className="text-black/72">Add Exam</p>{" "}
                      <ChevronRight className="text-black/72" />
                    </Button>

                    <div className="flex flex-col gap-1">
                      <p className="text-blue-100 text-sm">
                        Course + Test Series • Valid till exam day{" "}
                      </p>
                      <p className="text-blue-100 text-sm">
                        You can add or remove exams anytime
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          </Swiper>
        </div>

        {/* 🖥 DESKTOP */}
        <div className="hidden md:block">
          {isLoading || !exam ? (
            <MyCourseCardSkeleton />
          ) : (
            <MyCourseCard {...cardProps} />
          )}
        </div>
      </div>

      {/* Global modal */}
      <PaymentFailedWarningModal />
      <PaymentFailedModal />
      <PaymentSuccessModal />
      <EditCourseModal />
      <BuySigleCourseModal />
      {/* <ChangeExamModal /> */}
      <FullCoursePaymentModal />
      {isOpen && mode === "main-paywall" && <MainPaywall />}
    </section>
  );
}
