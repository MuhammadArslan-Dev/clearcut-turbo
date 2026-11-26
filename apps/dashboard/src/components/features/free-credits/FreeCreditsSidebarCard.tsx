"use client";

import { useTranslations } from "next-intl";
import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";
import { useGetCurrentCourseStore } from "@/store/course/useGetCurrentCourseStore";
import { testTypeOfTab } from "@/lib/freeCredits/ui";
import FreeCreditDots from "./FreeCreditDots";
import { useFreeCredits } from "./useFreeCredits";
import { openCreditsInfo } from "./openCreditsInfo";

/**
 * Desktop test-series sidebar (approved design 03): "Free tests" card above Progress with the
 * dots, "3 of 5 free tests left" and a "Get unlimited tests" link. Nothing for users outside the
 * treatment or at 0 left (the lock screen takes over). The sidebar itself is desktop-only.
 */
export default function FreeCreditsSidebarCard() {
  const t = useTranslations("freeCredits");
  const { get } = useQueryParams();
  const course = useGetCurrentCourseStore((s) => s.course);
  const examShort = course?.exam?.short_name;
  const { credits } = useFreeCredits(examShort, { skip: course?.status === "active" });
  if (!credits.active || credits.limit <= 0) return null;
  return (
    <section className="flex flex-col gap-1.5 pb-3" data-testid="free-credits-sidebar-card">
      <h6 className="heading-small !font-semibold text-surface-gray-normal">{t("sidebar.title")}</h6>
      <FreeCreditDots limit={credits.limit} remaining={credits.remaining} />
      <p className="body-medium text-surface-gray-normal">
        {credits.remaining > 0
          ? t("chip", { remaining: credits.remaining, limit: credits.limit })
          : t("chipNone", { limit: credits.limit })}
      </p>
      <button
        type="button"
        className="body-medium w-fit cursor-pointer text-left !font-semibold text-brand underline"
        onClick={() => openCreditsInfo(course, "sidebar", testTypeOfTab(get("testType")))}
      >
        {t("sidebar.link")}
      </button>
      <div className="mt-2 h-px w-full bg-gray-200" aria-hidden="true" />
    </section>
  );
}
