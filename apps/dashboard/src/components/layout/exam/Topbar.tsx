"use client";

import { memo, useCallback, useMemo } from "react";
import { ListChecks, X } from "lucide-react";

import { Button } from "@clearcut/ui/button";
import AttemptTopbar from "@/components/features/attempt-ui/AttemptTopbar";
import FullscreenButton from "@/components/features/attempt-ui/FullscreenButton";

import { useGetCurrentCourseStore } from "@/store/course/useGetCurrentCourseStore";
import { useGetCurrentCourse } from "@/hooks/course/useGetCurrentCourse";
import { useExamStore } from "@/components/features/exam/store/useExamStore";
import { useExamModalStore } from "@/components/features/exam/store/useExamModalStore";
import { courseLanguageToLocale } from "@/utils/text/contentLocale";
import { LanguageIcon, LogoutDoorIcon } from "@/components/ui/icons";

/* -------------------------------------------------------------------------- */
/* Helpers */
/* -------------------------------------------------------------------------- */

const TEST_TYPE_LABEL: Record<string, string> = {
  "full-length": "Full Length Test",
  sectional: "Sectional Test",
  chapter: "Chapter Test",
};

const formatDuration = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const parts: string[] = [];
  if (h) parts.push(`${h} ${h === 1 ? "Hour" : "Hours"}`);
  if (m || !h) parts.push(`${m} ${m === 1 ? "Minute" : "Minutes"}`);
  return parts.join(" ");
};

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

/* -------------------------------------------------------------------------- */
/* Sub Components */
/* -------------------------------------------------------------------------- */

// Title + "150 Questions • 150 Marks • 2 Hours 30 Minutes". Reads only the
// exam object, so it doesn't re-render on navigation.
function useTestInfo() {
  const exam = useExamStore((s) => s.exam);
  const shortName = useGetCurrentCourseStore((s) => s.exam?.short_name);

  return useMemo(() => {
    if (!exam) return { title: shortName ?? "", meta: "" };

    let questions = 0;
    let marks = 0;
    exam.sections.forEach((s) => {
      questions += s.questions.length;
      marks += Number(s.section?.total_marks ?? 0);
    });

    const type = TEST_TYPE_LABEL[exam.type ?? ""] ?? "Test";
    const date = exam.started_at ? ` (${dateFmt.format(new Date(exam.started_at.replace(" ", "T")))})` : "";
    const duration = Number(exam.total_duration_seconds ?? 0);

    return {
      title: `${type}${shortName ? ` \u2013 ${shortName}` : ""}${date}`,
      // Marks fall back to the question count (+1 each) when a section has no total.
      meta: [
        `${questions} Questions`,
        `${marks || questions} Marks`,
        duration ? formatDuration(duration) : null,
      ]
        .filter(Boolean)
        .join(" \u2022 "),
    };
  }, [exam, shortName]);
}

const LanguageToggle = memo(function LanguageToggle() {
  const setLanguage = useExamStore((s) => s.setLanguage);
  const language = useExamStore((s) => s.language);
  const courseLanguage = useGetCurrentCourseStore((s) => s.course?.language);
  // Boolean selector: only re-renders when this flips, not on every answer.
  const hasMultipleTranslations = useExamStore((s) => {
    const q = s.exam?.sections[s.currentSection]?.questions[s.currentQuestion];
    return (q?.question?.translations?.length ?? 0) > 1;
  });

  // Toggle between English and the enrolled course's own content language
  // (Hindi/Marathi/Punjabi) — not a hardcoded "hi". A Marathi-enrolled
  // course only ever has en/mr translations synced for it, so blindly
  // switching to "hi" landed on a locale that doesn't exist for the question.
  const contentLocale = courseLanguageToLocale(courseLanguage);
  const toggleLocale = language === "en" ? contentLocale : "en";

  if (!hasMultipleTranslations) return null;

  return (
    <button
      type="button"
      aria-label="Change question language"
      onClick={() => setLanguage(toggleLocale)}
      className="cursor-pointer"
    >
      <LanguageIcon size={30} />
    </button>
  );
});

const ExamFullscreenButton = memo(function ExamFullscreenButton() {
  const toggle = useCallback(() => {
    if (typeof document === "undefined") return;
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  }, []);

  return <FullscreenButton onClick={toggle} compact />;
});

// Below `lg` the question navigator lives in a bottom sheet — this opens it.
const NavigatorToggle = memo(function NavigatorToggle() {
  const open = useExamModalStore((s) => s.open);
  const isOpen = useExamModalStore((s) => s.stack[s.stack.length - 1] === "exam-navigation-panel");

  return (
    <button
      type="button"
      aria-label="Progress and questions"
      onClick={() => open("exam-navigation-panel")}
      className="flex h-9 w-12 cursor-pointer items-center justify-center rounded-full bg-brand text-white lg:hidden"
    >
      {isOpen ? <X size={18} /> : <ListChecks size={18} />}
    </button>
  );
});

/* -------------------------------------------------------------------------- */
/* Main Component */
/* -------------------------------------------------------------------------- */

// The exam short name ("CTET") comes from the enrolled course. Loading it here
// (cached React Query, same key the test-series pages use) keeps the title
// complete even when /exam is opened directly. A component, not a bare hook
// call, so it only mounts once the exam (and its course code) is known —
// useGetCurrentCourse has no `enabled` guard of its own.
function CourseLoader({ courseId }: { courseId: string }) {
  useGetCurrentCourse({ courseId });
  return null;
}

function Topbar() {
  const open = useExamModalStore((s) => s.open);
  const courseCode = useExamStore((s) => s.exam?.course?.group_code as string | undefined);
  const handleEndTest = useCallback(() => open("end-exam"), [open]);
  const { title, meta } = useTestInfo();

  return (
    <>
    {courseCode && <CourseLoader courseId={courseCode} />}
    <AttemptTopbar
      compact
      title={title}
      meta={meta}
      quote={`"Small steps every day lead to big results." \u2014 Clear Cutoff`}
      actions={
        <>
          <LanguageToggle />

          <div className="hidden lg:block">
            <Button variant="soft" color="gray" size="sm" sx={{ borderRadius: "10px" }} onClick={handleEndTest}>
              <div className="flex items-center gap-[6px]">
                <span>End Test</span>
                <LogoutDoorIcon size={16} />
              </div>
            </Button>
          </div>

          <ExamFullscreenButton />
          <NavigatorToggle />
        </>
      }
    />
    </>
  );
}

export default memo(Topbar);
