"use client";
import React from "react";
import CustomizableHeader from "../customizable-header";
import DetailsSectionCard from "../blog/assessment-question/details-section-card";
import { unFormatSlug } from "@/utils/slugify";
import CourseCheckBadge from "../ui/badge/course-check-badge";
import QuestionsList from "../blog/assessment-question/questions-list";
import { useQuery } from "@tanstack/react-query";

const getQuestion = async (examYear: string) => {
  const query = `year=${examYear}`;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/blog/get-questions?${query}`,
  );

  if (!res.ok) {
    throw new Error("Failed to fetch questions");
  }

  return res.json();
};

export default function QuestionListByYear({
  examName,
  level_id,
  examYear,
}: {
  examName: string;
  level_id: string;
  examYear: string;
}) {
  // Queries
  const { data, isLoading, isError } = useQuery({
    queryKey: ["questions", examYear],
    queryFn: () => getQuestion(examYear),
    enabled: !!examYear,
  });

  

  const Labels = [
    {
      lable: "Exam",
      value: examName.toLocaleUpperCase() ?? "REET",
    },
    {
      lable: "Level",
      value: unFormatSlug(level_id ?? "") ?? "",
    },
    {
      lable: "State",
      value: "Rajasthan",
    },
  ];

  return (
    <>
      <div>
        <div className="flex flex-col gap-5">
          <CustomizableHeader
            showEyebrow={false}
            heading={`${examName.toUpperCase()} Exam ${unFormatSlug(
              level_id ?? "",
            )}`}
            highlightText={examName.toUpperCase()}
            subheading={`${examName.toUpperCase()} exam ${unFormatSlug(
              level_id ?? "",
            )} preparation with Clear Cutoff`}
            headingColor="text-gray-900"
            highlightColor="text-blue-500"
            subheadingColor="text-gray-600"
            alignment="md:text-center text-left"
            headingClasses="!mb-1"
            headingSize="heading-xlarge !font-semibold"
            className="px-4"
          />
          <div className="w-full bg-white p-4">
            <DetailsSectionCard
              yearId={unFormatSlug(examYear).toUpperCase()}
              Labels={Labels}
              totalQuestions={data?.data ?? 0}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <CustomizableHeader
          showEyebrow={false}
          heading={`Verified Answers and Explanations`}
          headingColor="text-gray-900"
          alignment="md:text-center text-left"
          headingClasses="!mb-0"
          headingSize="heading-xlarge !font-semibold"
          className="px-4"
        />

        <div className="p-4 bg-white space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-2 ">
            <div className="heading-small col-span-1">Year-wise questions</div>
            <div className="flex items-center gap-2 text-[#00a251] col-span-1 md:justify-self-end">
              <CourseCheckBadge size={16} fill="#00a251" />
              <p>by Clear Cutoff</p>
            </div>
          </div>
          {isLoading && <p className="flex justify-center items-center">Loading...</p>}
          {isError && <p>Error</p>}
          <QuestionsList data={data?.data} />
        </div>
      </div>
    </>
  );
}
