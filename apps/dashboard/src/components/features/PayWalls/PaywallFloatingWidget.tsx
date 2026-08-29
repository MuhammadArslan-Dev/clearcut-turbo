import Button from "@clearcut/ui/button";
import { Card } from "@clearcut/ui/card";
import Text from "@clearcut/ui/text";
import { useGetCurrentCourseStore } from "@/store/course/useGetCurrentCourseStore";
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { PaywallSource, usePaywallsStore } from "./usePaywallsStore";
import { useRouter } from "@/i18n/navigation";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useTopbarVisibilityStore } from "@/store/dashboard/useTopbarVisibilityStore";
import { ExamEnrollmentWithExam } from "@/lib/dashboard/learning";
import { ChevronIcon } from "@/components/ui/icons";
import { getPriceForVariant } from "@/lib/payment/examPriceOverrides";

export default function PaywallFloatingWidget() {
  const { course } = useGetCurrentCourseStore();

  const router = useRouter();
  const isMobile = useIsMobile();
  // Same raw scroll-hide offset Topbar itself reads (not the derived
  // `progress`) — clamped against this row's OWN measured height below,
  // mirroring Topbar's self-contained technique exactly rather than
  // depending on another component having already written a derived value
  // for this render.
  const scrollOffset = useTopbarVisibilityStore((s) => s.offset);

  const priceRowRef = useRef<HTMLDivElement>(null);
  const [priceRowHeight, setPriceRowHeight] = useState<number | null>(null);

  const hasActive = useMemo(
    () => course?.status === "trial" || course?.status === "trial_end",
    [course?.status],
  );

  // `hasActive` is a dependency here, not just `[]`: this
  // component always renders `false` until course status resolves to
  // "trial"/"trial_end", so `priceRowRef` is null on first mount whenever
  // that data hasn't loaded yet — an empty deps array would then never
  // re-run once the ref actually attaches, leaving `priceRowHeight` stuck at
  // null forever and the scroll-hide permanently inert (`visibleFraction`
  // falls back to 1 unconditionally). Observed depending on how fast course
  // data resolves relative to mount on the page this renders from.
  useLayoutEffect(() => {
    const el = priceRowRef.current;
    if (!el) return;

    const measure = () => setPriceRowHeight(el.scrollHeight);
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasActive]);

  const clampedOffset =
    isMobile && priceRowHeight != null
      ? Math.min(scrollOffset, priceRowHeight)
      : 0;
  const visibleFraction = priceRowHeight
    ? 1 - clampedOffset / priceRowHeight
    : 1;

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
      <div className="px-3 md:px-4">
        <Card
          padding="12px 16px"
          bgcolor="bg-white"
          borderwidth={2}
          bordercolor="var(--color-brand)"
        >
          <div className="flex w-full flex-col">
            <div
              style={{
                height:
                  priceRowHeight != null
                    ? priceRowHeight * visibleFraction
                    : "auto",
                opacity: priceRowHeight != null ? visibleFraction : 1,
                // Was a flex `gap-3` on the parent, but a gap doesn't shrink
                // away with a collapsed sibling — it still held a fixed 12px
                // gap above the button even at height 0. Scaling this margin
                // by the same fraction as the height keeps the two in sync
                // (12px = Tailwind's gap-3) all the way down to a true 0.
                marginBottom: 12 * visibleFraction,
              }}
              className="overflow-hidden"
            >
              <div
                ref={priceRowRef}
                style={{
                  transform: `translateY(${(1 - visibleFraction) * -8}px)`,
                }}
                className="flex items-center justify-between gap-2"
              >
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
              Unlock {examTitle} course
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
