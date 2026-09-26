"use client";

import { getPaymentFailureReason } from "@/lib/payment/paymentAnalytics";
import { useInvalidateQuery } from "@/hooks/useInvalidateQuery";
import { MY_COURSES_KEY } from "../course/useMyActiveCourses";
import React from "react";
import { trackEvent } from "@/lib/analytics/browser";
import { trackFacebookEvent } from "@/lib/analytics/facebook-pixel";
import { loadRazorpay } from "@/lib/loadRazorpay";
import {
  createOrder,
  PaymentType,
  pollVerifyPayment,
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
};

export function useRazorpayPayment({
  examId,
  examName,
  price,
  user,
  type,
  onSuccess,
  onFailure,
  onClose,
}: UseRazorpayPaymentProps) {
  const invalidateQuery = useInvalidateQuery(MY_COURSES_KEY);
  const [loading, setLoading] = React.useState(false);
  const { user: authUser } = useAuth();

  const handlePayment = async () => {
    setLoading(true);

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
        alert("Razorpay SDK failed to load");
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

          const success = await sentryApiClient(
            () => pollVerifyPayment(order.transaction_id),
            {
              endpoint: "/verify-payment-polling",
              module: "payment-initiation",
            },
          );

          await invalidateQuery();

          outcomeReported = true;

          if (success) {
            trackEvent("Payment Outcome", {
              outcome: "payment_successful",
              billing_type: "one_time",
              final_price: Number(price),
              payment_session_id: response.razorpay_payment_id,
            });
            trackFacebookEvent("Purchase", {
              value: Number(price),
              currency: "INR",
            });

            onSuccess();
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
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return {
    handlePayment,
    loading,
  };
}
