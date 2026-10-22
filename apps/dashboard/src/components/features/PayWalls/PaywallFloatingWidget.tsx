import { usePreparationStore } from "@/components/features/preparation/store/usePreparationDataStore";
import Button from "@clearcut/ui/button";
import { Card } from "@clearcut/ui/card";
import Text from "@clearcut/ui/text";
import { useGetCurrentCourseStore } from "@/store/course/useGetCurrentCourseStore";
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { PaywallSource, usePaywallsStore } from "./usePaywallsStore";
import { useRouter } from "@/i18n/navigation";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useTopbarVisibilityStore } from "@/store/dashboard/useTopbarVisibilityStore";
import { ExamEnrollmentWithExam } from "@/lib/dashboard/learning";
import { ChevronIcon } from "@/components/ui/icons";
import { getPriceForVariant } from "@/lib/payment/examPriceOverrides";
import { useTranslations } from "next-intl";

export default function PaywallFloatingWidget() {
  const t = useTranslations();
  const { course } = useGetCurrentCourseStore();
  // The "start here" tour points at free content; the Unlock bar would cover it (CC-79).
  const startGuideActive = usePreparationStore((s) => s.startGuideActive);

  const router = useRouter();
  const isMobile = useIsMobile();

  const priceRowOuterRef = useRef<HTMLDivElement>(null);
  const priceRowRef = useRef<HTMLDivElement>(null);

  const hasActive = useMemo(
    () => course?.status === "trial" || course?.status === "trial_end",
    [course?.status],
  );

  // Mobile: the price row collapses 1:1 with the Topbar's scroll-hide —
  // the same raw store offset Topbar reads, clamped against this row's OWN
  // measured height. Styles are written to the DOM from a store
  // subscription, so scrolling never re-renders this widget.
  // `hasActive` is a dependency, not just `[]`: this component renders
  // `false` until course status resolves to "trial"/"trial_end", so the refs
  // are null on first mount whenever that data hasn't loaded yet — an empty
  // deps array would never re-run once they attach, leaving the scroll-hide
  // permanently inert.
  useLayoutEffect(() => {
    const outer = priceRowOuterRef.current;
    const row = priceRowRef.current;
    if (!outer || !row) return;

    let rowHeight = row.scrollHeight;
    const apply = () => {
      const offset = useTopbarVisibilityStore.getState().offset;
      const clamped = isMobile ? Math.min(offset, rowHeight) : 0;
      const visible = rowHeight ? 1 - clamped / rowHeight : 1;
      outer.style.height = `${rowHeight * visible}px`;
      outer.style.opacity = String(visible);
      // Was a flex `gap-3` on the parent, but a gap doesn't shrink away
      // with a collapsed sibling. Scaling this margin by the same fraction
      // as the height keeps the two in sync (12px = gap-3) down to a true 0.
      outer.style.marginBottom = `${12 * visible}px`;
      row.style.transform = `translateY(${(1 - visible) * -8}px)`;
    };

    apply();
    const ro = new ResizeObserver(() => {
      rowHeight = row.scrollHeight;
      apply();
    });
    ro.observe(row);
    const unsubscribe = useTopbarVisibilityStore.subscribe((state, prev) => {
      if (state.offset !== prev.offset) apply();
    });
    return () => {
      ro.disconnect();
      unsubscribe();
    };
  }, [hasActive, isMobile]);

  const examTitle = useMemo(
    () => course?.exam?.short_name ?? "",
    [course?.exam?.short_name],
  );

  // Per-exam override (e.g. HPTET → ₹149) from the same source of truth as
  // payment/initiated — see @/lib/payment/examPriceOverrides.
  const monthlyPrice = useMemo(
    () => getPriceForVariant("1month", null, course?.exam?.short_name),
    [course?.exam?.short_name],
  );

  return (
    hasActive && (
      <div className={startGuideActive ? "hidden" : "px-3 md:px-4"}>
        <Card
          padding="12px 16px"
          bgcolor="bg-white"
          borderwidth={2}
          bordercolor="var(--color-brand)"
        >
          <div className="flex w-full flex-col">
            <div ref={priceRowOuterRef} style={{ marginBottom: 12 }} className="overflow-hidden">
              <div ref={priceRowRef} className="flex items-center justify-between gap-2">
                <Text as="h6" variant="heading-large" weight="semibold">
                  {examTitle}
                </Text>
                <Text
                  variant="body-large"
                  weight="normal"
                  className="text-surface-gray-subtle whitespace-nowrap"
                >
                  <Text
                    as="span"
                    variant="heading-large"
                    weight="semibold"
                    className="text-surface-gray-normal"
                  >
                    {`₹${monthlyPrice}`}
                  </Text>
                  /month • All subjects
                </Text>
              </div>
            </div>

            <Button
              onClick={() => {
                handleOpenPaywall(router, "floating_widget_clicked", course);
              }}
              size="md"
              rounded="50px"
              color="primary"
              fullWidth
              rightIcon={
                <ChevronIcon size={20} type="double" variant="right" color="white" />
              }
            >
              {t("myCourses.unlockCourse", { exam: examTitle })}
            </Button>
          </div>
        </Card>
      </div>
    )
  );
}

export const handleOpenPaywall = (
  router: any,
  source: PaywallSource,
  course: ExamEnrollmentWithExam | null | undefined,
) => {
  router.push(
    `/payment/initiated?exam_id=${course?.group_code}&course_name=${encodeURIComponent(
      course?.exam?.short_name || "",
    )}&source=${source}`,
  );
};
