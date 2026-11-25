"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Modal } from "@/components/features/Sheets/Modal";
import { BottomSheet } from "@/components/features/Sheets/BottomSheet";
import { Button } from "@clearcut/ui/button";
import ShimmerButton from "@/components/ui/button/shimmer-button";
import {
  ArrowIcon,
  CheckIcon,
  CrossIcon,
  LockIcon,
} from "@/components/ui/icons";
import { useDrawerBackHandler } from "@/hooks/Global/useDrawerBackHandler";
import { usePaywallsStore } from "./usePaywallsStore";
import { handleOpenPaywall } from "./PaywallFloatingWidget";
import { useRouter } from "@/i18n/navigation";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { trackEvent } from "@/lib/analytics/browser";
import { getPriceForVariant } from "@/lib/payment/examPriceOverrides";
import { useFreeCredits } from "@/components/features/free-credits/useFreeCredits";
import { gapMarks, lockCopyVariant } from "@/lib/freeCredits/lockCopy";
import { meterGapFromCache } from "@/lib/freeCredits/meterGap";
import { usePaywallRenderedTracking } from "./usePaywallRenderedTracking";

/**
 * Interstitial shown before a locked chapter/topic/test card sends the user
 * to `/payment/initiated` — same open/close/back-handler wiring as
 * MainPaywall/PreparationPaywall (usePaywallsStore + Modal/BottomSheet
 * Container + useDrawerBackHandler), just simpler content. One component
 * covers both variants (mode drives copy + icon set) instead of duplicating
 * the file per variant.
 */
