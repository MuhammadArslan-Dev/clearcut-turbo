"use client";

import { memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";

import { Button } from "@clearcut/ui/button";

import { usePreparationStore } from "@/components/features/preparation/store/usePreparationDataStore";

import Text from "@clearcut/ui/text";
import SandTimerIcon from "@/components/ui/icons/sand-timer-icon";
import SectionsTab from "@/components/features/exam/components/Tabs/SectionsTab";
import CountDownTimer from "@/components/features/exam/components/countdown/CountDownTimer";
import { useGetCurrentCourseStore } from "@/store/course/useGetCurrentCourseStore";
import { useExamStore } from "@/components/features/exam/store/useExamStore";
import { useExamModalStore } from "@/components/features/exam/store/useExamModalStore";
import {
  LanguageIcon,
  LearningInsightIllustration,
  LogoutDoorIcon,
} from "@/components/ui/icons";

/* -------------------------------------------------------------------------- */
/* Types */
/* -------------------------------------------------------------------------- */

type TopbarProps = {
  className?: string;
};

/* -------------------------------------------------------------------------- */
/* Sub Components */
/* -------------------------------------------------------------------------- */

const TimerSection = memo(function TimerSection({
  timeLeft,
}: {
  timeLeft: number;
}) {
  const { exam } = useGetCurrentCourseStore();

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#90a5bb]">
        <SandTimerIcon size={24} />
      </div>

      {/* TODO: Replace with real timer */}
      <div className="h-full lg:w-[150px] w-[100px] rounded">
        <CountDownTimer duration={timeLeft} />
        <TestInfo
          title={exam?.short_name}
          className="body-small !font-normal lg:hidden"
        />
      </div>
    </div>
  );
});

const TestInfo = memo(function TestInfo({
  title,
  className,
}: {
  title: string | React.ReactNode;
  className?: string;
}) {
  return (
    <Text
      as="p"
      variant="body-medium"
      weight="semibold"
      color="gray-normal"
      className={className}
    >
      {title}
    </Text>
  );
});

const Actions = memo(function Actions({
  onEndTest,
}: {
  onEndTest: () => void;
}) {
  const { setLanguage, getExamContext, language } = useExamStore();
  const { open, closeModal, stack } = useExamModalStore();
  const active = stack[stack.length - 1];
  const { currentQuestion } = getExamContext();
  const hasMultipleTranslations = (currentQuestion?.question?.translations?.length ?? 0) > 1;

  return (
    <div className="flex items-center gap-6">
      {hasMultipleTranslations && (
        <div onClick={() => setLanguage("hi")} className="cursor-pointer">
          <LanguageIcon size={30} />
        </div>
      )}

      <div className="md:w-[120px] lg:block hidden">
        <Button
          sx={{
            borderRadius: "50px",
          }}
          variant="soft"
          color="gray"
          fullWidth
          size="sm"
          onClick={onEndTest}
        >
          <div className="flex items-center gap-[6px]">
            <span> End Test</span>

            <LogoutDoorIcon size={16} />
          </div>
        </Button>
      </div>
      <div onClick={() => open("exam-navigation-panel")} className="lg:hidden block cursor-pointer">
        {active === "exam-navigation-panel" ? (
          <svg
            width="48"
            height="32"
            viewBox="0 0 48 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="48" height="32" rx="16" fill="#0083FF" />
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
          <svg
            width="48"
            height="32"
            viewBox="0 0 48 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
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


      </div>
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/* Main Component */
/* -------------------------------------------------------------------------- */

function Topbar({ className }: TopbarProps) {
  const router = useRouter();
  const t = useTranslations("Sidebar");
  const { getExamContext, timeLeft } = useExamStore();

  const { course } = usePreparationStore();
  const { exam } = useGetCurrentCourseStore();
  const { sections } = getExamContext();

  const { open, stack } = useExamModalStore();

  /* ------------------------------------------------------------------------ */
  /* Derived Data */
  /* ------------------------------------------------------------------------ */

  /* ------------------------------------------------------------------------ */
  /* Handlers */
  /* ------------------------------------------------------------------------ */

  const handleEndTest = useCallback(() => {
    open("end-exam");
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Render */
  /* ------------------------------------------------------------------------ */

  return (
    <header className={`border-b border-slate-200 bg-white ${className ?? ""}`}>
      <div className="flex lg:flex-row  flex-col w-full items-center justify-center lg:items-center lg:justify-between lg:gap-3 lg:pl-3">
        {/* Left Section */}
        <div className="flex w-full justify-between lg:justify-start items-center gap-12 py-1 lg:py-0 px-3 lg:px-0">
          <TimerSection timeLeft={timeLeft} />

          <TestInfo title={exam?.short_name} className="lg:block hidden" />

          <Actions onEndTest={handleEndTest} />
        </div>

        {/* Right Section */}
        {sections.length > 1 && (
          <div className="lg:flex justify-end items-center max-w-[770px] lg:bg-[var(--color-brand-dark)] w-full lg:rounded-l-full overflow-hidden">
            <SectionsTab />
          </div>
        )}
      </div>
    </header>
  );
}

export default memo(Topbar);
