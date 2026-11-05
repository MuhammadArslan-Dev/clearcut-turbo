"use client";
import React, { useMemo, useCallback, useEffect, useState } from "react";
import { useCourseStore } from "@/store/course/useCourseStore";
import { ArrowIcon, CheckIcon, FireIcon } from "@/components/ui/icons";
import ShimmerButton from "@/components/ui/button/shimmer-button";
import { useLocale, useTranslations } from "next-intl";
import { useMyActiveCourses } from "@/hooks/course/useMyActiveCourses";
import { useQueryClient } from "@tanstack/react-query";
import { trackEvent } from "@/lib/analytics/browser";
import { useLevels } from "@/hooks/onboarding/useLevels";
import { parseTranslation } from "@/utils/text/translation";
import { LevelTranslation } from "@/lib/api/onboarding";
import { Skeleton } from "@/components/ui/skeleton";
import StatusChip from "@/components/ui/cards/preparation/chapter-list/StatusChip";
import { useDrawerBackHandler } from "@/hooks/Global/useDrawerBackHandler";
import { useRouter } from "@/i18n/navigation";
import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";
import Text from "@clearcut/ui/text";
import { clearAttempt, getAttemptStatus } from "@/lib/payment/paymentAttempt";
import { trackFacebookEventOnce } from "@/lib/analytics/facebook-pixel";
import { supportWhatsAppUrl } from "@/lib/support";
import { invalidateAfterPayment } from "@/lib/payment/invalidateAfterPayment";

const FEATURES = ["featureVideos", "featureNotes", "featureTests"] as const;

