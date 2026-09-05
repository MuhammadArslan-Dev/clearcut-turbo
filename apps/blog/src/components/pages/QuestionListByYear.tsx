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
  initialQuestions,
  examState,
}: {
  examName: string;
  level_id: string;
  examYear: string;
  /** Server-fetched questions, so the list is present in the SSR HTML.
   * Previously this component fetched them only after hydration: a 575 KB
   * uncompressed response that pushed mobile LCP to 9.6s and caused 0.191 CLS
   * as the list pushed the header/footer around on arrival. */
  initialQuestions?: unknown;
  /** From the backend `exams.state` column — nullable for national exams
   * (e.g. CTET). Only render the "State" row when the exam actually has one. */
  examState?: string | null;
}) {
  // Queries
  const { data, isLoading, isError } = useQuery({
    queryKey: ["questions", examYear],
    queryFn: () => getQuestion(examYear),
    enabled: !!examYear,
    // With initialData present React Query treats the cache as fresh, so no
    // duplicate client fetch on first paint. `?? undefined` matters: the server
    // fetch resolves to null when the backend fails, and a null initialData
    // would be treated as valid data and suppress the client-side retry.
    initialData: (initialQuestions ?? undefined) as never,
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
    ...(examState ? [{ lable: "State", value: examState }] : []),
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
            <div className="flex items-center gap-2 text-[#00753a] col-span-1 md:justify-self-end">
              <CourseCheckBadge size={16} fill="#00753a" />
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
