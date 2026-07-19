"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Text from "@clearcut/ui/text";
import Button from "@clearcut/ui/button";
import MainInput from "@clearcut/ui/main-input";
import { AnimatePresence, motion } from "framer-motion";

import WhatsappIcon from "../icons/whatsapp-icon";
import FireIcon from "../icons/fire-icon";
import { useWebOtpAutofill } from "../use-web-otp-autofill";
import { setToken } from "../token";
import { buildPostVerifyRedirectUrl } from "../redirect";
import {
  INDIAN_MOBILE_REGEX as PHONE_REGEX,
  INDIAN_MOBILE_FIRST_DIGIT_REGEX as FIRST_DIGIT_REGEX,
} from "../validators";
import type { AuthApi } from "../api";

const OTP_LENGTH = 4;

export type InlineAuthFlowSubmitButton = React.ComponentType<{
  showIcon?: boolean;
  fullWidth?: boolean;
  text?: string;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}>;

function DefaultSubmitButton({
  text,
  disabled,
  loading,
  fullWidth,
  onClick,
}: {
  showIcon?: boolean;
  fullWidth?: boolean;
  text?: string;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}) {
  return (
    <Button fullWidth={fullWidth} disabled={disabled} loading={loading} onClick={onClick}>
      {text}
    </Button>
  );
}

export interface CreateInlineAuthFlowOptions {
  authApi: AuthApi;
  redirectBaseUrl: string;
  onEvent?: (name: string, properties?: Record<string, unknown>) => void;
}

/**
 * Reusable "collect phone number, verify via OTP, create course enrollment,
 * redirect" widget — extracted from the auth-specific portion of
 * apps/landing's former onboarding result-step.tsx. The surrounding
 * quiz-score display (ScoreCircle, quiz messaging) is NOT part of this —
 * that's onboarding-quiz domain logic, not authentication, so it stays in
 * the app and composes this widget instead.
 *
 * Note the original file never used the shared useAuthStore/useAuthModal —
 * it had its own fully independent local state — so this widget is
 * self-contained and doesn't participate in the modal login flow's state
 * at all, matching original behavior.
 */
