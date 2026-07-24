import React, { memo, useState } from "react";
import { Button } from "@mui/joy";

import Image from "next/image";
import { highlightTextUtil } from "@/utils/text/highlightTextUtil";
import { Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics/browser";
import { useMyActiveCourses } from "@/hooks/course/useMyActiveCourses";
import { useCourseStore } from "@/store/course/useCourseStore";
import { token } from "@/lib/auth-token-client";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/useIsMobile";
import { CircleIcon, FireIcon } from "@/components/ui/icons";
import { useRouter } from "@/i18n/navigation";

type ResumeBarProps = {
  courseLogo: string | undefined | null;
  examName: string;
  subject: string | null;
  chapterNumber: number | null;
  topicNumber: number | null;
  topicTitle: string | null;
  onChangeExam?: () => void;
  onResume?: () => void;
};

const pillButtonSx = {
  borderRadius: "999px",
  px: 2,
};

function ResumeBar({
  courseLogo,
  examName,
  subject,
  chapterNumber,
  topicNumber,
  topicTitle,
  onChangeExam,
  onResume,
}: ResumeBarProps) {
  const t = useTranslations();
  const { activeCourse } = useMyActiveCourses();
  const isMobile = useIsMobile();
  const open = useCourseStore((s) => s.open);
  const router = useRouter();
  const [isResuming, setIsResuming] = useState(false);

  const courseContent = (
  ) => {
    return (
      <div className="flex flex-1 items-center justify-between gap-1 md:gap-4">
        {/* Lesson info */}
        <div className="flex items-center gap-1 md:gap-4 min-w-0">
          {/* Desktop image */}
          {/* <div className="w-[48px] h-[48px] hidden md:block shrink-0">
            <Image
              src={
                courseLogo ||
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNYAyuu-blwzsEjTj92dldM2I2UvueiguRwA&s"
              }
              alt=""
              width={48}
              height={48}
              className="rounded-full object-cover"
            />
          </div> */}

          {/* Mobile image */}
          <div className="w-[28px] h-[28px] block md:hidden shrink-0">
            {courseLogo ? (
              <Image
                src={courseLogo}
                alt=""
                width={28}
                height={28}
                className="rounded-full object-cover"
              />
            ) : (
              <Skeleton className="w-[28px] h-[28px] rounded-full" />
            )}
          </div>

          {/* <div className="min-w-0">
            <h5 className="body-small !font-semibold text-surface-gray-normal truncate">
              {subject && chapterNumber != null && topicNumber != null ? (
                t("resumeBar.lessonPath", {
                  subject,
                  chapter: chapterNumber,
                  topic: topicNumber,
                })
              ) : (
                <Skeleton className="w-48 h-4" />
              )}
            </h5>
            <p className="body-small text-surface-gray-muted truncate">
              {topicTitle ?? <Skeleton className="w-32 h-3" />}
            </p>
          </div> */}
        </div>

        {/* Time (Desktop) */}
        {/* <div className="hidden xl:flex  items-center gap-1 whitespace-nowrap">
          <FireIcon variant="outline" />

          <span className="body-small text-surface-gray-muted">
            {highlightTextUtil(
              t("resumeBar.timeToComplete", { minutes: 2 }),
              [t("resumeBar.minutes", { minutes: 2 })],
              " body-small !font-semibold text-surface-gray-muted"
            )}
          </span>
        </div> */}

        {/* Resume Button */}
        {/* <div className="md:w-[160px] w-[120px] md:max-w-none max-w-[120px] -mb-8 md:mb-0">
          <Button
            variant="outlined"
            fullWidth
            size={isMobile ? "sm" : "lg"}
            sx={pillButtonSx}
            loading={isResuming}
            onClick={
              activeCourse?.stage_id
                ? async () => {
                    setIsResuming(true);
                    await trackEvent("Content Started", {
                      source: "next_milestone",
                      exam_name: activeCourse?.exam?.short_name!,
                    });
                    router.push(`/preparation/${activeCourse?.group_code}`);
                  }
                : () => open("single", activeCourse?.exam!)
            }
            endDecorator={
              !isResuming && (
                <Play
                  size={16}
                  className="text-brand"
                  fill="currentColor"
                  stroke="none"
                />
              )
            }
          >
            <p className="truncate">{t("resumeBar.resume")}</p>
          </Button>
        </div> */}
      </div>
    );
  };

  return (
    <div className="md:px-3 px-2 pb-3 bg-transparent flex items-center justify-center">
      <div className="bg-white border-2 border-brand w-full rounded-lg px-2 md:px-4 py-2 md:py-3 md:h-[72px] max-w-[1152px]">
        <div className="flex flex-col md:flex-row md:items-center md:gap-4 h-full">
          {/* ---------------- Left: Current Exam (Desktop only) ---------------- */}
          <div className="hidden md:flex items-center gap-3 bg-[var(--color-primary-subtle)] rounded-md px-4 py-2">
            <span className="body-large text-surface-gray-subtle truncate">
              {highlightTextUtil(
                t("resumeBar.currentExam", { exam: examName }),
                [examName],
                "body-large text-surface-gray-subtle !font-semibold"
              )}
            </span>

            <Button size="sm" sx={pillButtonSx} onClick={onChangeExam}>
              <div className="flex items-center gap-2">
                <span className="hidden lg:block">
                  {t("resumeBar.changeExam")}
                </span>
                <CircleIcon size={20} />
              </div>
            </Button>
          </div>

          {/* Divider */}
          {/* <div className="hidden md:block w-[2px] h-full bg-[#90a5bb]" /> */}

          {/* ---------------- Center Content ---------------- */}
          {courseContent()}
          {/* ---------------- Mobile Time ---------------- */}
          {/* <div className="flex md:hidden items-center gap-2 mt-1">
            <div className="w-5 h-5">
              <FireIcon
                variant={"red"}
                color="var(--color-surface-gray-muted)"
              />
            </div>
            <span className="body-small text-surface-gray-muted">
              {highlightTextUtil(
                t("resumeBar.timeToComplete", { minutes: 2 }),
                [t("resumeBar.minutes", { minutes: 2 })],
                " body-small !font-semibold text-surface-gray-muted"
              )}
            </span>
          </div> */}
        </div>
      </div>
    </div>
  );
}

export default memo(ResumeBar);
