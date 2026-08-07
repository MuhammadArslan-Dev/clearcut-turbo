"use client";
import React from "react";
import Link from "next/link";
import { limitWords } from "@clearcut/utils/text-limit";
import MainContainer from "@/components/main-container";
import StarBadge from "@/components/ui/badge/star-badge";
import { Button } from "@clearcut/ui/button";
import CourseCheckBadge from "@/components/ui/badge/course-check-badge";
import { useParams, usePathname } from "next/navigation";
import { formatToSlug, unFormatSlug } from "@/utils/slugify";
import dynamic from "next/dynamic";
import { useLanguageStore } from "@/store/useLanguageStore";

/**
 * Code-split, client-only — same reasoning as the language modal in
 * components/blog/header.tsx. This modal shares the `modals-bottom-sheet`
 * primitive, which renders nothing while `isOpen` is false, so `ssr: false`
 * leaves the server HTML unchanged and simply defers the chunk until a user
 * opens the year picker.
 */
const YearListModal = dynamic(
  () => import("@/components/feature/year-list-modal"),
  { ssr: false },
);
// NOTE: this file used to `import { isArray } from "util"` — Node's built-in
// util module, in a "use client" component. It was never referenced (the code
// uses Array.isArray), but it still pulled a Node polyfill into the browser
// bundle. Removed.
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

  const { courseLanguage } = useLanguageStore();

  // Derive straight from the prop. This used to be `useState([])` populated by a
  // `useEffect` that assigned `data` unchanged — so the list rendered empty
  // during SSR and only filled in after hydration. That kept the questions out
  // of the initial HTML entirely (invisible to crawlers) and made the whole
  // list a post-hydration layout shift: measured 0.191 CLS and a 9.6s mobile
  // LCP on the year page. The effect performed no transformation, so deriving
  // is equivalent.
  const allData: Question[] = Array.isArray(data) ? data : [];

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