export default function Success() {
  const modalT = useTranslations("payment");
  const { activeCourse, allCourses } = useMyActiveCourses();
  const open = useCourseStore((s) => s.open);
  const locale = useLocale(); // "en", "hi", etc.
  useDrawerBackHandler();
  const router = useRouter();

  const { get, set } = useQueryParams();

  const courseId = get("exam_id") as string;
  const courseName = get("course_name") as string;
  const source = get("source") as string;
  const price = get("price") as string;
  // Paid, but the webhook hadn't activated the course yet (CC-60).
  const pendingParam = get("pending") === "1";

  useEffect(() => {
    if (!courseId) {
      router.push("/dashboard");
    }
  }, [courseId, router]);

  // Razorpay redirect mode (Facebook/Instagram app, CC-59) lands here from
  // the backend with `tx`; the in-page handler that sends Meta's Purchase
  // never ran, so send it here (same event id, so never twice).
  const returnedTx = Number(get("tx"));
  useEffect(() => {
    if (!returnedTx) return;
    clearAttempt();
    getAttemptStatus(returnedTx)
      .then((status) => {
        const meta = status.state === "paid" ? status.meta_purchase : undefined;
        if (!meta?.send) return;
        trackFacebookEventOnce(
          "Purchase",
          {
            value: meta.value,
            currency: meta.currency,
            amount_paid: meta.amount_paid,
            ...(meta.plan ? { plan: meta.plan } : {}),
          },
          meta.event_id,
        );
      })
      .catch(() => {});
  }, [returnedTx]);

  const course = allCourses?.find((c) => c?.group_code === courseId);
  const data = course?.exam;
  // Phase 77: the pending state ends the moment the course is really active, and never earlier.
  const activationPending = pendingParam && course?.status !== "active";
  const {
    levels: levelsRaw = [],
    loading: levelsLoading,
    error,
  } = useLevels(data?.id);

  /* ---------------------------------- derived values ---------------------------------- */

  const rootLevels = useMemo(
    () => levelsRaw?.filter((item) => item.parent_id === null) ?? [],
    [levelsRaw],
  );

  const papers = useMemo(() => {
    return rootLevels.map((item) => {
      const translation = parseTranslation<LevelTranslation>(item.translation);
      const t = translation?.[locale];

      return {
        id: item.id,
        name: t?.name ?? item.name,
        group: t?.group ?? item.group,
        detail: t?.detail ?? "",
        slug: item.slug,
      };
    });
  }, [rootLevels, locale]);
  

  const examTitle = useMemo(
    () => `${data?.short_name ?? ""} Exam`,
    [data?.short_name],
  );

  /* ---------------------------------- handlers ---------------------------------- */
  const queryClient = useQueryClient();

  // Phase 77: while the payment is received but access is not active yet, keep asking the server
  // (every 5 s, for up to 2 minutes). After that, stop and show the support route instead of a dead end.
  const [stillWaiting, setStillWaiting] = useState(false);
  useEffect(() => {
    if (!activationPending) {
      setStillWaiting(false);
      return;
    }
    const started = Date.now();
    const timer = setInterval(() => {
      if (Date.now() - started > 120_000) {
        clearInterval(timer);
        setStillWaiting(true);
        return;
      }
      void invalidateAfterPayment(queryClient);
    }, 5_000);
    return () => clearInterval(timer);
  }, [activationPending, queryClient]);

  const handleResume = useCallback(async () => {
    // Phase 77: Resume is about the course that was just paid for. It used to read the student's
    // globally "active" course (a different course, or null, in which case the button did nothing).
    const target = course ?? activeCourse;
    if (!target) {
      router.push("/dashboard");
      return;
    }
    // Paid but not yet activated: fetch the course status again so the next
    // screen sees the activation the moment it lands (CC-60).
    if (activationPending) {
      await invalidateAfterPayment(queryClient);
    }
    if (target.stage_id) {
      await trackEvent("Content Started", {
        source: "payment_success_modal",
        exam_name: target.exam?.short_name ?? "",
      });

      router.push(`/preparation/${target.group_code}`);
    } else if (target.exam) {
      open("single", target.exam);
    } else {
      router.push("/dashboard");
    }
  }, [course, activeCourse, open, activationPending, queryClient, router]);

  const Price = useMemo(
    () => JSON.parse(data?.price ?? "{}") ?? 0,
    [data?.price],
  );
  const comboPrice = useMemo(
    () => JSON.parse(data?.combo_price ?? "{}") ?? 0,
    [data?.combo_price],
  );

  /* ---------------------------------- render ---------------------------------- */
  return (
    <div className="bg-[#f1f5fa] min-h-dvh w-full flex justify-center items-center sm:px-4">
      <div className="w-full sm:h-auto h-dvh sm:max-w-[600px]  flex flex-col justify-between items-center gap-4">
        <div className="h-full flex flex-col min-h-[60dvh] justify-between md:gap-2">
          {/* Header */}
          <div className="sticky w-full top-0 z-10 flex gap-4 px-3 py-4 bg-white">
            <button
              type="button"
              onClick={() => router.back()}
              className="cursor-pointer sm:hidden"
              aria-label="Go back"
            >
              <ArrowIcon />
            </button>

            <div className="w-full">
              <div className="heading-medium sm:text-center !font-semibold text-surface-gray-normal">
                {modalT("paymentSuccess.officialPrep", {
                  exam: examTitle,
                })}
              </div>
              <div className="body-small sm:text-center !font-normal text-surface-gray-muted">
                {modalT("paymentSuccess.startPrep", {
                  exam: examTitle,
                })}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="w-full sm:bg-white flex justify-center px-4">
            <div className="max-w-[352px] w-full flex flex-col gap-5 bg-white p-4 rounded-lg">
              <div className="flex flex-col gap-8">
                <div className="flex flex-col items-center gap-4">
                  <CheckIcon size={48} color="var(--color-success)" />

                  <div className="text-center">
                    <div className="heading-large !font-semibold text-surface-gray-normal">
                      {activationPending
                        ? modalT("checkout.receivedTitle")
                        : modalT("paymentSuccess.unlockedTitle", {
                            exam: examTitle,
                          })}
                    </div>
                    {!activationPending && (
                      <p className="body-small text-surface-gray-muted">
                        {modalT("paymentSuccess.featuresAvailable")}
                      </p>
                    )}
                    <div className="mt-2">
                      {levelsLoading ? (
                        <Skeleton className="h-6 rounded-full" />
                      ) : papers.length > 0 ? (
                        <StatusChip
                          className="!text-brand !bg-brand/9 !body-medium !font-semibold"
                          label={papers.map((item) => item.name).join(" + ")}
                        />
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center item-center">
                  <div className="w-[150px] bg-[#f1f5fa] h-7 rounded-md flex gap-1 items-center justify-center">
                    <div className="flex">
                      <Text as="p" variant="heading-medium" weight="semibold">
                        ₹
                      </Text>
                      <Text as="h5" variant="heading-medium" weight="semibold">
                        {price}
                      </Text>
                    </div>
                    <Text
                      as="h5"
                      variant="body-small"
                      className="text-surface-gray-muted"
                    >
                      (incl. GST)
                    </Text>
                  </div>
                </div>

                {activationPending && (
                  <div className="flex flex-col items-center gap-3 px-4" role="status" aria-live="polite">
                    <p className="body-medium text-center text-surface-gray-muted">
                      {stillWaiting ? modalT("checkout.stillActivating") : modalT("checkout.activatingNote")}
                    </p>
                    {stillWaiting && (
                      <a
                        href={supportWhatsAppUrl(modalT("checkout.supportMessage", { exam: data?.short_name ?? "" }))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="body-medium !font-semibold text-brand underline underline-offset-2"
                      >
                        {modalT("checkout.contactSupport")}
                      </a>
                    )}
                  </div>
                )}

                <div className="flex justify-center">
                  <div className="flex flex-col gap-2 items-start">
                    {FEATURES.map((key) => (
                      <div key={key} className="flex items-center gap-2">
                        <CheckIcon color="var(--color-success)" />
                        <div className="text-surface-gray-muted body-medium flex-1">
                          {modalT(`paymentSuccess.${key}`)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 w-full z-10 px-3 py-2 bg-white">
            <div className="w-full flex flex-col items-center gap-4">
              <div className="w-full flex flex-col items-center gap-1">
                <div className="w-full max-w-[400px]">
                  <ShimmerButton
                    onClick={handleResume}
                    size="lg"
                    iconPosition="right"
                    text={modalT("paymentSuccess.resume", {
                      exam: examTitle,
                    })}
                  />
                </div>

                <div className="flex body-small items-center gap-2 text-surface-gray-muted">
                  <div className="flex items-center gap-2">
                    <FireIcon size={20} variant="outline" color="gray-muted" />
                    <p>
                      {modalT("paymentSuccess.followUpStudents", {
                        exam: examTitle,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
