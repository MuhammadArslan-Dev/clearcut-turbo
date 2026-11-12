"use client";

import { invalidateAfterPayment } from "@/lib/payment/invalidateAfterPayment";
import { getPaymentFailureReason } from "@/lib/payment/paymentAnalytics";
import { useInvalidateQuery } from "@/hooks/useInvalidateQuery";
import { MY_COURSES_KEY } from "../course/useMyActiveCourses";
import { CURRENT_COURSE_QUERY_KEY } from "../course/useGetCurrentCourse";
import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { trackEvent } from "@/lib/analytics/browser";
import { trackFacebookEventOnce, trackFacebookEventWithUserData } from "@/lib/analytics/facebook-pixel";
import { loadRazorpay } from "@/lib/loadRazorpay";
import {
  computeMetaPurchaseValue,
  getMetaPurchasePlan,
} from "@/lib/payment/metaPurchaseConfig";
import {
  createOrder,
  metaContentParams,
  PaymentType,
  pollVerifyPaymentResult,
  type VerifyPollResult,
} from "@/lib/payment/payment";
import {
  checkoutReturnUrl,
  clearAttempt,
  closeAttempt,
  getAttemptStatus,
  isAlreadyPaidError,
  isAutopayActiveError,
  isInAppBrowser,
  markAttemptWaitClosed,
  readAttempt,
  saveAttempt,
} from "@/lib/payment/paymentAttempt";
import { PENDING_GIVE_UP_MS, startPendingWatch } from "@/lib/payment/pendingWatch";
import { useUpiWaiting } from "@/hooks/payment/useUpiWaiting";
import type { UpiWaitingSheetProps } from "@/components/features/payment/UpiWaitingSheet";
import { isUpiWaitingWatchEnabled } from "@/lib/experiments/upiWaitingFlag";
import { useLocale } from "next-intl";
import { inAppBrowserKind, payPlanLabel, trackPaymentEvent } from "@/lib/analytics/paymentFunnel";
import { useAuth } from "@/providers/AuthProvider";
import { sentryApiClient } from "@/lib/sentry/sentry-api-client";
import { logger } from "@sentry/nextjs";

type UseRazorpayPaymentProps = {
  examId: number;
  examName: string;
  price?: string | number;
  type: PaymentType;
  user?: {
    full_name?: string;
    email?: string;
    phone?: string;
  };
  /** `paid` is set when the return check found the payment: the attempt's own amount and source. */
  onSuccess: (paid?: { price?: number; source?: string }) => void;
  onFailure: () => void;
  onClose?: () => void;
  /**
   * Paid (Razorpay called the handler) but the webhook still hadn't marked
   * the order after ~80 s of checking: the course activates a little later.
   * Show that — never "payment failed". Defaults to onSuccess (CC-60).
   */
  onPending?: () => void;
  /**
   * Checkout couldn't be opened (script didn't load, order not created).
   * Defaults to an alert(); pages pass this to show the message in place —
   * alert() is often suppressed in in-app WebViews (CC-60).
   */
  onError?: (reason: "sdk_failed" | "unknown") => void;
  /**
   * Params for the dashboard success/failed page when Razorpay redirects
   * back instead of calling the handler (Facebook/Instagram app browsers,
   * CC-59). Without them those browsers keep the in-page checkout.
   */
  returnParams?: Record<string, string | number | undefined>;
  /** Saved on the order by the backend, e.g. "autopay_fallback" (CC-168). */
  orderSource?: string;
  /** The fallback order was refused because the mandate was approved after all (CC-168). */
  onAutopayActive?: () => void;
  /**
   * Ask about a saved attempt when the page comes back (CC-59). Off when
   * another instance of this hook on the same page already does.
   */
  returnCheck?: boolean;
};

/**
 * Where a one-time payment is (CC-60): `opening` from the tap until the
 * checkout opens, `verifying` while the first ~20 s of webhook checks run
 * after a successful payment, `activating` for the extra ~60 s when the
 * webhook is late. Pages show a full-screen state for the last two, which
 * otherwise looked like nothing happened after paying.
 */
