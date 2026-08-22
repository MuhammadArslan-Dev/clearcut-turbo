"use client";
import { FALLBACK_IMAGE } from "@/components/features/PayWalls/MainPaywall";
import { MainLoader } from "@/components/FullScreenLoader";
import ShimmerButton from "@/components/ui/button/shimmer-button";
import { Card } from "@clearcut/ui/card";
import StatusChip from "@/components/ui/cards/preparation/chapter-list/StatusChip";
import {
  ArrowIcon,
  CheckIcon,
  LockIcon,
  PaymentCardIcon,
  SheildIcon,
} from "@/components/ui/icons";
import StarIcon from "@/components/ui/icons/star-icon";
import { Skeleton } from "@/components/ui/skeleton";
import Text from "@clearcut/ui/text";
import { useMyActiveCourses } from "@/hooks/course/useMyActiveCourses";
import { useLevels } from "@/hooks/onboarding/useLevels";
import { useRazorpayPayment } from "@/hooks/payment/useRazorpayPayment";
import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";
import { trackEvent } from "@/lib/analytics/browser";
import { trackFacebookEvent } from "@/lib/analytics/facebook-pixel";
import { webhookPaymentInitiate } from "@/lib/api/auth";
import { sentryApiClient } from "@/lib/sentry/sentry-api-client";
import { logger } from "@/lib/sentry/sentry-logger";
import { isApiError } from "@/lib/api/api-error";
import { LevelTranslation } from "@/lib/api/onboarding";
import { createSubscription, getPaymentPricing, PaymentPricing, PaymentType } from "@/lib/payment/payment";
import { getPriceForVariant, getSubscriptionPlanId } from "@/lib/payment/examPriceOverrides";
import { loadRazorpay } from "@/lib/loadRazorpay";
import { parseTranslation } from "@/utils/text/translation";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@clearcut/ui/button";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "@/i18n/navigation";
import React, { useCallback, useEffect, useMemo } from "react";

const PRICE_CARD_ROUNDING = 12;

// const ALLOWED_PHONES = ["9988776655", "7210708599"];

// Same pixel ID FacebookPixel.tsx already initialized (without user data) on
// page load — re-used here to re-call init with advanced-matching data.
const FB_PIXEL_ID = "1126041265682766";

// EXAM_PRICE_OVERRIDES / getPriceForVariant / getSubscriptionPlanId live in
// @/lib/payment/examPriceOverrides — shared with every other place in the
// app that charges or displays a course price (MainPaywall, PreparationPaywall,
// PaywallFloatingWidget, MyCourseCard, ...).

