"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { BottomSheet } from "@/components/features/Sheets/BottomSheet";
import { Modal } from "@/components/features/Sheets/Modal";
import ShimmerButton from "@/components/ui/button/shimmer-button";
import DotsLoader from "@/components/ui/loader/DotsLoader";
import { CrossIcon } from "@/components/ui/icons";
import { useIsMobile } from "@/hooks/useIsMobile";

export type UpiWaitingKind = "one_time" | "autopay";

export type UpiWaitingSheetProps = {
  isOpen: boolean;
  kind: UpiWaitingKind;
  /** ms epoch the wait started (the running timer counts from here). */
  startedAt: number;
  /** 2 minutes without approval: the options are shown. */
  slow: boolean;
  /** 15 minutes: checking stopped. */
  gaveUp: boolean;
  /** Opens a new checkout (Razorpay lists every UPI app and the QR there too). */
  onRetry: () => void;
  /** Autopay only: switch to the one-time plan. Hidden when not given. */
  onPayOnce?: () => void;
  onClose: () => void;
};

/**
 * CC-70 (phase 88): shown when the Razorpay popup has closed (or the page came
 * back) while a UPI payment / autopay mandate is still pending. Built like
 * AutopayFallbackSheet (BottomSheet on phones, Modal on desktop). Closed is
 * always one tap away; the options appear after 2 minutes.
 */
export default function UpiWaitingSheet({
  isOpen,
  kind,
  startedAt,
  slow,
  gaveUp,
  onRetry,
  onPayOnce,
  onClose,
}: UpiWaitingSheetProps) {
  const t = useTranslations("payment.upiWaiting");
  const isMobile = useIsMobile();
  const Container = useMemo(() => (isMobile ? BottomSheet : Modal), [isMobile]);
  const showOptions = slow || gaveUp;

  return (
    <AnimatePresence>
      {isOpen && (
        <Container isHeader={false} isOpen={isOpen} onClose={onClose}>
          <div className="p-4 flex flex-col gap-6" role="dialog" aria-labelledby="upi-waiting-title">
            <div className="flex justify-between items-start gap-4">
              <div className="flex flex-col gap-1">
                <h6 id="upi-waiting-title" className="heading-medium !font-semibold">
                  {gaveUp ? t("gaveUpTitle") : kind === "autopay" ? t("titleAutopay") : t("title")}
                </h6>
                <p className="body-small text-surface-gray-muted">
                  {gaveUp ? t("gaveUpBody") : t("body")}
                </p>
              </div>
              <button className="cursor-pointer" onClick={onClose} aria-label={t("close")}>
                <CrossIcon />
              </button>
            </div>

            {!gaveUp && (
              <div className="flex flex-col items-center gap-2" aria-live="polite">
                <DotsLoader size={48} color="var(--color-brand)" />
                <WaitingClock startedAt={startedAt} />
                <p className="body-medium !font-semibold text-center">{t("dontClose")}</p>
              </div>
            )}

            {showOptions && (
              <div className="flex flex-col items-stretch gap-3">
                {!gaveUp && <p className="body-small text-surface-gray-muted text-center">{t("slowHint")}</p>}
                <ShimmerButton onClick={onRetry} size="lg" text={t("tryAgain")} />
                <button
                  type="button"
                  onClick={onRetry}
                  className="body-medium !font-semibold text-brand border border-brand rounded-full py-3 cursor-pointer"
                >
                  {t("otherApp")}
                </button>
                {kind === "autopay" && onPayOnce && (
                  <button
                    type="button"
                    onClick={onPayOnce}
                    className="body-medium !font-semibold text-brand border border-brand rounded-full py-3 cursor-pointer"
                  >
                    {t("payOnce")}
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="body-medium text-surface-gray-muted underline underline-offset-4 py-2 cursor-pointer self-center"
            >
              {t("close")}
            </button>
          </div>
        </Container>
      )}
    </AnimatePresence>
  );
}

/** Per-second leaf (DEVELOPMENT_RULES 2.3): only this re-renders every second. */
function WaitingClock({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const seconds = Math.max(0, Math.floor((now - startedAt) / 1000));
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return (
    <p className="heading-medium !font-semibold tabular-nums" aria-label={`${mm}:${ss}`}>
      {mm}:{ss}
    </p>
  );
}