export default function LockedContentModal() {
  const { isOpen, mode, close, source, course, meta } = usePaywallsStore();
  const isMobile = useIsMobile();
  const router = useRouter();
  const queryClient = useQueryClient();
  useDrawerBackHandler();

  // CC-196 free test credits. A locked test card opens "test-locked-modal"; for a user in the
  // credit treatment whose credits are used up it becomes the credits lock screen (no
  // "Continue Free"). A refused start (403 free_credits_exhausted) opens it directly.
  const examShort = course?.exam?.short_name;
  const { credits } = useFreeCredits(examShort, { skip: !isOpen || course?.status === "active" });
  const isCredits =
    isOpen &&
    (mode === "credits-locked-modal" ||
      (mode === "test-locked-modal" &&
        credits.active &&
        (credits.locked || (credits.limit > 0 && credits.remaining === 0))));
  const fcT = useTranslations("freeCredits");
  const navigatingRef = useRef(false);

  const lockGap = isCredits
    ? meta?.lock
      ? meta.lock.meterGap
      : meterGapFromCache(queryClient, course?.group_code)
    : null;
  const creditsUsed = meta?.lock?.creditsUsed ?? (credits.active ? credits.used : null);
  const creditsLimit = meta?.lock?.creditsLimit ?? (credits.active ? credits.limit : null);
  const lockVariant = lockCopyVariant(lockGap);
  const testType = meta?.testType ?? meta?.lock?.testType ?? "unknown";

  // The existing "Payment Paywall Rendered", once per open (it was never sent before CC-196).
  usePaywallRenderedTracking(
    isOpen &&
      (mode === "topic-locked-modal" ||
        mode === "test-locked-modal" ||
        mode === "daily-test-locked-modal" ||
        mode === "daily-tests-locked-modal" ||
        mode === "credits-locked-modal"),
    isCredits ? "credits_locked" : (source ?? mode),
    course?.status === "active",
    examShort,
  );

  // New event "Test Locked", once per open of the credits lock screen.
  const lockedFiredRef = useRef(false);
  useEffect(() => {
    if (!isCredits) {
      lockedFiredRef.current = false;
      navigatingRef.current = false;
      return;
    }
    if (lockedFiredRef.current) return;
    lockedFiredRef.current = true;
    trackEvent("Test Locked", {
      exam: examShort,
      test_type: testType,
      credits_used: creditsUsed,
      source: meta?.surface ?? "test_card",
      gap: lockGap,
      ...(credits.variant ? { free_credits_variant: credits.variant } : {}),
    });
    // Read once, at the moment the lock screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCredits]);

  const openCheckout = (plan: "1month-onetime" | "1month") => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    handleOpenPaywall(router, "cutoff_meter", course, {
      plan,
      test_type: testType,
      credits_used: creditsUsed,
      free_credits_variant: credits.variant,
    });
  };

  // "daily-test-locked-modal" = result page (no illustration);
  // "daily-tests-locked-modal" = Daily Tests list page (with illustration).
  const isDailyResult = mode === "daily-test-locked-modal";
  const isDailyList = mode === "daily-tests-locked-modal";
  const isDaily = isDailyResult || isDailyList;
  const isTest = mode === "test-locked-modal" || mode === "credits-locked-modal" || isDaily;
  const modalT = useTranslations(
    isCredits
      ? "modals.testLockedModal"
      : isDailyResult
      ? "modals.dailyTestLockedModal"
      : isDailyList
        ? "modals.dailyTestsLockedModal"
        : isTest
        ? "modals.testLockedModal"
        : "modals.topicLockedModal",
  );

  const Container = useMemo(() => (isMobile ? BottomSheet : Modal), [isMobile]);

  const examTitle = course?.exam?.short_name ?? "";

  const features = isDailyList
    ? [
        modalT("features.allTests"),
        modalT("features.solutions"),
        modalT("features.subjectAnalysis"),
        modalT("features.trackProgress"),
      ]
    : isDailyResult
    ? [
        modalT("features.questionReview"),
        modalT("features.explanations"),
        modalT("features.analysis"),
        modalT("features.trackImprovement"),
      ]
    : isTest
    ? [
        modalT("features.attemptTest"),
        modalT("features.detailedSolutions"),
        modalT("features.compareRank"),
        modalT("features.improveClear", { exam: examTitle }),
      ]
    : [
        modalT("features.accessTopic"),
        modalT("features.practiceTests"),
        modalT("features.trackProgress"),
        modalT("features.boostScore"),
      ];

  return (
    <AnimatePresence>
      {isOpen &&
        (mode === "topic-locked-modal" ||
          mode === "test-locked-modal" ||
          mode === "daily-test-locked-modal" ||
          mode === "daily-tests-locked-modal" ||
          mode === "credits-locked-modal") && (
          <Container
            maxWidth="max-w-[420px] !rounded-t-lg"
            isHeader={false}
            maxHeight="max-h-[95dvh]"
            isOpen
            onClose={close}
          >
            <div className="bg-white flex flex-col gap-3 p-5">
              {/* Close */}
              <div className="relative z-10 flex justify-end">
                <button
                  type="button"
                  onClick={close}
                  className="cursor-pointer p-2 -m-2"
                  aria-label="Close"
                >
                  <CrossIcon />
                </button>
              </div>

              {/* Lock icon + title */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4">
                
                  <DotLottieReact
                    src="https://lottie.host/a5ed70b4-cf37-4dd6-9017-f8bb2308cef1/3gFWeilvP5.lottie"
                    loop
                    autoplay
                  />
                </div>
                <div className="heading-large !font-semibold text-surface-gray-normal text-center">
                  {isCredits ? fcT("lock.title", { limit: creditsLimit ?? 0 }) : modalT("title")}
                </div>
                <div
                  className="body-medium text-surface-gray-muted text-center"
                  data-testid={isCredits ? "free-credits-lock-subtitle" : undefined}
                >
                  {isCredits
                    ? fcT(
                        lockVariant === "gap"
                          ? "lock.subtitleGap"
                          : lockVariant === "above"
                            ? "lock.subtitleAbove"
                            : "lock.subtitleNone",
                        {
                          gap: lockGap != null && lockGap > 0 ? gapMarks(lockGap) : 0,
                          exam: examTitle,
                          price: getPriceForVariant("1month-onetime", null, examShort),
                        },
                      )
                    : modalT("subtitle")}
                </div>
              </div>

              {/* Illustration — not shown for the daily-test result modal */}
              {!isDaily && (
              <div className="flex items-center justify-center py-2">
                <Image
                  src={
                    isTest
                      ? "/images/test-locked-illustration.png"
                      : "/images/topic-locked-illustration.png"
                  }
                  alt={modalT("title")}
                  width={isTest ? 545 : 550}
                  height={260}
                  className="w-full max-w-[362px] h-auto"
                  priority
                />
              </div>
              )}

              {/* Unlock and get */}
              <div className="flex items-center justify-center">
                <div className="bg-[var(--background-gray-subtle)] rounded-md py-4 px-8 flex flex-col gap-3 w-fit items-center">
                  <div className="heading-small !font-semibold text-surface-gray-normal">
                    {modalT("unlockAndGet")}
                  </div>
                  <div className="flex flex-col gap-2">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckIcon size={18} />
                        <span className="body-medium text-surface-gray-normal">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CTA */}
              {isCredits ? (
              <div className="flex flex-col gap-2">
                <ShimmerButton
                  onClick={() => openCheckout("1month-onetime")}
                  size="lg"
                  iconPosition="right"
                  icon={<LockIcon variant="without-key" size={16} color="white" />}
                  text={fcT("lock.cta", { price: getPriceForVariant("1month-onetime", null, examShort) })}
                />
                {/* Autopay is the secondary option; the checkout page lists both plans. */}
                <Button
                  onClick={() => openCheckout("1month")}
                  fullWidth
                  size="sm"
                  sx={{ borderRadius: "50px" }}
                  color="gray"
                  variant="soft"
                >
                  {fcT("lock.autopay", { price: getPriceForVariant("1month", null, examShort) })}
                </Button>
                {/* Locked users still have today's daily test. No "Continue Free" here. */}
                {credits.dailyFreeAvailableToday && course?.uuid && (
                  <Button
                    onClick={() => {
                      close();
                      router.push(`/daily-tests/${course.uuid}`);
                    }}
                    fullWidth
                    size="sm"
                    sx={{ borderRadius: "50px" }}
                    color="gray"
                    variant="plain"
                  >
                    {fcT("lock.dailyTest")}
                  </Button>
                )}
              </div>
              ) : (
              <div className="flex flex-col gap-2">
                <ShimmerButton
                  onClick={() =>
                    handleOpenPaywall(
                      router,
                      source ??
                        (isDailyResult
                          ? "daily_test_result_clicked"
                          : isDailyList
                            ? "daily_tests_page_clicked"
                            : "topic_card_clicked"),
                      course,
                    )
                  }
                  size="lg"
                  iconPosition="right"
                  icon={
                    <LockIcon variant="without-key" size={16} color="white" />
                  }
                  text={modalT("cta")}
                />
                <Button
                  onClick={close}
                  fullWidth
                  size="sm"
                  sx={{ borderRadius: "50px" }}
                  color="gray"
                  variant="soft"
                >
                  <div className="flex items-center gap-2">
                    <ArrowIcon />
                    <span>{modalT("continueFree")}</span>
                  </div>
                </Button>
              </div>
              )}
            </div>
          </Container>
        )}
    </AnimatePresence>
  );
}