export default function InitiatedPage() {
  const modalT = useTranslations("modals.unlockFullAccessModal");
  const { get, set } = useQueryParams();
  const locale = useLocale(); // "en", "hi", etc.
  const router = useRouter();
  const { user: authUser } = useAuth();

  const userPhone = String(authUser?.phone ?? "").replace(/\D/g, "").slice(-10);
  // const isAllowed = ALLOWED_PHONES.includes(userPhone);

  // useEffect(() => {
  //   if (authUser && !isAllowed) {
  //     router.replace("/dashboard");
  //   }
  // }, [authUser, isAllowed, router]);
  const [selectVariant, setSelectVariant] =
    React.useState<PaymentType>("1month");

  const [subscriptionLoading, setSubscriptionLoading] = React.useState(false);
  const [pricing, setPricing] = React.useState<PaymentPricing | null>(null);
  const [pricingLoading, setPricingLoading] = React.useState(true);

  const courseId = get("exam_id") as string;
  const courseName = get("course_name") as string;
  const source = get("source") as string;

  useEffect(() => {
    if (!courseId) {
      router.push("/dashboard");
    }
  }, [courseId, router]);

  useEffect(() => {
    getPaymentPricing()
      .then(setPricing)
      .catch(() => setPricing(null))
      .finally(() => setPricingLoading(false));
  }, []);

  const [redirecting, setRedirecting] = React.useState(false);

  const { allCourses = [] } = useMyActiveCourses();

  const datacourse = allCourses?.find((c) => c?.group_code === courseId);
  const data = datacourse?.exam;

  // Event-level Meta params for InitiateCheckout / AddPaymentInfo /
  // CustomizeProduct. Deliberately excludes ph/external_id — those are PII
  // and go through `fbq('set', 'userData', …)` once instead (see
  // setMetaUserData below), matching the same fix applied to the "Lead"
  // event in packages/auth/src/facebook-pixel.ts: Meta only auto-hashes
  // recognized PII fields when they're set via init/set-userData, not when
  // passed inside a track() call's custom-data object.
  const buildMetaParams = (price: number) => ({
    value: price,
    currency: "INR",
    content_id: data?.exam_id,
    content_category: "Course, PDF Notes and Mock Tests",
    content_name: [data?.name, data?.short_name].filter(Boolean).join(" - "),
  });

  // Re-sends Meta's advanced-matching data via `init` (same pixel ID
  // FacebookPixel.tsx already initialized without user data on page load) —
  // never inside a track() call's custom-data object, which Meta doesn't
  // auto-hash. Call before the first track() so subsequent events on this
  // page are matched to the user.
  const setMetaUserData = () => {
    if (typeof window === "undefined" || !window.fbq) return;

    const userData: { ph?: string; external_id?: string } = {};
    if (userPhone) userData.ph = `91${userPhone}`;
    if (authUser?.id) userData.external_id = String(authUser.id);

    if (Object.keys(userData).length > 0) {
      window.fbq("init", FB_PIXEL_ID, userData);
    }
  };

  const handleSelectVariant = useCallback(
    (variant: PaymentType) => {
      setSelectVariant((current) => {
        if (current !== variant) {
          trackFacebookEvent(
            "CustomizeProduct",
            buildMetaParams(getPriceForVariant(variant, pricing, data?.short_name)),
          );
        }
        return variant;
      });
    },
    [pricing, data],
  );

  const { levels: levelsRaw = [], loading: levelsLoading } = useLevels(
    data?.id,
  );

  useEffect(() => {
    if (!datacourse) return;

    trackEvent("Purchase Intent Initiated", {
      entry_point: source,
      product_id: data?.short_name!,
    });
    setMetaUserData();
    // Page just opened — selectVariant is still its "1month" default.
    trackFacebookEvent(
      "InitiateCheckout",
      buildMetaParams(getPriceForVariant("1month", pricing, data?.short_name)),
    );
    const sendWebhook = async () => {
      try {
        await webhookPaymentInitiate(datacourse?.group_code ?? "");
      } catch (err) {
        console.error("Webhook failed", err);
      }
    };

    sendWebhook();
  }, [datacourse]);

  /* ---------------------------------- container (stable) ---------------------------------- */

  /* ---------------------------------- memoized derived values ---------------------------------- */

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
      };
    });
  }, [rootLevels, locale]);

  const examTitle = useMemo(
    () => `${data?.short_name ?? ""} Exam`,
    [data?.short_name],
  );

  const Price = useMemo(
    () => JSON.parse(data?.price ?? "{}") ?? 0,
    [data?.price],
  );
  const comboPrice = useMemo(
    () => JSON.parse(data?.combo_price ?? "{}") ?? 0,
    [data?.combo_price],
  );

  const examLogo = useMemo(
    () => data?.logo_url || FALLBACK_IMAGE,
    [data?.logo_url],
  );

  const selectedPrice = useMemo(
    () => getPriceForVariant(selectVariant, pricing, data?.short_name),
    [selectVariant, pricing, data?.short_name],
  );

  useEffect(() => {
    if (selectedPrice != null) {
      set({ price: selectedPrice });
    }
  }, [selectedPrice]);

  /* ---------------------------------- payment hook ---------------------------------- */
  const { handlePayment, loading } = useRazorpayPayment({
    examId: data?.id!,
    examName: data?.short_name!,
    price: selectedPrice,
    type: selectVariant === "1month" ? "6months" : selectVariant,
    // onClose: close, // window.close() — kills tab on mobile before pollVerifyPayment finishes
    onClose: () => { },
    onSuccess: () => {
      setRedirecting(true);
      router.push(
        `/payment/success?exam_id=${courseId}&course_name=${data?.short_name}&source=${source}&price=${selectedPrice}`,
      );
    },
    onFailure: () => {
      setRedirecting(true);
      router.push(
        `/payment/failed?exam_id=${courseId}&course_name=${data?.short_name}`,
      );
    },
  });

  /* ---------------------------------- handlers ---------------------------------- */
  const handleSubscriptionPayment = useCallback(async () => {
    setSubscriptionLoading(true);
    try {
      const razorpayLoaded = await sentryApiClient(() => loadRazorpay(), {
        endpoint: "/load-razorpay",
        module: "subscription-payment",
      });
      if (!razorpayLoaded) {
        alert("Razorpay SDK failed to load");
        return;
      }

      let res;
      try {
        res = await createSubscription({
          course_id: courseId,
          plan_id: getSubscriptionPlanId(data?.short_name),
        });
      } catch (err) {
        // The backend rejects a duplicate subscribe attempt with 400 + the
        // existing subscription in the body — a known, expected case (user
        // hit "buy" for a course they already own), not a bug. Handle it
        // directly instead of routing through sentryApiClient, which would
        // log every occurrence as a generic api_error; genuinely unexpected
        // failures still fall through to the same logging below.
        if (isApiError(err) && err.status === 400) {
          let existingSubscription: { status?: string } | undefined;
          try {
            existingSubscription = err.responseBody
              ? JSON.parse(err.responseBody)?.subscription
              : undefined;
          } catch {
            // responseBody wasn't JSON — fall through to generic handling.
          }

          if (existingSubscription?.status === "active") {
            logger.warn("Subscribe attempted for an already-active subscription", {
              tags: { module: "subscription-payment" },
              extra: { course_id: courseId, user_id: authUser?.id },
            });
            alert("You already have an active subscription for this course.");
            setRedirecting(true);
            router.push(`/preparation/${courseId}`);
            return;
          }
        }

        logger.error(err, {
          tags: {
            type: "api_error",
            module: "subscription-payment",
            status: String(isApiError(err) ? err.status : "unknown"),
            endpoint: "/subscription/create",
          },
          extra: {
            callSite: "/subscription/create",
            user_id: authUser?.id,
            exam_id: data?.id,
            course_id: courseId,
          },
        });
        throw err;
      }

      // Fire after API so we know whether this is a fresh or resumed session
      trackEvent("Payment Initiated", {
        exam_name: data?.short_name ?? "",
        payment_flow: res.message?.includes("Resuming") ? "resumed_session" : "new_attempt",
        final_price: selectedPrice,
      });

      if (!res.success) {
        logger.warn("Subscription creation returned success=false", {
          tags: { module: "subscription-payment" },
          extra: { course_id: courseId, message: res.message },
        });
        alert("Failed to create subscription");
        return;
      }

      const options = {
        key: res.key,
        subscription_id: res.subscription.razorpay_subscription_id,
        name: "Clear Cutoff",
        handler: (response: {
          razorpay_payment_id: string;
          razorpay_subscription_id: string;
          razorpay_signature: string;
        }) => {
          trackEvent("Payment Outcome", {
            outcome: "payment_successful",
            final_price: selectedPrice,
            exam_name: data?.short_name ?? "",
            payment_session_id: response.razorpay_payment_id,
          });
          trackFacebookEvent("Subscribe", {
            value: selectedPrice,
            currency: "INR",
            predicted_ltv: selectedPrice * 2,
          });
          setRedirecting(true);
          router.push(
            `/payment/success?exam_id=${courseId}&course_name=${data?.short_name}&source=${source}&price=${selectedPrice}`,
          );
        },
        prefill: {
          name: authUser?.full_name ?? "",
          email: authUser?.email
            ? authUser.email
            : `${String(authUser?.phone ?? "").replace(/\D/g, "").slice(-10)}@pay.clearcutoff.in`,
          contact: String(authUser?.phone ?? "").replace(/\D/g, "").slice(-10),
        },
        readonly: { email: true },
        notes: {
          user_id: authUser?.id,
          user_name: authUser?.full_name ?? "",
          user_phone: userPhone,
          group_code: courseId,
          plan: "1month",
          subscription_id: res.subscription.id,
        },
        theme: { color: "#0083ff" },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.on(
        "payment.failed",
        (errorResponse: {
          error: {
            code: string;
            description: string;
            reason: string;
            source: string;
            step: string;
            metadata: { payment_id: string; subscription_id: string };
          };
        }) => {
          const { error } = errorResponse;

          trackEvent("Payment Outcome", {
            outcome: "payment_failed",
            final_price: selectedPrice,
            exam_name: data?.short_name ?? "",
            failure_reason: error.reason ?? "unknown",
            payment_session_id: error.metadata?.payment_id ?? "",
          });

          logger.error(
            new Error(`Subscription payment failed: ${error.description}`),
            {
              tags: {
                module: "subscription-payment",
                error_code: error.code,
              },
              extra: {
                user_id: authUser?.id,
                exam_id: data?.id,
                exam_name: data?.short_name,
                course_id: courseId,
                plan: "1month",
                price: selectedPrice,
                error_code: error.code,
                error_reason: error.reason,
                error_source: error.source,
                error_step: error.step,
                error_description: error.description,
                payment_id: error.metadata?.payment_id,
                subscription_id: error.metadata?.subscription_id,
                razorpay_subscription_id:
                  res.subscription.razorpay_subscription_id,
              },
            },
          );

          setRedirecting(true);
          router.push(
            `/payment/failed?exam_id=${courseId}&course_name=${data?.short_name}`,
          );
        },
      );
      razorpay.open();
    } catch (error) {
      logger.error(error, {
        tags: { module: "subscription-payment", type: "unexpected_error" },
        extra: {
          user_id: authUser?.id,
          exam_id: data?.id,
          exam_name: data?.short_name,
          course_id: courseId,
          plan: "1month",
          price: selectedPrice,
        },
      });
      alert("Something went wrong");
    } finally {
      setSubscriptionLoading(false);
    }
  }, [courseId, data?.short_name, data?.id, source, authUser, router, selectedPrice]);

  const handlePayClick = useCallback(() => {
    trackFacebookEvent("AddPaymentInfo", buildMetaParams(selectedPrice));
    if (selectVariant === "1month") {
      handleSubscriptionPayment();
    } else {
      handlePayment();
    }
  }, [selectVariant, selectedPrice, data, handleSubscriptionPayment, handlePayment]);

  /* ---------------------------------- states ---------------------------------- */

  const isPageLoading = !data || !authUser || pricingLoading;

  /* ---------------------------------- redirect loader ---------------------------------- */

  if (redirecting) {
    return (
      <div className="bg-[#f1f5fa] min-h-screen w-full flex justify-center items-center">
        <div className="flex flex-col items-center gap-3">
          <MainLoader />
          <p className="text-sm text-gray-500">Processing payment...</p>
        </div>
      </div>
    );
  }

  /* ---------------------------------- page skeleton ---------------------------------- */

  if (isPageLoading) {
    return (
      <div className="bg-[#f1f5fa] min-h-screen w-full flex justify-center items-center sm:px-4">
        <div className="w-full sm:max-w-[800px] flex flex-col gap-4">
          <div className="bg-white w-full px-3 py-4">
            <Skeleton className="h-6 w-40 mx-auto" />
          </div>

          <div className="bg-white p-4 flex justify-center">
            <div className="max-w-[352px] w-full flex flex-col gap-4">
              <Skeleton className="h-16 w-16 rounded-full mx-auto" />
              <Skeleton className="h-6 w-40 mx-auto" />
              <Skeleton className="h-6 w-32 mx-auto rounded-full" />

              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          </div>

          <div className="bg-white p-3">
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f1f5fa] min-h-screen w-full flex justify-center items-center sm:px-4">
      <div className="w-full sm:h-auto h-screen sm:max-w-[800px]  flex flex-col justify-between items-center gap-4">
        <div className="bg-white w-full">
          <div className="flex  w-full gap-4 px-3 py-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="cursor-pointer sm:hidden "
              aria-label="Go back"
            >
              <ArrowIcon />
            </button>

            <div className="w-full">
              <div className="heading-medium sm:text-center !font-semibold text-surface-gray-normal">
                {modalT("title")}
              </div>
              <div className="body-small sm:text-center !font-normal text-surface-gray-muted">
                {modalT("subtitle", { exam: examTitle })}
              </div>
            </div>
          </div>
        </div>

        {/* content  */}
        <div className="w-full flex justify-center p-4">
          <div className="max-w-[352px] w-full flex flex-col gap-5 bg-white p-4 rounded-lg">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-center gap-1">
                <Image
                  src={examLogo}
                  alt={data?.short_name || "Course logo"}
                  width={64}
                  height={64}
                  className="w-[64px] h-[64px] object-cover rounded-full"
                  priority
                />
                <div className="heading-large !font-semibold text-surface-gray-normal">
                  {examTitle}
                </div>
                <div className="">
                  {levelsLoading ? (
                    <Skeleton className="h-6 rounded-full" />
                  ) : papers.length > 0 ? (
                    <StatusChip
                      className="!text-brand-dark !bg-brand/9 !body-medium !font-semibold"
                      label={papers.map((item) => item.name).join(" + ")}
                    />
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1">
              <SheildIcon size={20}
                color="var(--color-surface-gray-subtle)" />
              <p className="body-medium text-surface-gray-subtle">
                {modalT("everything_included_one_price")}
              </p>
            </div>

            {/* pricing    */}
            <div className="flex flex-col gap-4">
              {/* 1-month plan */}
              <Card
                padding={"8px 20px"}
                borderRadius={PRICE_CARD_ROUNDING}
                cursor="pointer"
                borderwidth={2}
                bgcolor={
                  selectVariant === "1month"
                    ? "var(--color-primary-subtle)"
                    : "white"
                }
                bordercolor={
                  selectVariant === "1month" ? "var(--color-brand)" : "var(--color-primary-subtle)"
                }
                className={`exam-card transition-all duration-200 ease-out`}
                onClick={() => handleSelectVariant("1month")}
              >
                <div className="flex justify-between items-center w-full">
                  <div className="flex flex-col gap-1">
                    <p className="heading-medium !font-semibold text-surface-gray-normal">
                      {modalT("months", { count: 1 })} •{" "}
                      {`₹${getPriceForVariant("1month", pricing, data?.short_name)}`}{" "}
                      <Text className="line-through" variant="body-small">
                        {"₹1,499"}
                      </Text>
                    </p>
                    <p className="body-small !font-normal text-surface-gray-muted">
                      {modalT("best_for_new_students")}
                    </p>
                    {/* <StatusChip
                      className="!text-brand !bg-brand/9 !body-medium !font-semibold"
                      variant="outline"
                      tone="info"
                      label={modalT("last_minute_revision")}
                    /> */}
                  </div>

                  {selectVariant === "1month" ? (
                    <CheckIcon size={16} />
                  ) : (
                    <div className="border border-gray-400 w-4 h-4 rounded-full" />
                  )}
                </div>
              </Card>

              {/* 1-month one-time plan */}
              <Card
                padding={"8px 20px"}
                borderRadius={PRICE_CARD_ROUNDING}
                cursor="pointer"
                borderwidth={2}
                bgcolor={
                  selectVariant === "1month-onetime"
                    ? "var(--color-primary-subtle)"
                    : "white"
                }
                bordercolor={
                  selectVariant === "1month-onetime" ? "var(--color-brand)" : "var(--color-primary-subtle)"
                }
                className={`exam-card transition-all duration-200 ease-out`}
                onClick={() => handleSelectVariant("1month-onetime")}
              >
                <div className="flex justify-between items-center w-full">
                  <div className="flex flex-col gap-1">
                    <p className="heading-medium !font-semibold text-surface-gray-normal">
                      {modalT("months", { count: 1 })} •{" "}
                      {`₹${getPriceForVariant("1month-onetime", pricing, data?.short_name)}`}{" "}
                      <Text className="line-through" variant="body-small">
                        {"₹1,499"}
                      </Text>
                    </p>
                    <p className="body-small !font-normal text-surface-gray-muted">
                      {modalT("one_time_no_renewal")}
                    </p>
                  </div>

                  {selectVariant === "1month-onetime" ? (
                    <CheckIcon size={16} />
                  ) : (
                    <div className="border border-gray-400 w-4 h-4 rounded-full" />
                  )}
                </div>
              </Card>

              {/* 6-month plan — replaced by 1-year plan at ₹599
              <Card
                padding={"8px 20px"}
                borderRadius={PRICE_CARD_ROUNDING}
                cursor="pointer"
                bgcolor={
                  selectVariant === "6months"
                    ? "var(--color-primary-subtle)"
                    : "white"
                }
                bordercolor={
                  selectVariant === "6months" ? "var(--color-brand)" : "#ccc"
                }
                className={`exam-card transition-all duration-200 ease-out `}
                onClick={() => {
                  setSelectVariant("6months");
                }}
              >
                <div className="flex justify-between items-center w-full">
                  <div className="flex flex-col">
                    <p className="heading-medium !font-semibold text-surface-gray-normal">
                      {modalT("months", { count: 6 })} •{" "}
                      {"₹" + Price?.final_price}{" "}
                      <Text className="line-through" variant="body-small">
                        {"₹" + Price?.actual_price}
                      </Text>
                    </p>
                    <p className="body-small !font-normal text-surface-gray-muted">
                      {modalT("best_for_upcoming_exam")}
                    </p>
                  </div>
                  {selectVariant === "6months" ? (
                    <CheckIcon size={16} />
                  ) : (
                    <div className="border border-gray-400 w-4 h-4 rounded-full" />
                  )}
                </div>
              </Card>
              */}

              {/* 15-month plan — replaced by 1-year plan at ₹599
              <Card
                padding={"8px 20px"}
                borderRadius={4}
                cursor="pointer"
                bgcolor={
                  selectVariant === "15months"
                    ? "var(--color-primary-subtle)"
                    : "white"
                }
                bordercolor={
                  selectVariant === "15months" ? "var(--color-brand)" : "#ccc"
                }
                className={`exam-card transition-all duration-200 ease-out `}
                onClick={() => {
                  setSelectVariant("15months");
                }}
              >
                <div className="flex justify-between items-center w-full">
                  <div className="flex flex-col gap-1">
                    <p className="heading-medium !font-semibold text-surface-gray-normal">
                      {modalT("months", { count: 15 })} •{" "}
                      {"₹" + comboPrice?.final_price}{" "}
                      <Text className="line-through" variant="body-small">
                        {"₹" + comboPrice?.actual_price}
                      </Text>
                    </p>
                    <div className="flex items-center gap-1">
                      <StarIcon />
                      <p className="body-small !font-normal text-surface-gray-muted">
                        {modalT("most_popular")}
                      </p>
                    </div>
                    <StatusChip
                      className="!text-brand !bg-brand/9 !body-medium !font-semibold"
                      variant="outline"
                      tone="info"
                      label={modalT("best_value_covers_next_exam")}
                    />
                  </div>
                  {selectVariant === "15months" ? (
                    <CheckIcon size={16} />
                  ) : (
                    <div className="border border-gray-400 w-4 h-4 rounded-full" />
                  )}
                </div>
              </Card>
              */}

              {/* 1-year plan */}
              <Card
                padding={"8px 20px"}
                borderRadius={PRICE_CARD_ROUNDING}
                cursor="pointer"
                borderwidth={2}
                bgcolor={
                  selectVariant === "1year"
                    ? "var(--color-primary-subtle)"
                    : "white"
                }
                bordercolor={
                  selectVariant === "1year" ? "var(--color-brand)" : "var(--color-primary-subtle)"
                }
                className={`exam-card transition-all duration-200 ease-out`}
                onClick={() => handleSelectVariant("1year")}
              >
                <div className="flex justify-between items-center w-full">
                  <div className="flex flex-col gap-1">
                    <p className="heading-medium !font-semibold text-surface-gray-normal">
                      {modalT("months", { count: 12 })} •{" "}
                      {`₹${getPriceForVariant("1year", pricing, data?.short_name)}`}
                    </p>
                    <div className="flex items-center gap-1">
                      <StarIcon />
                      <p className="body-small !font-normal text-surface-gray-muted">
                        {modalT("most_popular")}
                      </p>
                    </div>
                    <StatusChip
                      className="!text-brand !bg-brand/9 !body-medium !font-semibold"
                      variant="outline"
                      tone="info"
                      label={modalT("best_value_covers_next_exam")}
                    />
                  </div>

                  {selectVariant === "1year" ? (
                    <CheckIcon size={16} />
                  ) : (
                    <div className="border border-gray-400 w-4 h-4 rounded-full" />
                  )}
                </div>
              </Card>
            </div>

            {/* <div className="flex items-center justify-center gap-1">
              <WarningCirleIcon
                size={16}
                color="var(--color-surface-gray-muted)"
              />
              <p className="body-small text-surface-gray-muted">
                {modalT("offline_coaching_cost", {
                  exam: examTitle,
                  min: 15000,
                  max: 25000,
                })}
              </p>
            </div> */}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 px-3 py-2 bg-white w-full">
          <div className="w-full flex flex-col items-center gap-4">
            <div className="w-full flex flex-col items-center gap-1">
              <div className="w-full max-w-[400px]">
                <ShimmerButton
                  onClick={handlePayClick}
                  size="lg"
                  loading={loading || subscriptionLoading}
                  iconPosition="right"
                  icon={
                    <LockIcon variant="without-key" size={16} color="white" />
                  }
                  text={modalT("cta", {
                    exam: `₹${selectedPrice}`,
                  })}
                />
              </div>

              <div className="flex body-small items-center gap-2 text-surface-gray-muted">
                <div className="flex items-center gap-2">
                  <LockIcon size={20} color="var(--color-surface-gray-muted)" />
                  <p>{modalT("paymentInfo")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <PaymentCardIcon
                    size={16}
                    variant="outline"
                    color="var(--color-surface-gray-muted)"
                  />
                  <p>{modalT("paymentMethods")}</p>
                </div>
              </div>
            </div>

            <div className="w-full max-w-[400px]">
              <Button
                // onClick={close} // window.close() — use router.back() instead
                onClick={() => router.back()}
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
          </div>
        </div>
      </div>
    </div>
  );
}
