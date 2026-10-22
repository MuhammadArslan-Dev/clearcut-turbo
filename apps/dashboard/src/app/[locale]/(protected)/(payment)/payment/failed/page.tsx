"use client";
import React, { useMemo, useCallback, useEffect } from "react";

import { useCourseStore } from "@/store/course/useCourseStore";
import {
  AlertCircleIcon,
  ArrowIcon,
  ClockIcon,
  LockIcon,
} from "@/components/ui/icons";
import ShimmerButton from "@/components/ui/button/shimmer-button";
import { TrophyIcon } from "lucide-react";
import { highlightTextUtil } from "@/utils/text/highlightTextUtil";
import { Button } from "@clearcut/ui/button";
import { useTranslations } from "next-intl";
import { useRazorpayPayment } from "@/hooks/payment/useRazorpayPayment";
import { useModalStore } from "@/store/modal/useModalStore";
import { useDrawerBackHandler } from "@/hooks/Global/useDrawerBackHandler";
import { handleOpenPaywall } from "@/components/features/PayWalls/PaywallFloatingWidget";
import { useRouter } from "@/i18n/navigation";
import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";
import { useMyActiveCourses } from "@/hooks/course/useMyActiveCourses";
import { useAuth } from "@/providers/AuthProvider";
import { supportWhatsAppUrl } from "@/lib/support";
import { trackEvent } from "@/lib/analytics/browser";

