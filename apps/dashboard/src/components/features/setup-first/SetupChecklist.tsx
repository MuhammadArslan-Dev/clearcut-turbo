"use client";

// Phase 122 (variant only): replaces the "?/150 Locked" meter / progress bars inside the My Courses card while the learner
// has no level yet: Exam done · Paper · Subject. Same tokens as the card (success / brand / muted), no new colours.
import clsx from "clsx";
import { useTranslations } from "next-intl";
import type { SetupDraft } from "./useSetupFirstStore";

function Step({ state, mark, children }: { state: "done" | "now" | "todo"; mark: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className={clsx(
          "grid size-5 shrink-0 place-items-center rounded-full body-xsmall !font-semibold text-white",
          state === "done" && "bg-[var(--color-success-strong)]",
          state === "now" && "bg-brand",
          state === "todo" && "bg-gray-300",
        )}
      >
        {mark}
      </span>
      <span className={clsx("body-medium", state === "todo" ? "text-surface-gray-muted" : "text-surface-gray-normal")}>{children}</span>
    </li>
  );
}

export default function SetupChecklist({ examName, draft }: { examName: string; draft?: SetupDraft | null }) {
  const t = useTranslations("myCourses.setup");
  return (
    <ul className="flex flex-col gap-2 px-1 py-1" data-testid="setup-checklist">
      <Step state="done" mark="✓">{t("exam", { exam: examName })}</Step>
      <Step state={draft ? "done" : "now"} mark={draft ? "✓" : "2"}>
        {draft ? t("paperDone", { paper: draft.paperName }) : t("paper")}
      </Step>
      <Step state={draft?.paperHasSubjects ? "now" : "todo"} mark="3">
        {draft && !draft.paperHasSubjects ? t("subjectNotNeeded") : t("subject")}
      </Step>
    </ul>
  );
}

export function SetupBadge() {
  const t = useTranslations("myCourses.setup");
  return (
    <span className="shrink-0 rounded-full bg-[var(--color-warning-bg-soft)] px-2.5 py-0.5 body-xsmall !font-bold text-[var(--color-warning)]">
      {t("badge")}
    </span>
  );
}
