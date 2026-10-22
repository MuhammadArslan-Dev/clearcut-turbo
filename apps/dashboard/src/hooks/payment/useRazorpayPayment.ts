"use client";

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
  PaymentType,
  pollVerifyPaymentResult,
} from "@/lib/payment/payment";
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
  onSuccess: () => void;
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
};

/**
 * Where a one-time payment is (CC-60): `opening` from the tap until the
 * checkout opens, `verifying` while the first ~20 s of webhook checks run
 * after a successful payment, `activating` for the extra ~60 s when the
 * webhook is late. Pages show a full-screen state for the last two, which
 * otherwise looked like nothing happened after paying.
 */
export type RazorpayPaymentPhase = "idle" | "opening" | "verifying" | "activating";

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
}: UseRazorpayPaymentProps) {
  const invalidateQuery = useInvalidateQuery(MY_COURSES_KEY);
  const queryClient = useQueryClient();
  const [loading, setLoading] = React.useState(false);
  const [phase, setPhase] = React.useState<RazorpayPaymentPhase>("idle");
  // Synchronous double-tap guard: `loading` state only disables the button
  // after a re-render, so two quick taps created two orders (CC-60).
  const inFlightRef = React.useRef(false);
  const { user: authUser } = useAuth();

  const reportError = (reason: "sdk_failed" | "unknown") => {
    if (onError) onError(reason);
    else alert(reason === "sdk_failed" ? "Razorpay SDK failed to load" : "Something went wrong");
  };

  const handlePayment = async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    setPhase("opening");

    try {
      await trackEvent("Payment Initiated", {
        exam_name: examName,
        payment_flow: "new_attempt",
        final_price: Number(price),
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
      const order = await sentryApiClient(
        () =>
          createOrder({
            payment_type: authUser?.phone === "+919988776655" ? "test" : "live",
            course_id: examId,
            amount: price ?? "",
            type: type,
          }),
        {
          endpoint: "/create-order",
          module: "payment-initiation",
        },
      );

      // 2️⃣ Razorpay options
      // One Payment Outcome per checkout session: set as soon as a success or a
      // failure has been reported, so closing the popup afterwards is not ALSO
      // reported as a cancellation.
      let outcomeReported = false;

      const options = {
        key: order.key,
        amount: order.order.amount,
        currency: "INR",
        name: "Clear Cutoff",
        order_id: order.order.id,

        handler: async (response: any) => {
          onClose?.();
          setPhase("verifying");

          let verified = await sentryApiClient(
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
          const success = verified.success;

          await invalidateQuery();
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
            trackEvent("Payment Outcome", {
              outcome: "payment_successful",
              billing_type: "one_time",
              final_price: Number(price),
              payment_session_id: response.razorpay_payment_id,
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
            if (outcomeReported) return;
            outcomeReported = true;

            trackEvent("Payment Outcome", {
              outcome: "payment_failed",
              billing_type: "one_time",
              final_price: Number(price),
              exam_name: examName,
              failure_reason: "cancelled",
              payment_session_id: order.order.id,
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

        outcomeReported = true;

        trackEvent("Payment Outcome", {
          outcome: "payment_failed",
          billing_type: "one_time",
          final_price: Number(price),
          exam_name: examName,
          failure_reason: getPaymentFailureReason(error),
          payment_session_id: error.metadata?.payment_id ?? "",
        });

        logger.error("Payment failed", {
          tags: { module: "payment" },
          extra: { examId, examName, price, type },
        });

        onFailure();
      });

      razorpay.open();
    } catch (error) {
      console.error(error);
      setPhase("idle");
      reportError("unknown");
    } finally {
      setLoading(false);
      inFlightRef.current = false;
      // The checkout is open now (or failed to open); `verifying` /
      // `activating` are set by the handler once a payment completes.
      setPhase((current) => (current === "opening" ? "idle" : current));
    }
  };

  return {
    handlePayment,
    loading,
    phase,
  };
}