export default function FailedPage() {
  const { isOpen, close, mode, open: openCourseModal } = useCourseStore();
  const router = useRouter();
  const openGlobalModal = useModalStore((state) => state.open);
  const modalT = useTranslations("payment");
  useDrawerBackHandler();

  const { get, set } = useQueryParams();

  const courseId = get("exam_id") as string;
  const courseName = get("course_name") as string;
  const source = get("source") as string;
  // The plan that failed (sent by /payment/initiated since CC-64): "Try
  // again" reopens that same plan instead of the default one.
  const plan = get("plan") as string | undefined;
  const failedAutopay = plan === "1month";
  const { user } = useAuth();

  useEffect(() => {
    if (!courseId) {
      router.push("/dashboard");
    }
  }, [courseId, router]);

  const { allCourses = [] } = useMyActiveCourses();

  const course = allCourses?.find((c) => c?.group_code === courseId);
  const data = course?.exam;

  /* ---------------------------------- derived values ---------------------------------- */
  const examTitle = useMemo(
    () => `${data?.short_name ?? ""} Exam`,
    [data?.short_name],
  );

  // The amount the student tried to pay (sent by /payment/initiated). The
  // exam's own `price` is a JSON string, so Number() of it showed "NaN".
  const price = useMemo(() => {
    const n = Number(get("price"));
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [get]);

  /* ---------------------------------- handlers ---------------------------------- */
  const handleBack = useCallback(() => {
    openCourseModal("payment-failed-warning", data!);
  }, [openCourseModal, data]);

  const retryUrl = useCallback(
    (retryPlan?: string) =>
      `/payment/initiated?exam_id=${courseId}&course_name=${encodeURIComponent(
        courseName || data?.short_name || "",
      )}&source=payment_failed_retry_clicked${retryPlan ? `&plan=${retryPlan}` : ""}`,
    [courseId, courseName, data?.short_name],
  );

  const handleRetryPayment = useCallback(() => {
    if (!plan) {
      if (!course) return;
      handleOpenPaywall(router, "payment_failed_retry_clicked", course);
      return;
    }
    router.push(retryUrl(plan));
  }, [router, course, plan, retryUrl]);

  // Autopay (UPI mandate) failures are often the mandate step itself; a
  // one-time payment skips it (CC-64).
  const handlePayOnce = useCallback(() => {
    router.push(retryUrl("1month-onetime"));
  }, [router, retryUrl]);

  const handleNeedHelp = useCallback(() => {
    close();
    trackEvent("Support Contacted", { source: "payment_failed", channel: "whatsapp" });
    window.open(
      supportWhatsAppUrl(
        modalT("whatsappMessage", { exam: examTitle, phone: user?.phone ?? "" }),
      ),
      "_blank",
      "noopener",
    );
  }, [close, modalT, examTitle, user?.phone]);

  return (
    <div className="bg-[#f1f5fa] min-h-screen w-full flex justify-center items-center sm:px-4">
      <div className="w-full sm:h-auto h-screen sm:max-w-[600px]  flex flex-col justify-between items-center gap-4">
        {" "}
        {/* Header */}
        <div className="w-full flex gap-4 px-3 py-4 bg-white">
          <button
            type="button"
            onClick={handleBack}
            className="cursor-pointer sm:hidden"
            aria-label="Go back"
          >
            <ArrowIcon />
          </button>

          <div className="w-full">
            <div className="heading-medium sm:text-center !font-semibold text-surface-gray-normal">
              {modalT("almostThere")}
            </div>
            <div className="body-small sm:text-center !font-normal text-surface-gray-muted">
              {modalT("dontMiss", { exam: examTitle })}
            </div>
          </div>
        </div>
        {/* Content */}
        <div className="w-full flex flex-col px-3 sm:py-4 items-center justify-center gap-4 sm:bg-white ">
          <div className="max-w-[352px] w-full flex flex-col gap-5 bg-white p-4 rounded-lg border border-[#D92D20]">
            <div className="flex flex-col gap-8">
              <div className="flex flex-col items-center gap-4">
                <AlertCircleIcon size={48} />

                <div className="text-center">
                  <div className="heading-large !font-semibold text-surface-gray-normal">
                    {modalT("notCompletedTitle")}
                  </div>
                  <p className="body-small text-surface-gray-muted">
                    {modalT("notCompletedDesc")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-[352px] w-full flex flex-col gap-5 bg-white p-4 rounded-lg border border-gray-300">
            <div className="p-3 flex flex-col items-center bg-[var(--background-gray-subtle)] rounded-md gap-1">
              {price !== null && (
                <div className="body-small text-surface-gray-muted flex items-center gap-1">
                  {highlightTextUtil(
                    modalT("priceNote", { amount: `₹${price}` }),
                    `₹${price}`,
                    "heading-xlarge !font-semibold text-surface-gray-normal",
                  )}
                </div>
              )}

              <div className="body-small text-surface-gray-subtle flex items-center gap-2">
                <div className="w-8 h-8">
                  <TrophyIcon
                    size={20}
                    color="var(--color-surface-gray-subtle)"
                  />
                </div>

                <div className="body-small text-surface-gray-subtle">
                  <span>
                    {highlightTextUtil(
                      modalT("benefits.watched", { count: 1 }),
                      [
                        modalT("benefits.watchedHighlight", {
                          count: 1,
                        }),
                      ],
                      "body-small !font-semibold text-surface-gray-subtle",
                    )}
                  </span>{" "}
                  <span>
                    {modalT("benefits.consistency", {
                      exam: examTitle,
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <div className="w-5 h-5">
                  <ClockIcon
                    variant="alrem-clock"
                    size={20}
                    color="var(--color-surface-gray-subtle)"
                  />
                </div>
                <p className="body-small text-surface-gray-subtle">
                  {modalT("benefits.urgency", { exam: examTitle })}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="sticky bottom-0 z-10 w-full px-3 py-2 bg-white">
          <div className="w-full flex flex-col items-center gap-4">
            <div className="w-full flex flex-col items-center gap-1">
              <div className="w-full max-w-[400px]">
                <ShimmerButton
                  onClick={handleRetryPayment}
                  size="lg"
                  // loading={loading}
                  iconPosition="right"
                  icon={
                    <LockIcon variant="without-key" size={16} color="white" />
                  }
                  text={plan ? modalT("tryAgain") : modalT("completePayment", {
                    exam: examTitle,
                  })}
                />
              </div>

              {failedAutopay && (
                <div className="w-full max-w-[400px]">
                  <Button
                    onClick={handlePayOnce}
                    fullWidth
                    size="md"
                    sx={{ borderRadius: "50px" }}
                    variant="outlined"
                  >
                    {modalT("payOnceInstead")}
                  </Button>
                </div>
              )}

              <div className="flex body-small items-center gap-2 text-surface-gray-muted">
                <div className="flex items-center gap-2">
                  <AlertCircleIcon
                    size={16}
                    color="var(--color-surface-gray-muted)"
                  />
                  <p>
                    {modalT("benefits.consistency", {
                      exam: examTitle,
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full max-w-[400px]">
              <Button
                onClick={handleNeedHelp}
                fullWidth
                size="sm"
                sx={{ borderRadius: "50px" }}
                color="gray"
                variant="soft"
              >
                <div className="flex items-center gap-2">
                  <span>{modalT("whatsappHelp")}</span>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