export function createInlineAuthFlow({ authApi, redirectBaseUrl, onEvent }: CreateInlineAuthFlowOptions) {
  function InlineAuthFlow({
    courseName,
    SubmitButton = DefaultSubmitButton,
  }: {
    courseName?: string;
    SubmitButton?: InlineAuthFlowSubmitButton;
  }) {
    const [phone, setPhone] = useState("");
    const [isNewUser, setIsNewUser] = useState(false);
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isValidPhone, setIsValidPhone] = useState(false);
    const [autoSubmitted, setAutoSubmitted] = useState(false);
    const [disabled, setDisabled] = useState(true);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<"input" | "otp">("input");
    const [timer, setTimer] = useState(30);
    const [canResend, setCanResend] = useState(false);
    const isVerifyingRef = useRef(false);

    useEffect(() => {
      onEvent?.("Authentication Options Viewed", {
        initial_intent: "login",
        options_available: "phone",
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const validatePhone = (value: string) => {
      const cleaned = value.replace(/\D/g, "");
      setPhone(cleaned);
      setAutoSubmitted(false);
      if (!cleaned.length) { setError(""); setSuccess(""); setIsValidPhone(false); return; }
      if (cleaned.length === 1 && !FIRST_DIGIT_REGEX.test(cleaned)) { setError("Indian number must start with 6, 7, 8, or 9"); setIsValidPhone(false); return; }
      if (cleaned.length < 10) { setError("Enter valid 10-digit mobile number"); setIsValidPhone(false); return; }
      if (cleaned.length > 10) { setError("Mobile number cannot exceed 10 digits"); setIsValidPhone(false); return; }
      if (PHONE_REGEX.test(cleaned)) { setSuccess("Valid Indian mobile number"); setError(""); setIsValidPhone(true); return; }
      setError("Invalid mobile number");
      setIsValidPhone(false);
    };

    useEffect(() => {
      if (isValidPhone && phone.length === 10 && !autoSubmitted) {
        setAutoSubmitted(true);
        setTimeout(() => handleLogin(), 100);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isValidPhone, phone]);

    const handleLogin = async (phoneValue?: string) => {
      const number = phoneValue ?? phone;
      if (!PHONE_REGEX.test(number)) { setError("Enter valid phone number"); return; }
      setError(""); setSuccess(""); setLoading(true); setDisabled(false);
      try {
        const res = await authApi.loginUser({ phone: number });
        const { message, status } = res?.data;
        setIsNewUser(res?.data?.data?.is_new_user || false);
        if (status !== "success") { setError(message); return; }
        await onEvent?.("Verification Sent", { phone: number, source: "onboading_steps", verification_method: "Number", verification_mode: "SMS", verification_purpose: "Login" });
        await authApi.createCourse({ phone: number, course_name: courseName!.toLowerCase() ?? "htet" });
        setSuccess(message); setLoading(false); setDisabled(true);
        setStep("otp"); startTimer();
      } catch {
        setLoading(false); setDisabled(true); setError("Login failed");
      }
    };

    const startTimer = () => { setTimer(30); setCanResend(false); };

    useEffect(() => {
      if (step !== "otp") return;
      if (timer <= 0) { setCanResend(true); return; }
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }, [timer, step]);

    const handleResend = async () => { if (!canResend) return; await handleLogin(phone); startTimer(); };
    const handleEdit = () => { setStep("input"); setError(""); setSuccess(""); };

    const handleVerify = async (autoOtp?: string) => {
      if (isVerifyingRef.current) return;
      const finalOtp = autoOtp || otp;
      if (!finalOtp || finalOtp.length !== OTP_LENGTH) { setError("Enter valid OTP"); return; }
      isVerifyingRef.current = true;
      setError(""); setLoading(true); setDisabled(false);
      try {
        const lang = localStorage.getItem("locale") || "";
        const course = localStorage.getItem("course");
        const res = await authApi.verifyOtp({ phone, otp: finalOtp });
        const { data, status } = res.data;
        if (status !== "success") throw new Error("Verification failed");
        setToken(data.token);
        const redirectUrl = buildPostVerifyRedirectUrl({
          baseUrl: redirectBaseUrl,
          token: data.token,
          hasCourse: data.has_course,
          userType: isNewUser ? "new" : "old",
          lang,
          course,
        });
        setLoading(true); setDisabled(false);
        window.location.replace(redirectUrl);
      } catch (err) {
        console.error(err);
        setError("Invalid OTP");
      } finally {
        setLoading(true); setDisabled(false); isVerifyingRef.current = false;
      }
    };

    useWebOtpAutofill((code) => {
      setOtp(code);
      handleVerify(code);
    }, true);

    return (
      <>
        <AnimatePresence mode="wait">
          {step === "input" && (
            <motion.div key="input" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }} className="flex flex-col gap-5 px-6">
              <div className="space-y-2">
                <div className="flex gap-3 items-center">
                  <Image src="/images/indian-flage.webp" alt="" width={24} height={24} priority unoptimized />
                  <p className="body-small font-semibold text-gray-500">Mobile or WhatsApp Number</p>
                </div>
                <div className="flex gap-2">
                  <div className="w-full flex items-center gap-2">
                    <div className="h-[48px] w-[85px] px-4 flex gap-1 items-center justify-center bg-[#6c849d]/12">
                      <WhatsappIcon color="var(--color-text-gray-subtle)" size={24} />
                      <p className="body-large">+91</p>
                    </div>
                    <div className="max-w-[300px] h-[48px]">
                      <MainInput value={phone} placeholder="10 digit number" inputType="phone" error={error} maxLength={10} className="h-full sm:max-w-[300px] sm:min-w-[300px]" inputClassName="body-large !font-semibold text-[var(--color-text-gray-normal)]" onChange={(e) => validatePhone(e.target.value)} />
                    </div>
                  </div>
                </div>
                {(error || success) && <p className={`text-sm ${error ? "text-red-500" : "text-green-500"}`}>{error || success}</p>}
                <Text as="p" variant="body-small" color="gray-muted" className="text-center">
                  <em>Used only for login &amp; exam updates. No spam. OTP will be sent via SMS &amp; WhatsApp.</em>
                </Text>
                <div className="w-full justify-center">
                  <SubmitButton showIcon={false} fullWidth text="Get my selection plan" disabled={disabled} loading={loading} onClick={() => {}} />
                </div>
              </div>
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div key="otp" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }} className="flex flex-col gap-5 px-6 items-center text-center">
              <Text variant="heading-medium" weight="semibold">Verify your number</Text>
              <Text as="p" variant="body-small" color="gray-muted">
                OTP sent to +91 {phone}{" "}
                <span className="text-blue-600 text-sm underline cursor-pointer" onClick={handleEdit}>edit</span>
              </Text>
              <div className="w-[240px]">
                <p className="body-small !font-semibold text-[var(--color-text-gray-subtle)] mb-1">4-digit OTP</p>
                <div className="w-full">
                  <MainInput error={error} showError={false} value={otp} placeholder="4 digit OTP" onChange={(e) => { const val = e.target.value.replace(/\D/g, ""); setOtp(val); if (val.length === OTP_LENGTH) handleVerify(val); }} inputType="phone" maxLength={4} className="w-full" />
                </div>
                {error && <p className={`text-sm w-full text-left max-w-[335px] ${error ? "text-red-600" : "text-green-600"}`}>{error}</p>}
                <Text as="p" variant="body-small" color="gray-muted" className="text-center mt-2">
                  <em>Sent via SMS and WhatsApp</em>
                </Text>
              </div>
              <div className="text-sm">
                {canResend ? (
                  <button onClick={handleResend} className="text-blue-600">Resend OTP</button>
                ) : (
                  <>Resend in {timer}s</>
                )}
              </div>
              <div className="w-full justify-center">
                <SubmitButton showIcon={false} fullWidth text="Continue" disabled={disabled} loading={loading} onClick={() => {}} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col items-center gap-1 px-6">
          <div className="px-3 py-1 text-blue-600 border border-blue-500 rounded-full text-sm font-semibold">3-day FREE Trial</div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <FireIcon size={14} />No card or payment required
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 px-6 text-center">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            Trusted by 10,000+ students to clear TET exams across India
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 px-6 text-center">
          <div className="text-sm text-gray-500">
            By Signing Up, I agree to{" "}
            <span className="text-blue-600 underline cursor-pointer">Terms &amp; Conditions</span>
            {" "}and{" "}
            <span className="text-blue-600 underline cursor-pointer">Privacy Policy</span>
          </div>
        </div>
      </>
    );
  }

  return InlineAuthFlow;
}
