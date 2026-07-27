"use client";
import React from "react";
import MainContainer from "@/components/main-container";
import CustomizableHeader from "@/components/customizable-header";
import { useRouter } from "next/navigation";
import { useSelectedDataStore } from "@/store/blog/useSelectedDataStore";
import { Card } from "@clearcut/ui/card";
import { highlightTextUtil } from "@clearcut/utils/highlight-text";
import Image from "next/image";
import CourseCheckBadge from "../ui/badge/course-check-badge";
import { formatToSlug } from "@/utils/slugify";
import CalendarIcon from "@clearcut/ui/icons/calendar-icon";
import CircleClockIcon from "@clearcut/ui/icons/circle-clock-icon";
import WarningCirleIcon from "@clearcut/ui/icons/warning-circle-icon";
import ChartSuccessBarIcon from "../ui/icons/chart-success-bar-icon";
import CourseCard from "../ui/exam/CourseCard";
import { Button } from "@clearcut/ui/button";
import { useTranslations } from "next-intl";
import CheckIcon from "../ui/icons/check-icon";

const ExamCourseCard = ({
  item,
  onClick,
  bgcolor,
}: {
  item: Exam;
  onClick: () => void;
  bgcolor?: string;
}) => {
  const t = useTranslations("");

  const metadata = JSON.parse(item?.metadata);
  const points = [
    {
      id: 1,
      icon: <CalendarIcon />,
      name: "Exam Date",
      value: metadata?.exam_date,
    },
    {
      id: 2,
      icon: <WarningCirleIcon />,
      name: "Exam Mode",
      value: metadata?.exam_mode,
    },
    {
      id: 3,
      icon: <CircleClockIcon />,
      name: "Duration",
      value: metadata?.duration,
    },
    {
      id: 4,
      icon: <ChartSuccessBarIcon />,
      name: "Cutoff",
      value: metadata?.cutoff,
    },
  ];
  return (
    <Card
      bgcolor={bgcolor}
      onClick={onClick}
      minWidth={"250px"}
      padding={0}
      maxWidth={"350px"}
    >
      <div className="flex flex-col gap-3 px-1 pt-3 pb-2 relative cursor-pointer">
        <div className="flex justify-center px-2 gap-4 2xl:gap-1">
          <div className="min-w-[100px] max-w-[200px] col-span-4 flex flex-col gap-1 items-center">
            <div className="relative w-auto h-[64px] rounded-full ">
              <Image
                src={
                  item.logo_url ||
                  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNYAyuu-blwzsEjTj92dldM2I2UvueiguRwA&s"
                }
                alt=""
                width={64}
                height={64}
                className="w-[64px] h-[64px] object-cover rounded-full grayscale opacity-70"
              />
              <div className="absolute bottom-0 flex items-center justify-center rounded-full right-0 w-5 h-5 bg-white">
                <CheckIcon variant="design" size={16} />
              </div>
            </div>
            {/* <div className=''> */}
            <div className="flex flex-col items-center">
              <p className="heading-small !font-semibold text-surface-gray-normal whitespace-nowrap">
                {item.short_name}
              </p>
              <p className="body-medium surface-text-gray-muted whitespace-nowrap">
                {item.exam_type}
              </p>
            </div>
            {/* </div> */}
          </div>

          <div className="w-[200px] h-full">
            <div className="col-span-8 h-full flex flex-col justify-center gap-2">
              {points.map((point) => (
                <div
                  key={point.id}
                  className="body-small !font-normal flex gap-1 items-center mb-0.5"
                >
                  <div className="flex items-center gap-2">
                    {point.icon}
                    <p className="body-medium !font-normal surface-text-gray-muted">
                      {point?.name} :
                    </p>
                  </div>
                  <p className="text-surface-gray-normal ">{point.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default function BlogExamCardsSection({ data }: { data: Exam[] }) {
  const router = useRouter();
  const setSelectedCourse = useSelectedDataStore((s) => s.setSelectedCourse);
  const onSelect = (item: Exam) => {
    // Save in client-side store (optional)
    setSelectedCourse(item);
    const examId = item.short_name;

    // Extract value after the underscore (_) and convert to lowercase
    const formattedId = formatToSlug(examId);

    // Navigate with clean lowercase URL
    router.push(`/${formattedId}`);
  };

  const centralExams = data?.filter(
    (item) =>
      item.state.toLowerCase().includes("india") &&
      item.status.toLowerCase().includes("active"),
  );
  const stateExams = data
    ?.filter(
      (item) =>
        !item.state.toLowerCase().includes("india") &&
        item.status.toLowerCase().includes("active"),
    )
    .reduce(
      (groups, exam) => {
        const key = exam.state;
        if (!groups[key]) groups[key] = [];
        groups[key].push(exam);
        return groups;
      },
      {} as Record<string, Exam[]>,
    );

  return (
    <MainContainer
      padding="py-4 px-3"
      bgColor="transparent"
      maxWidth="max-w-[900px]"
    >
      <section className="space-y-8">
        <CustomizableHeader
          showEyebrow={false}
          heading={"Exams on Clear Cutoff"}
          highlightText={"Clear Cutoff"}
          subheading={"Start your journey of success with Clear Cutoff Academy"}
          headingColor="text-gray-900"
          highlightColor="text-blue-500"
          subheadingColor="text-gray-600 "
          alignment="md:text-center text-left"
          headingClasses="!mb-1"
          headingSize="heading-2xlarge !font-semibold"
        />

        <div className="space-y-6">
          {centralExams?.length > 0 && (
            <div className="w-full">
              <div className="heading-xlarge font-semibold">
                {highlightTextUtil("Central Teaching Exams", "Central")}
              </div>
              <div className="mt-5 grid items-start gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
                {centralExams.map((item) => {
                  return (
                    <ExamCourseCard
                      bgcolor="white"
                      key={item.id}
                      item={item}
                      onClick={() => onSelect(item)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {Object.entries(stateExams)?.length > 0 && (
            <div className="w-full">
              <div className="heading-xlarge">
                {highlightTextUtil("State Teaching Exams", "State")}
              </div>
              <div className="mt-4 md:mt-5 grid items-start gap-5 ">
                {Object.entries(stateExams).map(([state, exams]) => {
                  return (
                    <div key={state}>
                      <h3 className="heading-large  neutral-blueGrayLight">
                        {state}
                      </h3>
                      <div
                        className={[
                          "mt-4 grid items-start gap-5 grid-cols-2 ",
                          exams.length > 3
                            ? "md:grid-cols-2 lg:grid-cols-4"
                            : "md:grid-cols-2 lg:grid-cols-3",
                        ].join(" ")}
                      >
                        {exams.map((item) => {
                          return (
                            <ExamCourseCard
                              bgcolor="white"
                              key={item.id}
                              item={item}
                              onClick={() => onSelect(item)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {/* <div className=" text-center space-y-6">
                    <p className="text-xl md:text-2xl text-gray-700">
                        Used by <span className="font-bold text-blue-600">10,000+</span> students to clear TET exams.
                    </p>
                    <p className="text-gray-500 max-w-3xl mx-auto text-sm md:text-base">
                        Join thousands of successful TET aspirants who chose smart, affordable learning over expensive coaching!
                    </p>
                    <div className="flex items-center justify-center gap-2 text-gray-700">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
                            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
                                <path fill="currentColor" d="M10 0a10 10 0 1010 10A10.011 10.011 0 0010 0zm4.707 8.293l-5.5 5.5a1 1 0 01-1.414 0l-2.5-2.5a1 1 0 011.414-1.414L8.5 11.586l4.793-4.793a1 1 0 011.414 1.414z" />
                            </svg>
                        </span>
                        <span className="font-semibold">4.9+</span>
                        <span className="text-gray-500">Average Rating by our Students!</span>
                    </div>
                </div> */}
      </section>
    </MainContainer>
  );
}
