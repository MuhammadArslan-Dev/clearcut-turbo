"use client";

import { memo, useCallback, useMemo } from "react";

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
// The two-shade pill + hamburger/X glyph is the original icon this button
// had before the 2026-09-23 refactor swapped it for plain lucide icons —
// restored verbatim (including the off-token #2B7EFF closed-state blue,
// which predates the design-token system) per direct request.
const NavigatorToggle = memo(function NavigatorToggle() {
  const open = useExamModalStore((s) => s.open);
  const isOpen = useExamModalStore((s) => s.stack[s.stack.length - 1] === "exam-navigation-panel");

  return (
    <button
      type="button"
      aria-label="Progress and questions"
      onClick={() => open("exam-navigation-panel")}
      className="cursor-pointer lg:hidden"
    >
      {isOpen ? (
        <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="32" rx="16" fill="var(--color-brand)" />
          <path
            d="M18.7098 11.1219L28.6093 21.0214C28.9998 21.4119 29.633 21.4119 30.0235 21.0214C30.414 20.6309 30.414 19.9977 30.0235 19.6072L20.124 9.7077C19.7335 9.31718 19.1003 9.31718 18.7098 9.7077C18.3193 10.0982 18.3193 10.7314 18.7098 11.1219Z"
            fill="white"
          />
          <path
            d="M28.6066 9.70785L18.7071 19.6073C18.3166 19.9979 18.3166 20.631 18.7071 21.0216C19.0976 21.4121 19.7308 21.4121 20.1213 21.0216L30.0208 11.1221C30.4113 10.7315 30.4113 10.0984 30.0208 9.70785C29.6303 9.31733 28.9971 9.31733 28.6066 9.70785Z"
            fill="white"
          />
        </svg>
      ) : (
        <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="32" rx="16" fill="#2B7EFF" />
          <path
            d="M31 19H17C16.4477 19 16 19.4477 16 20C16 20.5523 16.4477 21 17 21H31C31.5523 21 32 20.5523 32 20C32 19.4477 31.5523 19 31 19Z"
            fill="white"
          />
          <path
            d="M31 15H17C16.4477 15 16 15.4477 16 16C16 16.5523 16.4477 17 17 17H31C31.5523 17 32 16.5523 32 16C32 15.4477 31.5523 15 31 15Z"
            fill="white"
          />
          <path
            d="M31 11H17C16.4477 11 16 11.4477 16 12C16 12.5523 16.4477 13 17 13H31C31.5523 13 32 12.5523 32 12C32 11.4477 31.5523 11 31 11Z"
            fill="white"
          />
        </svg>
      )}
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
