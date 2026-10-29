"use client";
import { FALLBACK_IMAGE } from "@/components/features/PayWalls/MainPaywall";
import { MainLoader } from "@/components/FullScreenLoader";
import ShimmerButton from "@/components/ui/button/shimmer-button";
import StatusChip from "@/components/ui/cards/preparation/chapter-list/StatusChip";
import {
  ArrowIcon,
  ChartSuccessBarIcon,
  ClipBoardIcon,
  ClockIcon,
  GraduationCapIcon,
  LockIcon,
  NoteIcon,
  PaymentCardIcon,
  SheildIcon,
} from "@/components/ui/icons";
import StarIcon from "@/components/ui/icons/star-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyActiveCourses } from "@/hooks/course/useMyActiveCourses";
import { useLevels } from "@/hooks/onboarding/useLevels";
import { useRazorpayPayment } from "@/hooks/payment/useRazorpayPayment";
import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";
import {
  trackFacebookEventOnce,
  LIVE_FB_PIXEL_ID,
  getFbPixelId,
  trackFacebookEvent,
  trackFacebookEventWithUserData,
} from "@/lib/analytics/facebook-pixel";
import { computeMetaPurchaseValue } from "@/lib/payment/metaPurchaseConfig";
import { getMetaGeoData, type MetaGeoData } from "@clearcut/utils/meta-geo";
import { recordCheckoutInitiated, recordCourseCustomization, webhookPaymentInitiate } from "@/lib/api/auth";
import { sentryApiClient } from "@/lib/sentry/sentry-api-client";
import { logger } from "@/lib/sentry/sentry-logger";
import { isApiError } from "@/lib/api/api-error";
import { LevelTranslation } from "@/lib/api/onboarding";
import {
  createSubscription,
  getPaymentPricing,
  getSubscriptionMetaPurchase,
  type MetaPurchase,
  PaymentPricing,
  PaymentType,
} from "@/lib/payment/payment";
import { getPriceForVariant, getSubscriptionPlanId } from "@/lib/payment/examPriceOverrides";
import { getPlanAnalytics } from "@/lib/payment/planAnalytics";
import { AUTOPAY_OFFER_VARIANT } from "@/lib/experiments/autopayPrice";
import { useAutopayOffer } from "@/lib/experiments/useAutopayOffer";
import { getPaymentFailureReason } from "@/lib/payment/paymentAnalytics";
import { loadRazorpay } from "@/lib/loadRazorpay";
import { parseTranslation } from "@/utils/text/translation";
import { useAuth } from "@/providers/AuthProvider";
import { checkoutReturnUrl, isInAppBrowser } from "@/lib/payment/paymentAttempt";
import { inAppBrowserKind, payPlanLabel, trackPaymentEvent } from "@/lib/analytics/paymentFunnel";
import ContinueFreeSheet, { type ContinueFreeReason } from "@/components/features/payment/ContinueFreeSheet";
import PlanCard from "@/components/features/payment/PlanCard";
import { supportWhatsAppUrl } from "@/lib/support";
import { useLocale, useTranslations } from "next-intl";
import { paymentHeadlineKey } from "@/lib/payment/paymentHeadline";
import Image from "next/image";
import { useRouter } from "@/i18n/navigation";
import React, { useCallback, useEffect, useMemo } from "react";

/**
 * The desktop design's left column. Each entry reads two message keys —
 * `benefits.<key>` and `benefits.<key>Sub`. Icons are the closest existing
 * dashboard icons rather than new SVGs; none of them is a pixel match for the
 * mock's set, which is a deliberate trade against adding icon assets.
 */
const BENEFITS = [
  { key: "allSubjects", Icon: GraduationCapIcon },
  { key: "practiceQuestions", Icon: ClipBoardIcon },
  { key: "examPattern", Icon: ChartSuccessBarIcon },
  { key: "studyAnytime", Icon: ClockIcon },
  { key: "freeNotes", Icon: NoteIcon },
] as const;

// const ALLOWED_PHONES = ["9988776655", "7210708599"];

// The pixel FacebookPixel.tsx initialized on page load (getFbPixelId) is
// re-used below to re-call init with advanced-matching data.

// EXAM_PRICE_OVERRIDES / getPriceForVariant / getSubscriptionPlanId live in
// @/lib/payment/examPriceOverrides — shared with every other place in the
// app that charges or displays a course price (MainPaywall, PreparationPaywall,
// PaywallFloatingWidget, MyCourseCard, ...).

// The plan preselected when the page loads — reported on every Plan Switched
// as `default_plan_id`, and the starting point for detecting a switch. It is
// the one-time 1-month plan (the first card), not the autopay one.
const DEFAULT_VARIANT: PaymentType = "1month-onetime";
// Plans this page offers (the ones a `?plan=` may preselect).
const PLAN_VARIANTS = ["1month", "1month-onetime", "1year"] as const;

