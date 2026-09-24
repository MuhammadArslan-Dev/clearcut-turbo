"use client";

import { memo, useCallback, useMemo } from "react";
import { ListChecks, X } from "lucide-react";

import { Button } from "@clearcut/ui/button";
import AttemptTopbar from "@/components/features/attempt-ui/AttemptTopbar";
import FullscreenButton from "@/components/features/attempt-ui/FullscreenButton";

import { useGetCurrentCourse } from "@/hooks/course/useGetCurrentCourse";
import { useExamStore } from "@/components/features/exam/store/useExamStore";
import { useExamModalStore } from "@/components/features/exam/store/useExamModalStore";
import { useExamSummary } from "@/components/features/exam/hooks/useExamSummary";
import { LanguageIcon, LogoutDoorIcon } from "@/components/ui/icons";

/* -------------------------------------------------------------------------- */
/* Sub Components */
/* -------------------------------------------------------------------------- */

const EMPTY_LOCALES: string[] = [];

const LanguageToggle = memo(function LanguageToggle() {
  const setLanguage = useExamStore((s) => s.setLanguage);
  const language = useExamStore((s) => s.language);
  // Toggle among the locales the CURRENT QUESTION actually has translations
  // for — not a locale derived from the course enrollment's `language`
  // field. That field reflects the learner's chosen instruction medium and
  // can be "english" even though the question bank still carries a real
  // Hindi translation (translations are attached per-question, not per
  // course), so deriving the toggle target from it made the button a no-op
  // (en → en) for every English-enrolled learner. Exam content translations
  // are only ever en/hi (see contentLocale.ts) so this stays a plain toggle.
  // Select the raw (stable) translations array reference — mapping it to a
  // locales array inside the selector itself would return a brand-new array
  // every call, which zustand's useSyncExternalStore treats as "the snapshot
  // changed" on every render and throws into an infinite render loop
  // ("Maximum update depth exceeded"), same as the fix documented for
  // QuestionNavigatorSheet's EMPTY_SECTIONS.
  const translations = useExamStore((s) => {
    const q = s.exam?.sections[s.currentSection]?.questions[s.currentQuestion];
    return q?.question?.translations;
  });
  const locales = useMemo(
    () => translations?.map((t: { locale: string }) => t.locale) ?? EMPTY_LOCALES,
    [translations],
  );

  const toggleLocale = locales.find((l) => l !== language) ?? locales[0];

  if (locales.length < 2 || !toggleLocale) return null;

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
  const { title, meta } = useExamSummary();

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
