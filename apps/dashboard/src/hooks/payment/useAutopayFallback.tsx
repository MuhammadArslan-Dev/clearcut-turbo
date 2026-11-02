"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import AutopayFallbackSheet from "@/components/features/payment/AutopayFallbackSheet";
import { useRazorpayPayment } from "@/hooks/payment/useRazorpayPayment";
import { useRouter } from "@/i18n/navigation";
import { trackEvent } from "@/lib/analytics/browser";
import { inAppBrowserKind } from "@/lib/analytics/paymentFunnel";
import {
  AUTOPAY_FALLBACK_SOURCE,
  clearAutopayAttempt,
  getAutopayFallbackArm,
  getSubscriptionStatus,
  PENDING_TIMEOUT_MS,
  readAutopayAttempt,
  type AutopayFallbackArm,
  type AutopayFallbackTrigger,
} from "@/lib/payment/autopayFallback";
import { getPriceForVariant } from "@/lib/payment/examPriceOverrides";
import { useAuth } from "@/providers/AuthProvider";

const ONE_TIME_PLAN = "1month-onetime" as const;

/**
 * CC-168: everything both payment pages share about the one-time fallback.
 * `offer(trigger)` is called when an autopay attempt didn't go through; the
 * hook also watches for a student coming back from the UPI app with the mandate
 * still unapproved. Treatment sees the sheet, holdout only gets counted, and
 * with the flag off nothing happens at all. One offer per page visit.
 */
export function useAutopayFallback({
  courseId,
  exam,
  price,
  /** The page already runs a one-time return check through its own payment hook. */
  returnCheck = true,
  /** Already on the failed page: a failed try stays in the sheet, which can try again. */
  stayOnFailure = false,
}: {
  courseId: string;
  exam?: { id?: number; short_name?: string };
  price: number;
  returnCheck?: boolean;
  stayOnFailure?: boolean;
}) {
  const t = useTranslations("payment.checkout");
  const router = useRouter();
  const locale = useLocale();
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [arm, setArm] = useState<AutopayFallbackArm | null>(null);
  const armRef = useRef<Promise<AutopayFallbackArm | null> | null>(null);
  const offeredRef = useRef(false);

  const uuid = user?.uuid;
  useEffect(() => {
    if (!uuid) return;
    let active = true;
    armRef.current = getAutopayFallbackArm(uuid);
    void armRef.current.then((value) => {
      if (active) setArm(value);
    });
    return () => {
      active = false;
    };
  }, [uuid]);

  const eventProps = useCallback(
    (trigger?: AutopayFallbackTrigger) => ({
      trigger,
      exam: exam?.short_name,
      price,
      language: locale,
      in_app_browser: inAppBrowserKind(),
    }),
    [exam?.short_name, price, locale],
  );
  const triggerRef = useRef<AutopayFallbackTrigger | undefined>(undefined);

  const offer = useCallback(
    async (trigger: AutopayFallbackTrigger) => {
      if (offeredRef.current) return;
      const value = await (armRef.current ?? Promise.resolve(null));
      if (!value || offeredRef.current) return;
      offeredRef.current = true;
      triggerRef.current = trigger;
      clearAutopayAttempt();
      trackEvent("Autopay Fallback Shown", { ...eventProps(trigger), arm: value, displayed: value === "on" });
      if (value === "on") setOpen(true);
    },
    [eventProps],
  );

  // Back from the UPI app, or the page opened again after it died there.
  useEffect(() => {
    if (!arm || !courseId) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = async () => {
      const attempt = readAutopayAttempt(courseId);
      if (!attempt || document.visibilityState === "hidden") return;
      try {
        const status = await getSubscriptionStatus(attempt.subscriptionId);
        if (status === "created") void offer("pending_timeout");
        else clearAutopayAttempt();
      } catch {
        // Offline or a blip: the next return tries again.
      }
    };
    const schedule = (delay: number) => {
      clearTimeout(timer);
      timer = setTimeout(() => void check(), delay);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") clearTimeout(timer);
      else if (readAutopayAttempt(courseId)) schedule(PENDING_TIMEOUT_MS);
    };

    // Opened again: a mandate approved a moment ago may not be reported yet.
    if (readAutopayAttempt(courseId)) schedule(PENDING_TIMEOUT_MS);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [arm, courseId, offer]);

  const successUrl = `/payment/success?exam_id=${courseId}&course_name=${exam?.short_name}&source=${AUTOPAY_FALLBACK_SOURCE}&price=${price}`;

  const { handlePayment, loading, phase } = useRazorpayPayment({
    examId: exam?.id as number,
    examName: exam?.short_name as string,
    price,
    type: ONE_TIME_PLAN,
    orderSource: AUTOPAY_FALLBACK_SOURCE,
    returnCheck,
    onClose: () => {},
    onSuccess: () => {
      setLeaving(true);
      router.push(successUrl);
    },
    onPending: () => {
      setLeaving(true);
      router.push(`${successUrl}&pending=1`);
    },
    onFailure: () => {
      if (stayOnFailure) {
        setError(t("errorGeneric"));
        return;
      }
      setLeaving(true);
      router.push(
        `/payment/failed?exam_id=${courseId}&course_name=${exam?.short_name}&plan=${ONE_TIME_PLAN}&price=${price}`,
      );
    },
    // The mandate was approved after all: that purchase is the real one.
    onAutopayActive: () => {
      setLeaving(true);
      const autopayPrice = getPriceForVariant("1month", null, exam?.short_name);
      router.push(
        `/payment/success?exam_id=${courseId}&course_name=${exam?.short_name}&source=${AUTOPAY_FALLBACK_SOURCE}&price=${autopayPrice}&pending=1`,
      );
    },
    onError: (reason) => setError(t(reason === "sdk_failed" ? "errorSdk" : "errorGeneric")),
    returnParams: {
      exam_id: courseId,
      course_name: exam?.short_name,
      price,
      source: AUTOPAY_FALLBACK_SOURCE,
      plan: ONE_TIME_PLAN,
    },
  });

  const pay = () => {
    setError(null);
    trackEvent("Autopay Fallback Tapped", { ...eventProps(triggerRef.current), arm: "on" });
    void handlePayment();
  };

  const statusText =
    phase === "activating" ? t("activating") : phase === "verifying" ? t("confirming") : t("opening");

  return {
    offer,
    arm,
    sheet: (
      <AutopayFallbackSheet
        isOpen={open}
        price={price}
        busy={loading || leaving}
        statusText={leaving ? t("processing") : statusText}
        error={error}
        onPay={pay}
        onClose={() => {
          trackEvent("Autopay Fallback Dismissed", { ...eventProps(triggerRef.current), arm: "on" });
          setOpen(false);
        }}
      />
    ),
  };
}