export default function InitiatedPage() {
  const modalT = useTranslations("modals.unlockFullAccessModal");
  const checkoutT = useTranslations("payment.checkout");
  const { get } = useQueryParams();
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
  // `?plan=` (e.g. "Try again" on /payment/failed, CC-64) opens on that plan.
  // Read once for the initial state only — no URL sync (CC-61).
  const [selectVariant, setSelectVariant] = React.useState<PaymentType>(() => {
    const plan = get("plan");
    return typeof plan === "string" && (PLAN_VARIANTS as readonly string[]).includes(plan)
      ? (plan as PaymentType)
      : DEFAULT_VARIANT;
  });
  // Plan Switched bookkeeping lives in refs, NOT in the setState updater below:
  // updaters must be pure (StrictMode runs them twice in dev), and refs update
  // synchronously so two fast clicks are each compared against the right plan.
  const currentVariantRef = React.useRef<PaymentType>(selectVariant);
  const switchCountRef = React.useRef(0);

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
  // Shown under the pay button instead of alert(), which in-app WebViews
  // often suppress (CC-60). Cleared on the next tap.
  const [payError, setPayError] = React.useState<string | null>(null);
  // Synchronous double-tap guard for the pay button (state lags a render).
  const payBusyRef = React.useRef(false);

  // Fetch Razorpay's checkout.js while the student reads the page, so the
  // tap only has to create the order (CC-60, D2: script only, no order).
  useEffect(() => {
    void loadRazorpay();
  }, []);

  const { allCourses = [] } = useMyActiveCourses();

  const datacourse = allCourses?.find((c) => c?.group_code === courseId);
  const data = datacourse?.exam;

  // Allow-listed ₹99 offer (phase 66). `offer` is null unless Amplitude selected
  // this user for this exam; every autopay price, plan id and analytics value on
  // this page goes through it, so what is shown is what is sent to checkout.
  const autopay = useAutopayOffer(data?.short_name);
  const autopayOffer = autopay.offer;
  const priceFor = useCallback(
    (variant: PaymentType) => getPriceForVariant(variant, pricing, data?.short_name, autopayOffer),
    [pricing, data?.short_name, autopayOffer],
  );
  // Added to the funnel events of users shown the ₹99 offer, so each can be
  // split from the default price.
  const armProps = () => (autopayOffer ? ({ price_offer: AUTOPAY_OFFER_VARIANT } as const) : {});

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
  const setMetaUserData = async () => {
    if (typeof window === "undefined" || !window.fbq) return;

    const userData: { ph?: string; external_id?: string } & Partial<MetaGeoData> = {};
    if (userPhone) userData.ph = `91${userPhone}`;
    if (authUser?.id) userData.external_id = String(authUser.id);

    Object.assign(userData, await getMetaGeoData());

    if (Object.keys(userData).length > 0) {
      window.fbq("init", getFbPixelId() ?? LIVE_FB_PIXEL_ID, userData);
    }
  };

  const handleSelectVariant = useCallback(
    (variant: PaymentType) => {
      // Analytics: fires once per real switch — re-selecting the current plan
      // does nothing. Deliberately outside the updater below.
      const previousVariant = currentVariantRef.current;
      if (variant !== previousVariant) {
        currentVariantRef.current = variant;
        switchCountRef.current += 1;

        const planCourseName = courseName || data?.short_name || "";
        const from = getPlanAnalytics(previousVariant, pricing, data?.short_name, planCourseName, autopayOffer);
        const to = getPlanAnalytics(variant, pricing, data?.short_name, planCourseName, autopayOffer);
        const defaultPlan = getPlanAnalytics(DEFAULT_VARIANT, pricing, data?.short_name, planCourseName, autopayOffer);

        const toPrice = priceFor(variant);

        if (from && to && defaultPlan && data?.exam_id) {
          trackPaymentEvent("Plan Switched", {
            exam_id: data.exam_id,
            course_name: planCourseName,
            from_plan_id: from.plan_id,
            from_price: from.price,
            from_duration_months: from.duration_months,
            from_billing_type: from.billing_type,
            to_plan_id: to.plan_id,
            to_price: to.price,
            to_duration_months: to.duration_months,
            to_billing_type: to.billing_type,
            default_plan_id: defaultPlan.plan_id,
            switch_number: switchCountRef.current,
            currency: "INR",
            exam: data?.short_name,
            plan: payPlanLabel(variant, toPrice),
            price: toPrice,
            source,
            language: locale,
            in_app_browser: inAppBrowserKind(),
            ...armProps(),
          });
        }
      }

      setSelectVariant((current) => {
        if (current !== variant) {
          const variantPrice = priceFor(variant);
          // Fires on the plan-toggle click, which can happen before this
          // page's own InitiateCheckout effect (below) has finished its
          // async setMetaUserData() — unlike that call, this one can't
          // assume advanced-matching data is already set, so it sets its
          // own.
          trackFacebookEventWithUserData("CustomizeProduct", buildMetaParams(variantPrice));

          if (data?.id) {
            // NOTE: data.id (numeric exams.id, the real FK) — not
            // data.exam_id, which is a string slug ("teaching_HTET") only
            // used for Facebook's content_id above.
            recordCourseCustomization(data.id, { plan: variant, price: variantPrice }).catch(
              (err) => console.error("recordCourseCustomization failed", err),
            );
          }
        }
        return variant;
      });
    },
    [pricing, data, courseName, source, locale, autopayOffer, priceFor],
  );

  const { levels: levelsRaw = [], loading: levelsLoading } = useLevels(
    data?.id,
  );

  // The "page opened" tracking below must run ONCE per visit. It is keyed on
  // `datacourse`, and that object is replaced whenever the my-courses query
  // refetches with changed data — which is exactly what happens right after a
  // payment (useRazorpayPayment invalidates that query on success/verify). The
  // effect then fired AGAIN at the end of a payment: a second "Purchase Intent
  // Initiated", a second Meta InitiateCheckout, a second checkout record and a
  // second payment-initiate webhook — just before the user is sent to the
  // success/failed page. The ref also blocks the StrictMode dev double-run.
  const pageOpenTrackedForRef = React.useRef<string | null>(null);

  useEffect(() => {
    // Wait for the autopay price: the `?plan=1month` deep link opens on it.
    if (!datacourse || !autopay.ready) return;

    const visitKey = String(datacourse.group_code ?? "");
    if (pageOpenTrackedForRef.current === visitKey) return;
    pageOpenTrackedForRef.current = visitKey;

    const openingPrice = priceFor(currentVariantRef.current);
    trackPaymentEvent("Purchase Intent Initiated", {
      entry_point: source,
      product_id: data?.short_name!,
      exam: data?.short_name,
      plan: payPlanLabel(currentVariantRef.current, openingPrice),
      price: openingPrice,
      source,
      language: locale,
      in_app_browser: inAppBrowserKind(),
      ...armProps(),
    });

    // Awaited before InitiateCheckout fires below — setMetaUserData's geo
    // lookup is async, and Meta only auto-hashes ph/external_id/ct/st/zp
    // when they're set via init() before the track() call that should carry
    // them, never inside track()'s own custom-data object.
    const trackInitiateCheckout = async () => {
      await setMetaUserData();
      // Page just opened — selectVariant is still DEFAULT_VARIANT.
      const initiateCheckoutPrice = priceFor(DEFAULT_VARIANT);
      trackFacebookEventWithUserData("InitiateCheckout", buildMetaParams(initiateCheckoutPrice));

      if (data?.id) {
        // NOTE: data.id (numeric exams.id, the real FK) — not data.exam_id,
        // which is a string slug ("teaching_HTET") only used for Facebook's
        // content_id above. Fire-and-forget, same pattern as CustomizeProduct.
        recordCheckoutInitiated(data.id, { value: initiateCheckoutPrice, currency: "INR" }).catch(
          (err) => console.error("recordCheckoutInitiated failed", err),
        );
      }
    };
    trackInitiateCheckout();

    const sendWebhook = async () => {
      try {
        await webhookPaymentInitiate(datacourse?.group_code ?? "");
      } catch (err) {
        console.error("Webhook failed", err);
      }
    };

    sendWebhook();
  }, [datacourse, autopay.ready]);

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
    () => priceFor(selectVariant),
    [selectVariant, priceFor],
  );

  // The selected plan lives in React state only (CC-61). This page used to
  // mirror the price into the URL with router.replace — a full App Router
  // navigation with a server round trip — twice on load (price before and
  // after the course data) and again on every plan switch, which is what
  // made the page "load twice". Nothing read that `price` param.

  /* ---------------------------------- payment hook ---------------------------------- */
  const { handlePayment, loading, phase: paymentPhase } = useRazorpayPayment({
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
        `/payment/failed?exam_id=${courseId}&course_name=${data?.short_name}&plan=${selectVariant}&price=${selectedPrice}`,
      );
    },
    // Paid, webhook late: success page with an "activating" note (CC-60).
    onPending: () => {
      setRedirecting(true);
      router.push(
        `/payment/success?exam_id=${courseId}&course_name=${data?.short_name}&source=${source}&price=${selectedPrice}&pending=1`,
      );
    },
    onError: (reason) => setPayError(checkoutT(reason === "sdk_failed" ? "errorSdk" : "errorGeneric")),
    // Razorpay redirect mode in the Facebook/Instagram app (CC-59): the
    // backend sends the student to /payment/success or /payment/failed.
    returnParams: {
      exam_id: courseId,
      course_name: data?.short_name,
      price: selectedPrice,
      source,
      plan: selectVariant,
    },
  });

  /* ---------------------------------- handlers ---------------------------------- */
  // "Continue free" / back arrow (CC-63). Opened straight from a link
  // (WhatsApp, ad, push) there is no page to go back to, so router.back()
  // did nothing and the tap looked dead. Go back as before; if we're still
  // here a moment later, open this course's learning page instead.
  // Browser back / swipe back first shows "Why not now?" (once per visit):
  // an extra history entry for this same URL is the "guard". The first back
  // only removes the guard, which opens the sheet; leaving the page skips it.
  const backGuardRef = React.useRef(false);
  const ignoreNextPopRef = React.useRef(false);

  const leavePaymentPage = useCallback(() => {
    const before = window.location.href;
    if (backGuardRef.current) {
      // Step over the guard and this page in one go.
      backGuardRef.current = false;
      ignoreNextPopRef.current = true;
      window.history.go(-2);
    } else {
      router.back();
    }
    window.setTimeout(() => {
      ignoreNextPopRef.current = false;
      if (window.location.href === before) router.replace(`/preparation/${courseId}`);
    }, 400);
  }, [router, courseId]);

  // CC-63: "Why not now?" before leaving for free learning. Every answer
  // leaves at once; "payment issue" opens WhatsApp help and stays here.
  const [continueFreeOpen, setContinueFreeOpen] = React.useState(false);
  const continueFreeTriggerRef = React.useRef<"link" | "back">("link");
  const handleContinueFreeAnswer = (reason: ContinueFreeReason) => {
    trackPaymentEvent("Continue Free Clicked", {
      ...payFunnelProps(),
      reason,
      trigger: continueFreeTriggerRef.current,
    });
    setContinueFreeOpen(false);
    // Wants to buy, just not autopay: show the one-time plan and stay.
    if (reason === "prefer_one_time") {
      handleSelectVariant("1month-onetime");
      return;
    }
    if (reason === "payment_issue") {
      window.open(
        supportWhatsAppUrl(modalT("continueFreePaymentHelp", { course: data?.short_name ?? "" })),
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }
    leavePaymentPage();
  };

  // Arm the back guard once the page has its content.
  useEffect(() => {
    if (!data || backGuardRef.current) return;
    window.history.pushState({ ...window.history.state, ccPayBackGuard: true }, "", window.location.href);
    backGuardRef.current = true;
  }, [data]);

  // A checkout is open or a payment is being confirmed (read inside the
  // popstate listener below, which is set up once).
  const checkoutBusyRef = React.useRef(false);
  checkoutBusyRef.current = loading || subscriptionLoading;

  // Back / swipe back removed the guard: show the sheet instead of leaving.
  // While a Razorpay checkout or a payment check is running, back belongs to
  // that flow — re-arm the guard and do nothing else.
  useEffect(() => {
    const onPopState = () => {
      if (ignoreNextPopRef.current) {
        ignoreNextPopRef.current = false;
        return;
      }
      if (!backGuardRef.current) return;
      if (payBusyRef.current || checkoutBusyRef.current) {
        window.history.pushState({ ...window.history.state, ccPayBackGuard: true }, "", window.location.href);
        return;
      }
      backGuardRef.current = false;
      continueFreeTriggerRef.current = "back";
      setContinueFreeOpen(true);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Shared properties of the CC-69 checkout funnel events on this page.
  const payFunnelProps = () => ({
    exam: data?.short_name,
    plan: payPlanLabel(selectVariant, selectedPrice),
    price: Number(selectedPrice),
    source,
    language: locale,
    in_app_browser: inAppBrowserKind(),
    ...armProps(),
  });

  const handleSubscriptionPayment = useCallback(async () => {
    setSubscriptionLoading(true);
    // Busy until the popup is closed or the payment ends, not just until
    // open() returns (same as the one-time hook, CC-60 follow-up).
    let checkoutOpened = false;
    try {
      const razorpayLoaded = await sentryApiClient(() => loadRazorpay(), {
        endpoint: "/load-razorpay",
        module: "subscription-payment",
      });
      if (!razorpayLoaded) {
        setPayError(checkoutT("errorSdk"));
        return;
      }

      let res;
      try {
        res = await createSubscription({
          course_id: courseId,
          plan_id: getSubscriptionPlanId(data?.short_name, autopayOffer),
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

          // SubscriptionController::create blocks a new subscribe for ANY of
          // authenticated/active/paused (not just active) — handling only
          // "active" left the other two falling through to logger.error
          // below, which is what kept CLEARCUTOFF-NEXTJS-APP-7E regressing:
          // a user whose mandate is authorized but not yet charged
          // ("authenticated"), or who paused, re-clicking buy is the same
          // expected duplicate-subscribe case, not a defect.
          const existingStatus = existingSubscription?.status;
          if (existingStatus === "active" || existingStatus === "authenticated" || existingStatus === "paused") {
            // Breadcrumb only, not warn(): handled gracefully right below
            // (redirect + alert telling the user why) — not a defect, so it
            // shouldn't page anyone as its own Sentry issue
            // (CLEARCUTOFF-NEXTJS-APP-7J).
            logger.breadcrumb("Subscribe attempted for an already-existing subscription", {
              tags: { module: "subscription-payment" },
              extra: { course_id: courseId, user_id: authUser?.id, status: existingStatus },
            });
            setRedirecting(true);
            if (existingStatus === "paused") {
              alert("Your subscription for this course is paused. You can resume it from your Profile.");
              router.push("/dashboard/profile");
            } else {
              alert(
                existingStatus === "authenticated"
                  ? "Your subscription is being activated for this course."
                  : "You already have an active subscription for this course.",
              );
              router.push(`/preparation/${courseId}`);
            }
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
      trackPaymentEvent("Payment Initiated", {
        exam_name: data?.short_name ?? "",
        payment_flow: res.message?.includes("Resuming") ? "resumed_session" : "new_attempt",
        final_price: selectedPrice,
        ...payFunnelProps(),
      });

      if (!res.success) {
        logger.warn("Subscription creation returned success=false", {
          tags: { module: "subscription-payment" },
          extra: { course_id: courseId, message: res.message },
        });
        setPayError(checkoutT("errorGeneric"));
        return;
      }

      // CC-58: autopay subscriptions always live on the live Razorpay
      // account. A test key here would open checkout in Test Mode for a real
      // student, so don't open it. A missing key (backend from before it
      // started sending one) still opens as before, but is reported.
      if (typeof res.key === "string" && res.key.startsWith("rzp_test_")) {
        logger.error(new Error("Autopay checkout got a Razorpay test key"), {
          tags: { module: "subscription-payment" },
          extra: { course_id: courseId },
        });
        setPayError(checkoutT("errorUnavailable"));
        return;
      }
      if (!res.key) {
        logger.warn("Autopay checkout opened without a Razorpay key", {
          tags: { module: "subscription-payment" },
          extra: { course_id: courseId },
        });
      }

      // One Payment Outcome per checkout session — see useRazorpayPayment.ts.
      let outcomeReported = false;

      const options = {
        key: res.key,
        subscription_id: res.subscription.razorpay_subscription_id,
        name: "Clear Cutoff",
        // Inside the Facebook/Instagram app the page often dies during the
        // mandate; Razorpay then returns through the backend (CC-59).
        ...(isInAppBrowser()
          ? {
              callback_url: checkoutReturnUrl({
                exam_id: courseId,
                course_name: data?.short_name,
                price: selectedPrice,
                source,
                plan: selectVariant,
                lang: locale === "en" ? undefined : locale,
              }),
              redirect: true,
            }
          : {}),
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_subscription_id: string;
          razorpay_signature: string;
        }) => {
          outcomeReported = true;
          trackPaymentEvent("Payment Outcome", {
            outcome: "payment_successful",
            billing_type: "auto_renew",
            final_price: selectedPrice,
            exam_name: data?.short_name ?? "",
            payment_session_id: response.razorpay_payment_id,
            ...payFunnelProps(),
          });
          // selectedPrice is the real, final charged amount (never a list
          // price) — the Razorpay subscription's own order amount. Both
          // Subscribe's `value`/`predicted_ltv` and the Purchase below use
          // the same rounded, SUBSCRIPTION_VALUE_MULTIPLIER-scaled number
          // (configurable in metaPurchaseConfig.ts) rather than a separate
          // hardcoded ×2 for predicted_ltv.
          //
          // CC-53: the backend decides whether this checkout is the user's
          // FIRST payment for the course (a course already paid for, e.g.
          // one-time earlier, is a renewal: nothing is sent) and the value
          // (plan amount x server-side multiplier). Bounded wait so the
          // redirect below is never held up; if the backend predates the
          // endpoint, the client-side values below are used as before.
          // Autopay renewals are charged by webhook and never reach here.
          let meta: MetaPurchase | null | undefined;
          try {
            meta = await Promise.race([
              getSubscriptionMetaPurchase(res.subscription.id).then((r) => r.meta_purchase),
              new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
            ]);
          } catch {
            meta = undefined;
          }
          if (meta) {
            if (meta.send) {
              trackFacebookEventOnce(
                "Subscribe",
                { value: meta.value, currency: meta.currency, predicted_ltv: meta.value },
                meta.event_id,
              );
              trackFacebookEventOnce(
                "Purchase",
                {
                  value: meta.value,
                  currency: meta.currency,
                  amount_paid: meta.amount_paid,
                  plan: "monthly_autopay",
                },
                meta.event_id,
              );
            }
          } else {
            const subscribeValue = computeMetaPurchaseValue(selectedPrice, "1month");
            trackFacebookEventWithUserData("Subscribe", {
              value: subscribeValue,
              currency: "INR",
              predicted_ltv: subscribeValue,
            });
            trackFacebookEventWithUserData("Purchase", {
              value: subscribeValue,
              currency: "INR",
              amount_paid: selectedPrice,
              plan: "monthly_autopay",
            });
          }
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

        // Popup closed by the user — Razorpay fires no payment.failed for this.
        modal: {
          ondismiss: () => {
            // Closed without paying: the button works again.
            if (!outcomeReported) setSubscriptionLoading(false);
            if (outcomeReported) return;
            outcomeReported = true;

            trackPaymentEvent("Payment Outcome", {
              outcome: "payment_failed",
              billing_type: "auto_renew",
              final_price: selectedPrice,
              exam_name: data?.short_name ?? "",
              failure_reason: "cancelled",
              payment_session_id: res.subscription.razorpay_subscription_id,
              ...payFunnelProps(),
            });
          },
        },
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

          outcomeReported = true;
          trackPaymentEvent("Payment Outcome", {
            outcome: "payment_failed",
            billing_type: "auto_renew",
            final_price: selectedPrice,
            exam_name: data?.short_name ?? "",
            failure_reason: getPaymentFailureReason(error),
            payment_session_id: error.metadata?.payment_id ?? "",
            error_code: error?.code,
            error_reason: error?.reason,
            ...payFunnelProps(),
          });

          // Razorpay's own `error.source` distinguishes an expected
          // customer-side decline (insufficient funds, wrong OTP, card
          // declined, user cancelled — "customer") from a genuine
          // integration/gateway problem ("business"/"internal"/gateway
          // faults). The former happens to some fraction of real
          // transactions no matter what the code does — reporting every one
          // as a Sentry error (as this used to) buried the small number of
          // failures actually worth investigating under routine payment
          // declines. Still tracked (as a warning, with the same context),
          // just not alerted on as a defect.
          const logContext = {
            tags: {
              module: "subscription-payment",
              error_code: error.code,
              error_source: error.source,
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
          };

          // Only Razorpay's own integration faults (`business` / `internal`)
          // are bugs. A decline by the customer, their bank or the gateway
          // (insufficient funds, card not eligible for autopay, invalid card)
          // is a normal outcome — already counted by Amplitude "Payment
          // Outcome" above — so it is a breadcrumb, not a Sentry issue
          // (CLEARCUTOFF-NEXTJS-APP-85, -82: sources were gateway and
          // remitter_bank, never customer). code/reason in the message keeps
          // one issue per kind instead of one per description text.
          const isIntegrationFault = error.source === "business" || error.source === "internal";
          if (!isIntegrationFault) {
            logger.breadcrumb(`Subscription payment declined: ${error.description}`, logContext);
          } else {
            logger.error(new Error(`Subscription payment failed: ${error.code}/${error.reason}`), logContext);
          }

          setRedirecting(true);
          router.push(
            `/payment/failed?exam_id=${courseId}&course_name=${data?.short_name}&plan=${selectVariant}&price=${selectedPrice}`,
          );
        },
      );
      razorpay.open();
      checkoutOpened = true;
      trackPaymentEvent("Checkout Opened", { billing_type: "auto_renew", ...payFunnelProps() });
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
      setPayError(checkoutT("errorGeneric"));
    } finally {
      // Not opened: free the button now; once opened, the popup's callbacks
      // (dismiss / success redirect / failure redirect) end it.
      if (!checkoutOpened) setSubscriptionLoading(false);
    }
  }, [courseId, data?.short_name, data?.id, source, authUser, router, selectedPrice, autopayOffer]);

  const handlePayClick = useCallback(() => {
    // One checkout at a time: a second quick tap used to create a second
    // order and fire AddPaymentInfo again (CC-60).
    // `loading`/`subscriptionLoading` stay on while a checkout is open or a
    // payment is being confirmed, so a tap then does nothing at all.
    if (payBusyRef.current || loading || subscriptionLoading) return;
    payBusyRef.current = true;
    setPayError(null);
    trackFacebookEventWithUserData("AddPaymentInfo", buildMetaParams(selectedPrice));
    const start = selectVariant === "1month" ? handleSubscriptionPayment : handlePayment;
    void start().finally(() => {
      payBusyRef.current = false;
    });
  }, [selectVariant, selectedPrice, data, handleSubscriptionPayment, handlePayment, loading, subscriptionLoading]);

  /* ---------------------------------- states ---------------------------------- */

  // `autopay.ready`: a user who may be in the price test waits (bounded) for
  // Amplitude instead of seeing one price that then changes.
  const isPageLoading = !data || !authUser || pricingLoading || !autopay.ready;

  // The autopay price is on screen: log the exposure (once; the runtime
  // guards duplicates and never exposes a fallback).
  const exposeAutopay = autopay.expose;
  useEffect(() => {
    if (!isPageLoading) exposeAutopay();
  }, [isPageLoading, exposeAutopay]);

  /* ---------------------------------- redirect loader ---------------------------------- */

  // After a successful checkout the one-time path checks the webhook for up
  // to ~80 s; without this screen the pay page just sat there (CC-60).
  if (redirecting || paymentPhase === "verifying" || paymentPhase === "activating") {
    return (
      <div className="bg-[#f1f5fa] min-h-screen w-full flex justify-center items-center">
        <div className="flex flex-col items-center gap-3 px-4 text-center">
          <MainLoader />
          <p className="text-sm text-gray-500">
            {paymentPhase === "activating"
              ? checkoutT("activating")
              : paymentPhase === "verifying"
                ? checkoutT("confirming")
                : checkoutT("processing")}
          </p>
        </div>
      </div>
    );
  }

  /* ---------------------------------- page skeleton ---------------------------------- */

  if (isPageLoading) {
    return (
      <div className="bg-[#f1f5fa] min-h-screen w-full flex justify-center items-center sm:px-4 lg:items-start lg:py-8">
        {/* Same frame, same four blocks and the same heights as the loaded page
            below, so the content replaces the skeleton in place instead of the
            whole page jumping (CLS 0.19 on mobile, CC-61; 0.456 after the
            redesign until this was brought back in step). */}
        <div className="w-full sm:h-auto h-screen sm:max-w-[800px] lg:max-w-[1120px] lg:h-auto flex flex-col justify-between items-center gap-0 lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-x-6 lg:gap-y-5">
          <div className="bg-white w-full lg:col-span-2 lg:bg-transparent">
            <div className="flex h-[74px] w-full flex-col items-center justify-center gap-2 px-3 lg:h-[58px]">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3.5 w-60" />
            </div>
          </div>

          <div className="w-full flex justify-center px-4 pt-3 pb-3 lg:p-0 lg:col-start-1 lg:row-start-2 lg:row-span-2">
            <div className="flex h-[77px] w-full max-w-[352px] flex-row items-center justify-center gap-3 rounded-lg bg-white p-3 lg:h-full lg:min-h-[550px] lg:max-w-none lg:flex-col lg:items-start lg:justify-start lg:p-6">
              <Skeleton className="h-14 w-14 shrink-0 rounded-full lg:h-16 lg:w-16" />
              <div className="flex flex-col gap-2 lg:gap-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-48 rounded-full" />
              </div>
            </div>
          </div>

          <div className="w-full flex justify-center lg:p-0 lg:col-start-2 lg:row-start-2">
            <div className="flex h-[342px] w-full flex-col gap-3 rounded-none bg-white p-3 lg:gap-4 lg:h-[380px] lg:max-w-none lg:rounded-lg lg:rounded-b-none lg:p-6 lg:pb-0">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-[88px] w-full rounded-lg" />
              <Skeleton className="h-[88px] w-full rounded-lg" />
              <Skeleton className="h-[88px] w-full rounded-lg" />
            </div>
          </div>

          <div className="sticky bottom-0 z-10 flex h-[116px] w-full flex-col items-center gap-3 bg-white px-3 py-3 max-lg:mt-auto lg:static lg:col-start-2 lg:row-start-3 lg:-mt-5 lg:h-[170px] lg:rounded-b-lg lg:px-6">
            <Skeleton className="h-12 w-full max-w-[400px] rounded-full" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f1f5fa] min-h-screen w-full flex justify-center items-center sm:px-4 lg:items-start lg:py-8">
      {/* Below lg this stays the original single flex column. From lg it
          becomes the design's two-column layout: the hero spans both, the
          info card sits left, and the plan card + its CTA stack on the right. */}
      {/* lg:items-stretch (not the flex row's items-center) so the two columns
          end at the same height: the left card spans both right-hand rows and
          stretches to the plan card + CTA total. */}
      <div className="w-full sm:h-auto h-screen sm:max-w-[800px] lg:max-w-[1120px] lg:h-auto flex flex-col justify-between items-center gap-0 lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-x-6 lg:gap-y-5">
        <div className="bg-white w-full lg:col-span-2 lg:bg-transparent">
          <div className="flex  w-full gap-4 px-3 py-4 lg:justify-center lg:py-2">
            <button
              type="button"
              onClick={leavePaymentPage}
              className="cursor-pointer sm:hidden "
              aria-label="Go back"
            >
              <ArrowIcon />
            </button>

            <div className="w-full">
              <div className="heading-medium sm:text-center !font-semibold text-surface-gray-normal lg:heading-2xlarge">
                {modalT(paymentHeadlineKey(source), { exam: examTitle })}
              </div>
              <div className="body-small sm:text-center !font-normal text-surface-gray-muted lg:body-large">
                {modalT("subtitle", { exam: examTitle })}
              </div>
            </div>
          </div>
        </div>

        {/* Left: exam identity. The benefits and the green strip below it are
            desktop-only, exactly as the two mocks differ. */}
        {/* Spans both of the right column's rows (plan card + CTA). Without
            `row-span-2` this card alone sizes row 2, and since it is taller
            than the plan card the CTA below was pushed down by the difference
            — a 124 px gap between the plan card and its own CTA. */}
        <div className="w-full flex justify-center px-4 pt-3 pb-3 lg:p-0 lg:col-start-1 lg:row-start-2 lg:row-span-2">
          <div className="max-w-[352px] w-full lg:max-w-none lg:h-full flex flex-col gap-2 lg:gap-6 lg:bg-white lg:p-6 lg:rounded-lg">
            <div className="flex flex-col gap-4">
              <div className="flex flex-row items-center justify-center gap-3 lg:justify-start lg:gap-4">
                <Image
                  src={examLogo}
                  alt={data?.short_name || "Course logo"}
                  width={64}
                  height={64}
                  className="h-[56px] w-[56px] shrink-0 rounded-full object-cover lg:h-[64px] lg:w-[64px]"
                  priority
                />
                <div className="flex min-w-0 flex-col items-start gap-1">
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
                  {/* Mobile: sits beside the logo, under the chips, instead of on its own row. */}
                  <div className="flex items-center gap-1 lg:hidden">
                    <SheildIcon size={16}
                      color="var(--color-surface-gray-subtle)" />
                    <p className="body-small text-surface-gray-subtle">
                      {modalT("all_levels_one_plan")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop-only: what the plan actually gets you. */}
            <div className="hidden lg:flex lg:flex-col lg:gap-4">
              {BENEFITS.map(({ key, Icon }) => (
                <div key={key} className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-subtle)]">
                    <Icon size={20} color="var(--color-brand)" />
                  </span>
                  <span className="min-w-0">
                    <span className="body-large !font-semibold block text-surface-gray-normal">
                      {modalT(`benefits.${key}`)}
                    </span>
                    <span className="body-small !font-normal block text-surface-gray-muted">
                      {modalT(`benefits.${key}Sub`)}
                    </span>
                  </span>
                </div>
              ))}
            </div>

            <div className="hidden lg:flex lg:items-start lg:gap-3 rounded-lg bg-green-50 p-4">
              <SheildIcon size={20} color="var(--color-success)" />
              <span className="min-w-0">
                <span className="body-medium !font-semibold block text-surface-gray-normal">
                  {modalT("everything_included_one_price")}
                </span>
                <span className="body-small !font-normal block text-surface-gray-muted">
                  {modalT("no_hidden_charges")}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: plan picker */}
        <div className="w-full flex justify-center lg:p-0 lg:col-start-2 lg:row-start-2">
          <div className="w-full lg:max-w-none lg:h-full flex flex-col gap-3 lg:gap-5 bg-white p-3 lg:p-6 rounded-none lg:rounded-lg lg:rounded-b-none lg:pb-0">
            <div>
              <p className="heading-large !font-semibold text-surface-gray-normal">
                {modalT("choosePlan")}
              </p>
              <p className="hidden lg:block body-small !font-normal text-surface-gray-muted">
                {modalT("choosePlanSubtitle")}
              </p>
            </div>

            {/* pricing    */}
            {/* The 6-month and 15-month plans were replaced by the 1-year plan;
                their markup is gone rather than left commented out, since it
                was a copy of the old hand-written card that PlanCard replaced. */}
            <div className="flex flex-col gap-2.5 lg:gap-4" role="radiogroup" aria-label={modalT("choosePlan")}>
              {/* 1-month one-time plan */}
              <PlanCard
                durationLabel={modalT("months", { count: 1 })}
                price={`₹${getPriceForVariant("1month-onetime", pricing, data?.short_name)}`}
                strikePrice="₹1,499"
                subtitle={modalT("one_time_no_renewal")}
                selected={selectVariant === "1month-onetime"}
                onSelect={() => handleSelectVariant("1month-onetime")}
              />

              {/* 1-month plan (subscription) */}
              <PlanCard
                durationLabel={modalT("months", { count: 1 })}
                price={`₹${priceFor("1month")}`}
                strikePrice="₹1,499"
                subtitle={modalT("full_access_all_levels")}
                badge={{
                  label: modalT("best_for_new_students"),
                  placement: "ribbon",
                  tone: "info",
                }}
                selected={selectVariant === "1month"}
                onSelect={() => handleSelectVariant("1month")}
              />

              {/* 1-year plan */}
              <PlanCard
                durationLabel={modalT("months", { count: 12 })}
                price={`₹${getPriceForVariant("1year", pricing, data?.short_name)}`}
                subtitle={modalT("best_value_covers_next_exam")}
                badge={{
                  label: modalT("most_popular"),
                  placement: "inline",
                  tone: "warning",
                  iconLeft: <StarIcon />,
                }}
                selected={selectVariant === "1year"}
                onSelect={() => handleSelectVariant("1year")}
              />
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

        {/* Footer. Below lg it stays the pinned bottom bar it has always been
            (`mt-auto` reproduces what `justify-between` did before the grid).
            From lg it becomes the bottom of the plan card: static, in the right
            column, with the negative top margin closing the grid's row gap so
            the two read as one card. */}
        <div className="sticky bottom-0 z-10 px-3 py-2 bg-white w-full max-lg:mt-auto lg:static lg:col-start-2 lg:row-start-3 lg:-mt-5 lg:rounded-b-lg lg:px-6 lg:pb-6">
          <div className="w-full flex flex-col items-center gap-1 lg:gap-4">
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
                  // Price-only CTA: hi/mr read shorter ("₹149 में अनलॉक करें",
                  // CC-66). The shared `cta` also takes an exam name elsewhere.
                  text={modalT("ctaPrice", {
                    price: `₹${selectedPrice}`,
                  })}
                />
              </div>

              {(loading || subscriptionLoading) && (
                <p className="body-small text-surface-gray-muted" aria-live="polite">
                  {checkoutT("opening")}
                </p>
              )}
              {payError && (
                <p className="body-small text-[var(--color-danger)] text-center max-w-[400px]" role="alert">
                  {payError}
                </p>
              )}

              {/* Tappable (C1): it looked like a method picker and students
                  tapped it; it now opens the same checkout as the button. */}
              <button
                type="button"
                onClick={handlePayClick}
                className="flex body-small items-center gap-2 text-surface-gray-muted cursor-pointer"
              >
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
              </button>
              {selectVariant === "1month" && (
                <p className="body-small text-surface-gray-muted -mt-1">{modalT("cancelAnytime")}</p>
              )}
            </div>

            {/* CC-63 (D1, user 2026-10-23): a small text link under the pay
                button instead of a second full-width button. */}
            <div className="w-full max-w-[400px] flex justify-center">
              <button
                type="button"
                onClick={() => {
                  continueFreeTriggerRef.current = "link";
                  setContinueFreeOpen(true);
                }}
                className="body-medium text-surface-gray-muted underline underline-offset-4 py-1 px-3 lg:py-2 cursor-pointer"
              >
                {modalT("continueFree")}
              </button>
            </div>
            <ContinueFreeSheet
              isOpen={continueFreeOpen}
              onAnswer={handleContinueFreeAnswer}
              showOneTimeOption={selectVariant === "1month"}
              onClose={() => {
                // Dismissed: the student stays here (CC-63).
                trackPaymentEvent("Continue Free Clicked", {
                  ...payFunnelProps(),
                  reason: "closed",
                  trigger: continueFreeTriggerRef.current,
                });
                setContinueFreeOpen(false);
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
