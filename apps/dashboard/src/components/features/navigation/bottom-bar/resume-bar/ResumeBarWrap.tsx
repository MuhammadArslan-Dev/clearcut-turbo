"use client";
import { useModalStore } from "@/store/modal/useModalStore";
import ResumeBar from "./ResumeBar";
import { useMemo } from "react";
import { useMyActiveCourses } from "@/hooks/course/useMyActiveCourses";
import { trackEvent } from "@/lib/analytics/browser";
import { useResumeState } from "@/hooks/course/useResumeState";
import { limitChars } from "@clearcut/utils/text-limit";

export default function ResumeBarWrap() {
  const { open } = useModalStore();
  const { courses, activeCourse } = useMyActiveCourses();
  const exam = useMemo(
    () => courses?.active_course?.exam,
    [courses?.active_course?.exam]
  );

  const { data: resumeState } = useResumeState(activeCourse?.group_code);

  return (
    <div>
      <ResumeBar
        courseLogo={exam?.logo_url}
        examName={activeCourse?.exam?.short_name!}
        subject={limitChars(resumeState?.section_name ?? "", 20) ?? null}
        chapterNumber={resumeState?.chapter_number ?? null}
        topicNumber={resumeState?.topic_number ?? null}
        topicTitle={limitChars(resumeState?.topic_name ?? "", 30) ?? null}
        onChangeExam={() => {
          open("change-exam");
        }}
        onResume={async () => {
          await trackEvent("Content Started", {
            source: "learn_dashboard",
            exam_name: exam?.short_name!,
          });
        }}
      />
    </div>
  );
}
