"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import CardWrap from "@/components/cards/card-wrap";
import { limitWords } from "@clearcut/utils/text-limit";
import MainContainer from "@/components/main-container";
import StarBadge from "@/components/ui/badge/star-badge";
import { Button } from "@mui/joy";
import CourseCheckBadge from "@/components/ui/badge/course-check-badge";
import { useParams, usePathname } from "next/navigation";
import { formatToSlug, unFormatSlug } from "@/utils/slugify";
import YearListModal from "@/components/feature/year-list-modal";
import { useLanguageStore } from "@/store/useLanguageStore";
import { isArray } from "util";
import QuestionCard from "../ui/question-card";
import { getQuestionsByLanguage } from "@/utils/getQuestionsByLanguage";
import { capitalizeFirst } from "@clearcut/utils/text-format";

export interface Question {
  id: number;
  question_id: string;
  exam_instance_id_b: string;
  stage_id: string;
  section_id: string;
  chapter_id: string;
  topic_id: string;
  question_number: string;
  ai_slug: string;

  translations: Translation[];

  chapter: QuestionChapter;
  topic: Topic;
}

export interface Translation {
  id: number;
  question_new_id: number;
  locale: string;
  ai_slug: string;

  question: string;
  question_image: string | null;

  option_1_text: string | null;
  option_1_image: string | null;

  option_2_text: string | null;
  option_2_image: string | null;

  option_3_text: string | null;
  option_3_image: string | null;

  option_4_text: string | null;
  option_4_image: string | null;

  correct_option: string;
  explanation: string;
}

export interface Topic {
  id: number;
  slug: string;
  topic_id: string;
  name: string;
  children: Topic[];
  trends: unknown | null;
}

export interface QuestionChapter {
  id: number;
  slug: string;
  chapter_id: string;
  name: string;
}

export default function QuestionsList({ data }: { data: Question[] }) {
  const [loadingId, setLoadingId] = React.useState<number | null>(null);
  const [visibleCount, setVisibleCount] = React.useState<number>(10);
  const [allData, setAllData] = React.useState<Question[]>([]);

  const { courseLanguage } = useLanguageStore();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const filteredQuestions = data;

    setAllData(filteredQuestions);
  }, [data, courseLanguage]);

  const shown = Array.isArray(allData)
    ? allData.slice(0, Math.min(visibleCount, allData.length))
    : [];
  const [isOpen, setIsOpen] = React.useState(false);

  const routeParams = useParams<{
    locale: string;
    examName: string;
    level_id: string;
    year: string;
    year_id: string;
    chapter_name: string;
  }>();
  const yearId = routeParams?.year_id;
  const chapterId = routeParams?.chapter_name;

  const sourceName = capitalizeFirst(unFormatSlug(yearId ? yearId : chapterId));
  const courseLang = courseLanguage.toLowerCase() === "en" ? "en" : "hi";

  return (
    <>
      <div className="space-y-2">
        <div className="grid grid-cols-1 gap-4">
          {shown?.map((item, index) => {
            const question = item?.translations;
            let translation: Translation | undefined;

            if (!question) return;
            if (question.length > 1) {
              translation = question.find((item) => item.locale === courseLang);
            } else {
              translation = question[0];
            }

            const plain = translation?.question?.replace(/<[^>]*>/g, "") || "";

            const snippet = limitWords(plain, 25);
            const slug = translation?.ai_slug
              ? translation.ai_slug
              : formatToSlug(limitWords(plain, 4));

            return (
              <>
                <QuestionCard
                  key={index}
                  q_no={index + 1}
                  index={index}
                  setLoadingId={setLoadingId}
                  path={`/question/${slug}-${item.id}`}
                  onClick={() => setLoadingId(item.id)}
                  questionText={snippet}
                  active={loadingId === item.id}
                  source={sourceName}
                  chapter_name={item?.chapter?.name}
                  topic_name={item?.topic?.name}
                />
              </>
            );
          })}
        </div>
      </div>
      {Array.isArray(data) && visibleCount < data.length && (
        <div className="mt-6 flex items-center justify-center">
          <button
            type="button"
            className="px-4 cursor-pointer py-2 rounded-md border border-gray-300 text-sm font-semibold hover:bg-gray-50"
            onClick={() =>
              setVisibleCount((c) => Math.min(c + 10, data.length))
            }
          >
            Show more
          </button>
        </div>
      )}
      <YearListModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      <div className="md:hidden flex fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <Button className="shrink-0" onClick={() => setIsOpen(true)}>
          Years List
        </Button>
      </div>
    </>
  );
}
