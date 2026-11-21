"use client";

// Phase 122 (variant only): a slim reminder on the Learn page after the learner closed the Select Paper sheet without
// saving: on this page view, or on any later visit once the sheet has been shown to them (it opens by itself only once per
// enrolment, so after that the banner is the reminder). Gone once the setup is saved (no longer eligible) or while the sheet is open.
import { useTranslations } from "next-intl";
import type { Exam } from "@/types/Exam";
import { useCourseStore } from "@/store/course/useCourseStore";
import { openSetupSheet, useSetupFirst, useSetupFirstStore } from "./useSetupFirstStore";
import { wasAutoOpened } from "./SetupFirstGate";

export default function SetupBanner({ exam, enrolmentUuid }: { exam?: Exam | null; enrolmentUuid?: string | null }) {
  const t = useTranslations("myCourses.setup");
  const { treatment } = useSetupFirst();
  const dismissed = useSetupFirstStore((s) => s.dismissed);
  const draft = useSetupFirstStore((s) => (exam?.id != null ? s.drafts[String(exam.id)] : undefined));
  const sheetOpen = useCourseStore((s) => s.isOpen);

  const shownBefore = !!enrolmentUuid && typeof window !== "undefined" && wasAutoOpened(enrolmentUuid);
  if (!treatment || !(dismissed || shownBefore) || sheetOpen || !exam) return null;

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--color-warning-muted)] bg-[var(--color-warning-bg-soft)] px-3 py-2"
    >
      <p className="body-small text-surface-gray-normal">
        <span className="!font-semibold">{t("bannerTitle")}</span>{" "}
        {draft?.paperHasSubjects ? t("bannerBodyPaper", { paper: draft.paperName }) : t("bannerBody")}
      </p>
      <button
        type="button"
        onClick={() => openSetupSheet(exam, "banner")}
        className="shrink-0 rounded-full bg-[var(--color-warning)] px-4 py-1.5 body-small !font-semibold text-white"
      >
        {t("bannerCta")}
      </button>
    </div>
  );
}