export type RazorpayPaymentPhase = "idle" | "opening" | "verifying" | "activating";

// A page can hold two instances (plan checkout + autopay fallback) sharing one
// saved attempt: a checkout open in EITHER reports through its own handler.
const checkoutsInFlight = new Set<object>();

// First window, then the "activating" window (CC-60): 10 x 2 s + 30 x 2 s.
const VERIFY_RETRIES = 10;
const ACTIVATING_RETRIES = 30;

export function useRazorpayPayment({
  examId,
  examName,
  price,
  user,
  type,
  onSuccess,
  onFailure,
  onClose,
  onPending,
  onError,
  returnParams,
  orderSource,
  onAutopayActive,
  returnCheck = true,
}: UseRazorpayPaymentProps) {
  const locale = useLocale();
  const invalidateQuery = useInvalidateQuery(MY_COURSES_KEY);
  const queryClient = useQueryClient();
  const [loading, setLoading] = React.useState(false);
  const [phase, setPhase] = React.useState<RazorpayPaymentPhase>("idle");
  // Synchronous double-tap guard: `loading` state only disables the button
  // after a re-render, so two quick taps created two orders (CC-60).
  const inFlightRef = React.useRef(false);
  const { user: authUser } = useAuth();
  // CC-70: "approve in your UPI app" sheet after the popup closed with the
  // payment still pending (flag `upi_waiting_watch`, default OFF = never shown).
  const upi = useUpiWaiting();
  // While waiting, this token sits in checkoutsInFlight so the CC-59 return
  // check (same backend question) never reports the same payment a second time.
  const waitTokenRef = React.useRef({});
  // Read by the return check's long-lived listeners (auth may load after mount).
  const uuidRef = React.useRef(authUser?.uuid);
  uuidRef.current = authUser?.uuid;

  // The guard and `loading` stay on for the WHOLE checkout — until the popup
  // is closed, the payment fails, or verification has finished — not just
  // until open() returns. Releasing right after open() let a second tap
  // through while the popup was still appearing on a slow phone, and after
  // a payment (20-80 s of checks) paywalls/modals, which have no
  // "confirming" screen, showed an active button again: a second order,
  // and a second payment (CC-60 follow-up).
  const release = () => {
    inFlightRef.current = false;
    checkoutsInFlight.delete(inFlightRef);
    setLoading(false);
    setPhase("idle");
  };

  const latest = React.useRef({ onSuccess, onFailure, examId });
  latest.current = { onSuccess, onFailure, examId };
  // A payment found paid by asking the backend: the return check, or the UPI
  // wait watch (CC-70). Same steps either way; `via` is the only difference.
  const reportPaidFromAttempt = async (
    status: Awaited<ReturnType<typeof getAttemptStatus>>,
    attempt: NonNullable<ReturnType<typeof readAttempt>>,
    via: "return_check" | "upi_wait_watch",
  ) => {
    clearAttempt();
    const meta = status.meta_purchase;
    if (meta?.send) {
      trackFacebookEventOnce(
        "Purchase",
        {
          value: meta.value,
          currency: meta.currency,
          amount_paid: meta.amount_paid,
          ...(meta.plan ? { plan: meta.plan } : {}),
          ...metaContentParams(meta),
        },
        meta.event_id,
      );
    }
    trackEvent("Payment Outcome", {
      outcome: "payment_successful",
      billing_type: "one_time",
      ...(attempt.transactionUuid ? { transaction_id: attempt.transactionUuid } : {}),
      final_price: Number(meta?.amount_paid ?? 0),
      payment_session_id: String(status.transaction_id ?? attempt.transactionId),
      confirmed_via: via,
      ...(attempt.source ? { source: attempt.source } : {}),
    });
    await invalidateQuery().catch(() => {});
    await queryClient.invalidateQueries({ queryKey: CURRENT_COURSE_QUERY_KEY });
    latest.current.onSuccess({ price: attempt.price, source: attempt.source });
  };

  const endUpiWait = () => {
    checkoutsInFlight.delete(waitTokenRef.current);
    upi.stop();
  };

  // CC-70: keep asking about this attempt behind the waiting sheet.
  const beginUpiWait = (attempt: NonNullable<ReturnType<typeof readAttempt>>, startedAt: number) => {
    checkoutsInFlight.add(waitTokenRef.current);
    let paidStatus: Awaited<ReturnType<typeof getAttemptStatus>> | null = null;
    upi.begin({
      kind: "one_time",
      startedAt,
      check: async () => {
        const status = await getAttemptStatus(attempt.transactionId);
        if (status.state === "paid") {
          paidStatus = status;
          return "paid";
        }
        if (status.state === "failed") {
          clearAttempt();
          checkoutsInFlight.delete(waitTokenRef.current);
          return "failed";
        }
        return "pending";
      },
      onPaid: async () => {
        checkoutsInFlight.delete(waitTokenRef.current);
        if (paidStatus) await reportPaidFromAttempt(paidStatus, attempt, "upi_wait_watch");
      },
    });
  };

  // CC-59: the page came back (reload, back from the UPI app, bfcache) with
  // an attempt from a checkout whose handler never ran. Ask the backend.
  React.useEffect(() => {
    if (!returnCheck) return;
    let checking = false;
    const check = async () => {
      // A checkout open in this page reports through its own handler.
      if (checking || checkoutsInFlight.size > 0 || document.visibilityState === "hidden") return;
      const attempt = latest.current.examId ? readAttempt(latest.current.examId) : null;
      if (!attempt) return;
      checking = true;
      try {
        const status = await getAttemptStatus(attempt.transactionId);
        if (status.state === "paid") {
          await reportPaidFromAttempt(status, attempt, "return_check");
        } else if (status.state === "failed") {
          clearAttempt();
        } else if (
          status.state === "pending" &&
          !attempt.waitClosed &&
          Date.now() - attempt.at < PENDING_GIVE_UP_MS &&
          checkoutsInFlight.size === 0 &&
          (await isUpiWaitingWatchEnabled(uuidRef.current))
        ) {
          // CC-70: back on the page (redirect mode / reload) with the payment
          // still pending: show the waiting sheet and keep checking.
          beginUpiWait(attempt, attempt.at);
        }
      } catch {
        // Offline or a blip: the next visibility change tries again.
      } finally {
        checking = false;
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    void check();
    window.addEventListener("pageshow", check);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("pageshow", check);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, returnCheck]);

  const reportError = (reason: "sdk_failed" | "unknown") => {
    if (onError) onError(reason);
    else alert(reason === "sdk_failed" ? "Razorpay SDK failed to load" : "Something went wrong");
  };

  const startCheckout = async (retryFrom?: "upi_waiting") => {
    if (inFlightRef.current) return;
    // A new checkout replaces any wait on the previous attempt (safe when none).
    endUpiWait();
    inFlightRef.current = true;
    checkoutsInFlight.add(inFlightRef);
    setLoading(true);
    setPhase("opening");
    let checkoutOpened = false;

    // CC-69 funnel properties, sent on the existing payment events.
    const funnelProps = {
      exam: examName,
      plan: payPlanLabel(type, price),
      price: Number(price),
      source: returnParams?.source !== undefined ? String(returnParams.source) : undefined,
      language: locale,
      in_app_browser: inAppBrowserKind(),
    };

    try {
      trackPaymentEvent("Payment Initiated", {
        exam_name: examName,
        payment_flow: "new_attempt",
        final_price: Number(price),
        ...funnelProps,
        ...(retryFrom ? { retry_from: retryFrom } : {}),
      });

      const razorpayLoaded = await sentryApiClient(() => loadRazorpay(), {
        endpoint: "/load-razorpay",
        module: "payment-initiation",
      });
      if (!razorpayLoaded) {
        reportError("sdk_failed");
        return;
      }

      // 1️⃣ Create order
      let order;
      try {
        order = await sentryApiClient(
          () =>
            createOrder({
              payment_type: authUser?.phone === "+919988776655" ? "test" : "live",
              course_id: examId,
              amount: price ?? "",
              type: type,
              ...(orderSource ? { source: orderSource } : {}),
            }),
          {
            endpoint: "/create-order",
            module: "payment-initiation",
          },
        );
      } catch (error) {
        if (onAutopayActive && isAutopayActiveError(error)) {
          onAutopayActive();
          return;
        }
        // Paid a moment ago (a second tap, or the page came back after the
        // webhook activated it): never open a second checkout (CC-71).
        if (isAlreadyPaidError(error)) {
          clearAttempt();
          await invalidateQuery().catch(() => {});
          await queryClient.invalidateQueries({ queryKey: CURRENT_COURSE_QUERY_KEY });
          onSuccess();
          return;
        }
        throw error;
      }
      // CC-173: the order's public id, named on the one-time events below and kept with the saved attempt.
      const txProps = order.transaction_uuid ? { transaction_id: order.transaction_uuid } : {};
      saveAttempt({
        transactionId: order.transaction_id,
        transactionUuid: order.transaction_uuid,
        examId,
        price: Number(price),
        ...(orderSource ? { source: orderSource } : {}),
      });
      // Inside the Facebook/Instagram app the page often dies while the UPI
      // app is open; Razorpay then sends the student back through the
      // backend instead of calling `handler` (CC-59).
      const redirectMode = Boolean(returnParams) && isInAppBrowser();

      // 2️⃣ Razorpay options
      // One Payment Outcome per checkout session: set as soon as a success or a
      // failure has been reported, so closing the popup afterwards is not ALSO
      // reported as a cancellation.
      let outcomeReported = false;
      // CC-70: stops the UPI wait watch (flag-gated, below).
      let stopWatch: (() => void) | null = null;
      // CC-70: the flag's answer, so a dismissed popup can open the waiting sheet.
      let watchOn = false;

      const options = {
        key: order.key,
        amount: order.order.amount,
        currency: "INR",
        name: "Clear Cutoff",
        order_id: order.order.id,
        ...(redirectMode
          ? {
              callback_url: checkoutReturnUrl({ ...returnParams, lang: locale === "en" ? undefined : locale }),
              redirect: true,
            }
          : {}),

        handler: async (response: any) => {
          stopWatch?.();
          if (outcomeReported) return; // the wait watch already confirmed this payment
          clearAttempt();
          onClose?.();
          setPhase("verifying");

          let verified: VerifyPollResult;
          try {
            verified = await sentryApiClient(
              () => pollVerifyPaymentResult(order.transaction_id, VERIFY_RETRIES),
              {
                endpoint: "/verify-payment-polling",
                module: "payment-initiation",
              },
            );
            // Webhook late: keep checking for ~60 s more behind an
            // "activating your course" screen instead of giving up.
            if ("pending" in verified) {
              setPhase("activating");
              verified = await sentryApiClient(
                () => pollVerifyPaymentResult(order.transaction_id, ACTIVATING_RETRIES),
                {
                  endpoint: "/verify-payment-polling",
                  module: "payment-initiation",
                },
              );
            }
          } catch (error) {
            // An unexpected answer (404, a bug) used to leave the student on
            // "Confirming your payment…" for ever. Razorpay only calls this
            // handler after the payment went through, so treat it as paid
            // but not yet activated.
            logger.error("Payment verification failed unexpectedly", {
              tags: { module: "payment", type: "verify_unexpected" },
              extra: { examId, examName, transaction_id: order.transaction_id, error: String(error) },
            });
            verified = { success: false, pending: true };
          }
          const success = verified.success;

          await invalidateQuery().catch(() => {});
          // Phase 77: every cached course/lock state is stale once a payment went through.
          await invalidateAfterPayment(queryClient);
          // The page's current-course query feeds the course store that
          // PaywallFloatingWidget reads. Refresh it here so the widget hides
          // as soon as the course is active, instead of after its 15-min staleTime.
          if (success) {
            await queryClient.invalidateQueries({
              queryKey: CURRENT_COURSE_QUERY_KEY,
            });
          }

          outcomeReported = true;

          if (success) {
            trackPaymentEvent("Payment Outcome", {
              outcome: "payment_successful",
              billing_type: "one_time",
              ...txProps,
              final_price: Number(price),
              payment_session_id: response.razorpay_payment_id,
              ...funnelProps,
            });
            // Purchase can fire from paywall modals (MainPaywall,
            // PreparationPaywall, full-course-payment-modal) that never
            // visit /payment/initiated, so there's no earlier page-level
            // init() to inherit advanced-matching data from — this call has
            // to set it itself.
            //
            // amount_paid is the real, final charged amount (never a list
            // price — `price` here is always what Razorpay actually billed).
            // `value` applies the configurable multiplier from
            // metaPurchaseConfig.ts (ONE_TIME_VALUE_MULTIPLIER = 1.0 for
            // every `type` this hook is ever actually called with — `type`
            // is only ever "1month" for the SUBSCRIPTION_VALUE_MULTIPLIER
            // branch, and "1month" always goes through
            // payment/initiated/page.tsx's handleSubscriptionPayment
            // instead, never this hook — kept here anyway so the helper
            // stays correct if that ever changes). `plan` is omitted
            // (not guessed) for callers that don't pass `type` at all
            // (the single-course purchase modals).
            //
            // CC-53: the backend decides (verify's `meta_purchase`): Purchase
            // only for the user's FIRST payment on this course (buying the
            // same course again is a renewal), with the amount actually
            // charged (after any referral discount) and the server-side
            // multiplier. A backend from before that falls back to the
            // client-side values below.
            const meta = verified.success ? verified.metaPurchase : undefined;
            if (meta) {
              if (meta.send) {
                trackFacebookEventOnce(
                  "Purchase",
                  {
                    value: meta.value,
                    currency: meta.currency,
                    amount_paid: meta.amount_paid,
                    ...(meta.plan ? { plan: meta.plan } : {}),
                    ...metaContentParams(meta),
                  },
                  meta.event_id,
                );
              }
            } else {
              const amountPaid = Number(price);
              const plan = getMetaPurchasePlan(type);
              trackFacebookEventWithUserData("Purchase", {
                value: computeMetaPurchaseValue(amountPaid, type),
                currency: "INR",
                amount_paid: amountPaid,
                ...(plan ? { plan } : {}),
              });
            }

            onSuccess();
          } else if ("pending" in verified) {
            // Paid, webhook still not in: the course activates shortly. Not
            // a failure (Razorpay only calls this handler after payment);
            // the "failed" page here made people pay a second time.
            logger.warn("Payment verification still pending after polling", {
              tags: { module: "payment" },
              extra: { examId, examName, price, type, transaction_id: order.transaction_id },
            });
            (onPending ?? onSuccess)();
          } else {
            trackEvent("Payment Outcome", {
              outcome: "payment_failed",
              billing_type: "one_time",
              ...txProps,
              final_price: Number(price),
              failure_reason: "verification_failed",
              payment_session_id: response.razorpay_payment_id,
            });
            logger.error("Payment failed", {
              tags: { module: "payment" },
              extra: { examId, examName, price, type },
            });
            onFailure();
          }
          release();
        },

        prefill: {
          name: user?.full_name ? user.full_name : (authUser?.full_name ?? ""),
          email: user?.email ?? authUser?.email
            ? (user?.email ?? authUser?.email)
            : `${String(user?.phone ?? authUser?.phone ?? "").replace(/\D/g, "").slice(-10)}@pay.clearcutoff.in`,
          contact: String(user?.phone ?? authUser?.phone ?? "")
            .replace(/\D/g, "")
            .slice(-10),
        },
        readonly: { email: true },

        theme: { color: "#0083ff" },

        // Popup closed by the user. Razorpay fires NO payment.failed for this, so
        // without this handler a cancelled checkout was never reported at all.
        modal: {
          ondismiss: () => {
            stopWatch?.();
            // Closed without paying: the button works again.
            if (!outcomeReported) release();
            if (outcomeReported) return;
            outcomeReported = true;
            // The saved attempt stays: a UPI payment started before closing
            // can still complete, and the return check then finds it.
            void closeAttempt(order.transaction_id).catch(() => {});
            // CC-70: show what is happening and keep checking (a closed attempt
            // still activates if the UPI payment comes in, CC-169).
            const saved = readAttempt(examId);
            if (watchOn && saved) beginUpiWait(saved, Date.now());

            trackPaymentEvent("Payment Outcome", {
              outcome: "payment_failed",
              billing_type: "one_time",
              ...txProps,
              final_price: Number(price),
              exam_name: examName,
              failure_reason: "cancelled",
              payment_session_id: order.order.id,
              ...funnelProps,
            });
          },
        },
      };

      const razorpay = new (window as any).Razorpay(options);

      razorpay.on("payment.failed", (errorResponse: {
        error: {
          reason: string;
          description: string;
          code: string;
          metadata?: { payment_id?: string };
        };
      }) => {
        const { error } = errorResponse;

        stopWatch?.();
        outcomeReported = true;
        clearAttempt();

        trackPaymentEvent("Payment Outcome", {
          outcome: "payment_failed",
          billing_type: "one_time",
              ...txProps,
          final_price: Number(price),
          exam_name: examName,
          failure_reason: getPaymentFailureReason(error),
          payment_session_id: error.metadata?.payment_id ?? "",
          error_code: error?.code,
          error_reason: error?.reason,
          ...funnelProps,
        });

        logger.error("Payment failed", {
          tags: { module: "payment" },
          extra: { examId, examName, price, type },
        });

        release();
        onFailure();
      });

      razorpay.open();
      checkoutOpened = true;
      setPhase("idle");

      // CC-70: while the student approves in the UPI app the page used to learn
      // nothing until Razorpay called back. With the flag on, ask the backend
      // every few seconds and finish as soon as the payment is paid.
      void isUpiWaitingWatchEnabled(authUser?.uuid)
        .then((on) => {
          if (!on || outcomeReported) return;
          watchOn = true;
          stopWatch = startPendingWatch({
            check: async () => {
              if (outcomeReported) return true;
              const status = await getAttemptStatus(order.transaction_id);
              if (status.state === "failed") return true;
              if (status.state !== "paid") return false;
              outcomeReported = true;
              const attempt = readAttempt(examId) ?? {
                transactionId: order.transaction_id,
                transactionUuid: order.transaction_uuid,
                examId,
                at: Date.now(),
                price: Number(price),
                ...(orderSource ? { source: orderSource } : {}),
              };
              try {
                (razorpay as { close?: () => void }).close?.();
              } catch {
                // The popup was already gone.
              }
              await reportPaidFromAttempt(status, attempt, "upi_wait_watch");
              release();
              return true;
            },
          });
        })
        .catch(() => {});
      trackPaymentEvent("Checkout Opened", { billing_type: "one_time", ...txProps, ...funnelProps });
    } catch (error) {
      console.error(error);
      reportError("unknown");
    } finally {
      // Not opened (script, order or Razorpay itself failed): free the
      // button now. Once opened, the popup's callbacks above release it.
      if (!checkoutOpened) release();
    }
  };

  const handlePayment = () => startCheckout();

  // Rendered by each caller: <UpiWaitingSheet {...upiWaiting} />. Closed (and
  // never opened) while the flag is off.
  const upiWaiting: UpiWaitingSheetProps = {
    isOpen: upi.isWaiting,
    kind: "one_time",
    startedAt: upi.waiting?.startedAt ?? 0,
    slow: upi.waiting?.slow ?? false,
    gaveUp: upi.waiting?.gaveUp ?? false,
    onRetry: () => {
      endUpiWait();
      void startCheckout("upi_waiting");
    },
    onClose: () => {
      markAttemptWaitClosed();
      endUpiWait();
    },
  };

  return {
    handlePayment,
    loading,
    phase,
    upiWaiting,
  };
}
