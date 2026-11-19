"use client";

// Phase 120: the resend row of the /start OTP step + the A/B test of the paper-airplane wait. Mounted ONLY while the OTP step is
// open, so the GrowthBook exposure (`$exposure`) is sent when the learner actually sees the OTP screen (DEVELOPMENT_RULES §10A.9).
// Control (and every failure path) = today's resend row, same markup; "airplane" = a progress ring + the plane. The send, resend and
// verify logic stays in StartAuthForm: this component only shows the countdown it is given and reports what the learner did.
import { useEffect, useRef, useState } from "react";
import { getBrowserExpId } from "@clearcut/experiments/id";
import { getExperiments, useExperimentValue } from "@/lib/experiments";
import { logAmplitudeEvent } from "@/services/analytics";
import styles from "./start.module.css";
import OtpAirplane from "./OtpAirplane";
import {
  OTP_AIRPLANE_CONTROL,
  OTP_AIRPLANE_FLAG,
  buildExperimentProps,
  isAirplaneValue,
  type OtpExperimentProps,
} from "./otpAirplaneValue";

const RING_LENGTH = 44; // circumference of r=7

export default function OtpWaitExtras({
  hint,
  resendLabel,
  resendingLabel,
  resendTimer,
  resendInterval,
  resendingOtp,
  error,
  loading,
  nextResendCount,
  onResend,
  onExperiment,
  onVariant,
  onSlow,
  getMascot,
  getTarget,
}: {
  hint: string;
  resendLabel: string;
  resendingLabel: string;
  resendTimer: number;
  resendInterval: number;
  resendingOtp: boolean;
  error: string;
  loading: boolean;
  /** `resend_count` the next successful resend will have (1, 2, 3...). */
  nextResendCount: number;
  onResend: () => void;
  /** Tells the form which experiment properties to put on its funnel events (null = not in the experiment). */
  onExperiment: (props: OtpExperimentProps | null) => void;
  /** The variant is on: the form adds the empty "lane" above the OTP boxes where the plane circles. */
  onVariant: (on: boolean) => void;
  /** The wait is taking longer than usual: the form lets Nibbu say so. */
  onSlow: () => void;
  getMascot: () => HTMLElement | null;
  getTarget: () => HTMLElement | null;
}) {
  const { value, ready } = useExperimentValue<string>(OTP_AIRPLANE_FLAG, OTP_AIRPLANE_CONTROL);
  const airplane = ready && isAirplaneValue(value);
  useEffect(() => {
    onVariant(airplane);
    return () => onVariant(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [airplane]);

  // Is this learner really IN the experiment (an experiment rule, not a force rule / flag off)? Only those get tagged events.
  const expRef = useRef<OtpExperimentProps | null>(null);
  useEffect(() => {
    if (!ready) return;
    let props: OtpExperimentProps | null = null;
    try {
      const inExperiment = getExperiments()?.gb.evalFeature(OTP_AIRPLANE_FLAG).source === "experiment";
      props = buildExperimentProps({ inExperiment, value, experimentId: getBrowserExpId() });
    } catch {
      props = null;
    }
    expRef.current = props;
    onExperiment(props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, value]);
  useEffect(() => () => onExperiment(null), []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Plane: launch on every send (mount = the first OTP, then each successful resend); fly home when the countdown ends.
  const [launchKey, setLaunchKey] = useState(0);
  const prevResending = useRef(resendingOtp);
  useEffect(() => {
    const was = prevResending.current;
    prevResending.current = resendingOtp;
    if (was && !resendingOtp && !error) setLaunchKey((k) => k + 1);
  }, [resendingOtp, error]);

  // --- Measurement, both variants (so the comparison is fair): the countdown reached 0, and the learner pressed Resend.
  const timerStartedAt = useRef(Date.now());
  const prevTimer = useRef(resendTimer);
  useEffect(() => {
    const prev = prevTimer.current;
    prevTimer.current = resendTimer;
    if (resendTimer >= resendInterval && prev < resendInterval) timerStartedAt.current = Date.now();
    if (prev > 0 && resendTimer === 0) {
      logAmplitudeEvent("Resend Enabled", {
        ...expRef.current,
        resend_count: nextResendCount - 1,
        seconds_waited: Math.round((Date.now() - timerStartedAt.current) / 1000),
      });
    }
  }, [resendTimer, resendInterval, nextResendCount]);

  const ready0 = resendTimer <= 0;

  // Variant only: "slow network" a third of the way through the countdown (prototype), and the countdown in the tab title.
  const elapsed = resendInterval - resendTimer;
  const slow = airplane && !ready0 && elapsed >= Math.round(resendInterval / 3);
  const slowSaid = useRef(false);
  useEffect(() => {
    if (!airplane) return;
    if (slow && !slowSaid.current) {
      slowSaid.current = true;
      onSlow();
    }
    if (resendTimer >= resendInterval) slowSaid.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [airplane, slow, resendTimer]);
  const baseTitle = useRef<string | null>(null);
  useEffect(() => {
    if (!airplane) return;
    if (baseTitle.current === null) baseTitle.current = document.title;
    document.title = resendTimer > 0 ? `(${`0:${String(resendTimer).padStart(2, "0")}`}) ${baseTitle.current}` : baseTitle.current;
  }, [airplane, resendTimer]);
  useEffect(
    () => () => {
      if (baseTitle.current !== null) document.title = baseTitle.current;
    },
    [],
  );
  const click = () => {
    logAmplitudeEvent("Resend Clicked", { ...expRef.current, resend_count: nextResendCount });
    onResend();
  };
  const seconds = `0:${String(resendTimer).padStart(2, "0")}`;

  return (
    <>
      <div className={styles.resend} data-airplane={airplane ? "true" : undefined} data-ready={airplane && ready0 ? "true" : undefined}>
        <span className={styles.resendHint}>{hint}</span>
        {resendingOtp ? (
          <span className={styles.count}>{resendingLabel}</span>
        ) : (
          <button
            type="button"
            className={airplane ? `${styles.linkbtn} ${styles.rbtn}` : styles.linkbtn}
            data-ready={airplane && ready0 ? "true" : undefined}
            onClick={click}
            disabled={resendTimer > 0 || loading}
            // Until GrowthBook has answered (milliseconds with a cached answer) the row keeps its space but is not drawn, so nobody sees
            // control change into the variant.
            style={ready ? undefined : { visibility: "hidden" }}
          >
            {airplane && (
              <svg className={styles.ring} viewBox="0 0 20 20" aria-hidden="true">
                <circle className={styles.ringBg} cx="10" cy="10" r="7" />
                <circle
                  className={styles.ringFg}
                  cx="10"
                  cy="10"
                  r="7"
                  style={{ strokeDashoffset: ready0 ? 0 : RING_LENGTH * (1 - resendTimer / resendInterval) }}
                />
              </svg>
            )}
            {resendTimer > 0 ? (
              <>
                {resendLabel} <span className={styles.count}>{seconds}</span>
              </>
            ) : (
              resendLabel
            )}
          </button>
        )}
      </div>
      {airplane && <OtpAirplane getMascot={getMascot} getTarget={getTarget} launchKey={launchKey} returning={ready0} slow={slow} />}
    </>
  );
}
