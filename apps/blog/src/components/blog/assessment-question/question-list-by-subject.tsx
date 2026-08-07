"use client";
import React from "react";
import { limitWords } from "@clearcut/utils/text-limit";
import { formatToSlug } from "@/utils/slugify";
import QuestionCard from "../ui/question-card";
import { Button } from "@clearcut/ui/button";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { capitalizeFirst } from "@clearcut/utils/text-format";
import { useLanguageStore } from "@/store/useLanguageStore";
import { getQuestionsByLanguage } from "@/utils/getQuestionsByLanguage";

export interface Question {
  id: number;
  question_id: string;
  exam_instance_id_b: string;
  stage_id_b: string;
  section_id_b: string;
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

interface Chapter {
  chapterName: string;
  slug: string;
  type: string;
  questions: Question[];
}

export default function QuestionListBySubject({ data }: { data: Chapter[] }) {
  const [loadingId, setLoadingId] = React.useState<number | null>(null);
  const params = useParams<{ subject_id: string | string[] }>();
  const pathname = usePathname();
  const subjectIdParam = params?.subject_id;
  const subjectId = Array.isArray(subjectIdParam)
    ? subjectIdParam[0]
    : (subjectIdParam ?? "");
  const { courseLanguage } = useLanguageStore();

  return (
    <div className="grid grid-cols-1 gap-4">
      {data.map((item: Chapter, index: number) => {
        const courseLangName =
          courseLanguage.toLowerCase() === "en" ? "en" : "hi";


        const questions = item.questions;

        if (data.length === 0) {
          return;
        }

        return (
          <div key={index} className="bg-white p-4 rounded space-y-5">
            <div className="space-y-1">
              <div className="body-large font-normal text-[var(--color-text-gray-muted)] ">
                Chapter {index + 1}
              </div>
              <div className="heading-small">{item.chapterName}</div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {questions.map((question: Question, index: number) => {
                let translation: Translation | undefined;
                
                if (item.type === "subject") {
                    translation = question.translations?.find(
                        (t) => t.locale === courseLangName,
                    );
                } else {
                    translation = question.translations?.[0];
                }

                const plain =
                  translation?.question?.replace(/<[^>]*>/g, "") || "";

                const snippet = limitWords(plain, 25);
                const slug = translation?.ai_slug
                  ? translation.ai_slug
                  : formatToSlug(limitWords(plain, 4));
                return (
                  <QuestionCard
                    key={index}
                    q_no={index + 1}
                    chapter_name={question.chapter?.name}
                    topic_name={question.topic?.name}
                    index={index}
                    setLoadingId={setLoadingId}
                    path={`/question/${slug}-${question.id}`}
                    onClick={() => setLoadingId(question.id)}
                    questionText={snippet}
                    active={loadingId === question.id}
                    source={capitalizeFirst(subjectId)}
                  />
                );
              })}
            </div>
            <div className="flex justify-center">
              <Link href={`${pathname}/${item.slug}`}>
                <Button variant="soft">
                  View All Questions in this chapter ( {item.chapterName} )
                </Button>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
