"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

// false in the server render and during hydration, true afterwards.
const noopSubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
import Button from "@clearcut/ui/button";
import OtpBoxInput from "./OtpBoxInput";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { authApi } from "@/lib/auth";
import {
  logAmplitudeEvent,
  setUserId as setAmplitudeUserId,
} from "@/services/analytics";
import { IMAGES } from "@/constants/images";
import { Locale, defaultLocale } from "@/lib/i18n/config";
import {
  INDIAN_MOBILE_REGEX as PHONE_REGEX,
  INDIAN_MOBILE_FIRST_DIGIT_REGEX as FIRST_DIGIT_REGEX,
  isFakeMobileNumber as isFakeNumber,
  normalizeIndianMobileInput,
} from "@clearcut/auth/validators";
import { setToken } from "@clearcut/auth/token";
import {
  type AuthFailureReason,
  getAuthFailureReason,
  trackAuthFailure,
  trackAuthSuccess,
  trackVerificationFailed,
  trackVerificationResent,
  trackVerificationSent,
} from "@clearcut/auth/verification-events";
import {
  buildPostVerifyRedirectUrl,
  createLeadId,
  getCurrentLocale,
} from "@clearcut/auth/redirect";
import {
  useTruecallerLogin,
  useTruecallerAvailability,
  isFacebookOrInstagramInAppBrowser,
  isTruecallerSupportedBrowser,
} from "@clearcut/auth/truecaller";
import { TruecallerButton } from "@clearcut/auth/truecaller-button";
import { identifyClarityUser } from "@clearcut/analytics/clarity";
import styles from "./start/start.module.css";
import StartMascotStage from "./start/StartMascotStage";
import { useStartMascot } from "./start/useStartMascot";
import { useOneScreen } from "./start/useOneScreen";
import { START_COPY } from "./start/startCopy";

const OTP_LENGTH = 4;
const RESEND_INTERVAL = 30;
// Persists the pending (unverified) signup's user_id across a page refresh
// mid-flow. Without this, refreshing between "phone submitted" and "OTP
// verified" loses it from this component's local state, so the next submit
// omits user_id and AuthController::login creates a duplicate pending user
// row instead of updating the existing one. Read directly (not via
// useAuthStore's persisted pattern) because this value is never rendered —
// it only feeds API payloads/analytics, so there's no hydration-mismatch
// risk to guard against here.
const PENDING_USER_ID_KEY = "pending_user_id";
const REDIRECT_BASE_URL =
  process.env.NEXT_PUBLIC_FRONTEND_URL || "https://app.clearcutoff.in";
// "Login with WhatsApp" — pure frontend wa.me deep link, no backend call.
// Opens a chat to our own number with a fixed pre-filled message; the user
// taps send themselves. Everything past that (identifying the sender,
// creating/looking up their account, replying with a login link) is handled
// by an n8n automation watching this WhatsApp number, not by this app.
const WHATSAPP_NUMBER = "917404758398";
const WHATSAPP_DEFAULT_MESSAGE = "Hi, I want to login to Clear Cutoff";

const CONTENT: Record<
  Locale,
  {
    heading: string;
    featuresLine: string;
    otpHint: string;
    otpDisclaimerLine1: string;
    otpDisclaimerLine2: string;
    trustedByLine: string;
    terms: string;
    termsLink: string;
    privacyLink: string;
    termsSuffix: string;
    andWord: string;
    mobileLabel: string;
    phonePlaceholder: string;
    continueBtn: string;
    verifyHeading: string;
    otpSentTo: string;
    editLabel: string;
    otpLabel: string;
    resendingOtp: string;
    resendOtpTimer: string;
    resendOtp: string;
    verifyOtpBtn: string;
    trialTitle: string;
    trialSubtitle: string;
    errStartDigit: string;
    errNo91: string;
    errValid10: string;
    errEnter10: string;
    errMax10: string;
    errFakeNumber: string;
    successValidPhone: string;
    errInvalidPhone: string;
    errEnterValidPhone: string;
    errLoginFailed: string;
    errEnterValidOtp: string;
    errOtpInvalid: string;
    errOtpExpired: string;
    errTooMany: string;
    errServer: string;
    errNoInternet: string;
    errGeneric: string;
    truecallerBtn: string;
    truecallerWaiting: string;
    truecallerUnavailable: string;
    whatsappBtn: string;
    orDivider: string;
  }
> = {
  en: {
    heading: "Start your exam preparation",
    featuresLine: "Videos • Notes • PYQs",
    otpHint: "We will send you an OTP to verify your number",
    otpDisclaimerLine1: "Used only for login & exam updates. No spam.",
    otpDisclaimerLine2: "OTP will be sent via SMS and WhatsApp.",
    trustedByLine: "Trusted by 10,000+ students to clear TET exams across India",
    terms: "By signing up, I agree to the",
    termsLink: "Terms & Conditions",
    privacyLink: "Privacy Policy",
    termsSuffix: ".",
    andWord: "and",
    mobileLabel: "Mobile or WhatsApp number",
    phonePlaceholder: "10-digit number",
    continueBtn: "Start FREE Preparation",
    verifyHeading: "Verify your number",
    otpSentTo: "OTP sent to",
    editLabel: "Edit",
    otpLabel: "4-digit OTP",
    resendingOtp: "Resending OTP...",
    resendOtpTimer: "Resend OTP ({seconds}s)",
    resendOtp: "Resend OTP",
    verifyOtpBtn: "Verify OTP",
    trialTitle: "3-day FREE Trial",
    trialSubtitle: "No card or payment required",
    errStartDigit: "Phone number must start with 6, 7, 8, or 9",
    errNo91: "Don't include 91 in number",
    errValid10: "Enter valid 10-digit phone number",
    errEnter10: "Enter your 10-digit mobile number",
    errMax10: "Phone number cannot exceed 10 digits",
    errFakeNumber: "Enter only a real mobile number",
    successValidPhone: "Valid phone number",
    errInvalidPhone: "Invalid phone number",
    errEnterValidPhone: "Enter valid phone number",
    errLoginFailed: "Login failed. Please try again.",
    errEnterValidOtp: "Enter valid OTP",
    errOtpInvalid: "Invalid or expired OTP. Please try again.",
    errOtpExpired: "This OTP has expired. Tap Resend OTP to get a new one.",
    errTooMany: "Too many attempts. Please wait a minute and try again.",
    errServer: "Server error. Please try again.",
    errNoInternet: "No internet connection.",
    errGeneric: "Something went wrong. Please try again.",
    truecallerBtn: "Start with",
    truecallerWaiting: "Waiting…",
    truecallerUnavailable: "Truecaller app not found — continue below",
    whatsappBtn: "WhatsApp",
    orDivider: "OR",
  },
  hi: {
    heading: "अपनी परीक्षा की तैयारी शुरू करें",
    featuresLine: "वीडियो • नोट्स • PYQs",
    otpHint: "आपके नंबर को वेरीफाई करने के लिए हम एक OTP भेजेंगे",
    otpDisclaimerLine1: "केवल लॉगिन और परीक्षा अपडेट के लिए उपयोग किया जाता है। कोई स्पैम नहीं।",
    otpDisclaimerLine2: "OTP SMS और WhatsApp के ज़रिए भेजा जाएगा।",
    trustedByLine: "10,000+ छात्रों का भरोसा, पूरे भारत में TET परीक्षाओं को पास करने के लिए",
    terms: "साइन अप करके, मैं",
    termsLink: "नियम और शर्तें",
    privacyLink: "गोपनीयता नीति",
    termsSuffix: " से सहमत हूँ।",
    andWord: "और",
    mobileLabel: "मोबाइल या व्हाट्सएप नंबर",
    phonePlaceholder: "10-अंकों का नंबर",
    continueBtn: "मुफ़्त तैयारी शुरू करें",
    verifyHeading: "अपना नंबर सत्यापित करें",
    otpSentTo: "OTP भेजा गया",
    editLabel: "संपादित करें",
    otpLabel: "4-अंकों का OTP",
    resendingOtp: "OTP फिर से भेजा जा रहा है...",
    resendOtpTimer: "OTP फिर से भेजें ({seconds}s)",
    resendOtp: "OTP फिर से भेजें",
    verifyOtpBtn: "OTP सत्यापित करें",
    trialTitle: "3-दिन का मुफ़्त ट्रायल",
    trialSubtitle: "कोई कार्ड या भुगतान आवश्यक नहीं",
    errStartDigit: "फ़ोन नंबर 6, 7, 8, या 9 से शुरू होना चाहिए",
    errNo91: "नंबर में 91 शामिल न करें",
    errValid10: "मान्य 10-अंकों का फ़ोन नंबर दर्ज करें",
    errEnter10: "10 अंकों का मोबाइल नंबर डालें",
    errMax10: "फ़ोन नंबर 10 अंकों से अधिक नहीं हो सकता",
    errFakeNumber: "केवल असली मोबाइल नंबर दर्ज करें",
    successValidPhone: "मान्य फ़ोन नंबर",
    errInvalidPhone: "अमान्य फ़ोन नंबर",
    errEnterValidPhone: "मान्य फ़ोन नंबर दर्ज करें",
    errLoginFailed: "लॉगिन विफल रहा। कृपया पुनः प्रयास करें।",
    errEnterValidOtp: "मान्य OTP दर्ज करें",
    errOtpInvalid: "अमान्य या समाप्त हो चुका OTP। कृपया पुनः प्रयास करें।",
    errOtpExpired: "OTP की समय सीमा खत्म हो गई। नया OTP पाने के लिए \"OTP फिर से भेजें\" दबाएँ।",
    errTooMany: "बहुत ज़्यादा प्रयास। एक मिनट रुककर फिर कोशिश करें।",
    errServer: "सर्वर त्रुटि। कृपया पुनः प्रयास करें।",
    errNoInternet: "इंटरनेट कनेक्शन नहीं है।",
    errGeneric: "कुछ गलत हो गया। कृपया पुनः प्रयास करें।",
    truecallerBtn: "Start with",
    truecallerWaiting: "प्रतीक्षा करें…",
    truecallerUnavailable: "Truecaller ऐप नहीं मिला — नीचे जारी रखें",
    whatsappBtn: "WhatsApp",
    orDivider: "या",
  },
  mr: {
    heading: "तुमची परीक्षा तयारी सुरू करा",
    featuresLine: "व्हिडिओ • नोट्स • PYQs",
    otpHint: "तुमचा नंबर पडताळण्यासाठी आम्ही तुम्हाला OTP पाठवू",
    otpDisclaimerLine1: "फक्त लॉगिन आणि परीक्षा अपडेटसाठी वापरला जातो. स्पॅम नाही.",
    otpDisclaimerLine2: "OTP SMS आणि WhatsApp द्वारे पाठवला जाईल.",
    trustedByLine: "संपूर्ण भारतात TET परीक्षा उत्तीर्ण करण्यासाठी 10,000+ विद्यार्थ्यांचा विश्वास",
    terms: "साइन अप करून, मी",
    termsLink: "अटी व शर्ती",
    privacyLink: "गोपनीयता धोरण",
    termsSuffix: " यांना सहमत आहे.",
    andWord: "आणि",
    mobileLabel: "मोबाईल किंवा व्हॉट्सअ‍ॅप नंबर",
    phonePlaceholder: "10-अंकी नंबर",
    continueBtn: "मोफत तयारी सुरू करा",
    verifyHeading: "तुमचा नंबर पडताळा",
    otpSentTo: "OTP पाठवला",
    editLabel: "संपादित करा",
    otpLabel: "4-अंकी OTP",
    resendingOtp: "OTP पुन्हा पाठवत आहे...",
    resendOtpTimer: "OTP पुन्हा पाठवा ({seconds}s)",
    resendOtp: "OTP पुन्हा पाठवा",
    verifyOtpBtn: "OTP पडताळा",
    trialTitle: "3-दिवसांची मोफत ट्रायल",
    trialSubtitle: "कोणतेही कार्ड किंवा पेमेंट आवश्यक नाही",
    errStartDigit: "फोन नंबर 6, 7, 8, किंवा 9 ने सुरू झाला पाहिजे",
    errNo91: "नंबरमध्ये 91 समाविष्ट करू नका",
    errValid10: "वैध 10-अंकी फोन नंबर टाका",
    errEnter10: "10 अंकी मोबाईल नंबर टाका",
    errMax10: "फोन नंबर 10 अंकांपेक्षा जास्त असू शकत नाही",
    errFakeNumber: "फक्त खरा मोबाईल नंबर टाका",
    successValidPhone: "वैध फोन नंबर",
    errInvalidPhone: "अवैध फोन नंबर",
    errEnterValidPhone: "वैध फोन नंबर टाका",
    errLoginFailed: "लॉगिन अयशस्वी झाले. कृपया पुन्हा प्रयत्न करा.",
    errEnterValidOtp: "वैध OTP टाका",
    errOtpInvalid: "अवैध किंवा कालबाह्य OTP. कृपया पुन्हा प्रयत्न करा.",
    errOtpExpired: "OTP ची मुदत संपली. नवीन OTP साठी \"OTP पुन्हा पाठवा\" दाबा.",
    errTooMany: "खूप जास्त प्रयत्न. एक मिनिट थांबून पुन्हा प्रयत्न करा.",
    errServer: "सर्व्हर त्रुटी. कृपया पुन्हा प्रयत्न करा.",
    errNoInternet: "इंटरनेट कनेक्शन नाही.",
    errGeneric: "काहीतरी चूक झाली. कृपया पुन्हा प्रयत्न करा.",
    truecallerBtn: "Start with",
    truecallerWaiting: "प्रतीक्षा करा…",
    truecallerUnavailable: "Truecaller अ‍ॅप सापडला नाही — खाली सुरू ठेवा",
    whatsappBtn: "WhatsApp",
    orDivider: "किंवा",
  },
};


/**
 * The whole /start page (phase 101: the Nibbu redesign moved the layout in
 * here; the old right panel StartHero is no longer rendered).
 * Same validation, same authApi calls, same analytics event names, same
 * Meta Lead tracking, same redirect builder as the login modal
 * (packages/auth's login-screen.tsx + otp-screen.tsx) — this is a visual
 * restyle only, no behavior change.
 *
 * Deliberately does NOT touch the shared useAuthStore: that store is a
 * singleton also driving the globally-mounted <AuthModal/> (rendered in the
 * root layout), so setting its `screen` field here would pop the modal open
 * on top of this page. Local state instead — same pattern already used by
 * InlineAuthFlow for exactly this reason (see its own file header).
 */
export default function StartAuthForm({
  locale = defaultLocale,
}: {
  locale?: Locale;
}) {
  const t = CONTENT[locale];

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  // Bumped after a wrong/expired OTP so OtpBoxInput refocuses (fresh keyboard chip).
  const [otpRefocusKey, setOtpRefocusKey] = useState(0);
  const [userId, setUserId] = useState(() =>
    typeof window !== "undefined"
      ? (localStorage.getItem(PENDING_USER_ID_KEY) ?? "")
      : "",
  );
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isValidPhone, setIsValidPhone] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_INTERVAL);

  const hasTrackedRef = useRef(false);
  // Successful resends for the current login flow (reset on every fresh send);
  // sent as `resend_count` on Verification Resent.
  const resendCountRef = useRef(0);
  const isVerifyingRef = useRef(false);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);

  /* ---------------- ANALYTICS (same event names as login-screen.tsx) ---------------- */

  useEffect(() => {
    if (hasTrackedRef.current) return;
    hasTrackedRef.current = true;

    // Fired here (on landing, not on the referring page) so it fires no
    // matter who links to /start — the Astro go-marketing CTAs (which now
    // navigate straight here instead of opening a local modal, see
    // reference_astro_marketing_project memory), the FAQ page's plain link,
    // or any future entry point. element_location/element_type are read off
    // the URL the same way `course`/`showTruecaller` already are elsewhere
    // in this file — an external page can attribute the click by appending
    // them to its own /start link; absent params just mean "unattributed".
    const params = new URLSearchParams(window.location.search);
    logAmplitudeEvent("Authentication Initiated", {
      element_location: params.get("element_location") || "start_page",
      element_type: params.get("element_type") || "link",
    });
    logAmplitudeEvent("Authentication Options Viewed", {
      initial_intent: "login",
      options_available: "phone",
    });
    logAmplitudeEvent("Authentication Method Selected", {
      auth_method: "phone_otp",
    });
  }, []);

  // Auto-focus so the number keypad opens on arrival (CC-84, decision D1),
  // except in Facebook's/Instagram's in-app browser: there, dismissing that
  // unsolicited keyboard with the back button/gesture navigated the page
  // back instead of just closing it. Checked on the user agent, not
  // useIsMobile (still false during hydration).
  useEffect(() => {
    if (isFacebookOrInstagramInAppBrowser()) return;
    phoneInputRef.current?.focus();
  }, []);

  /* ---------------- PHONE VALIDATION (verbatim from login-screen.tsx) ---------------- */

  const validatePhone = (value: string) => {
    const cleaned = normalizeIndianMobileInput(value);

    setPhone(cleaned);
    setAutoSubmitted(false);

    if (!cleaned.length) {
      setError("");
      setSuccess("");
      setIsValidPhone(false);
      return;
    }

    if (cleaned.length === 1 && !FIRST_DIGIT_REGEX.test(cleaned)) {
      setError(t.errStartDigit);
      setSuccess("");
      setIsValidPhone(false);
      return;
    }

    if (
      cleaned.length >= 2 &&
      cleaned.length < 10 &&
      cleaned.startsWith("91") &&
      (cleaned.length === 2 || /^[6-9]$/.test(cleaned[2]))
    ) {
      setError(t.errNo91);
      setSuccess("");
      setIsValidPhone(false);
      return;
    }

    if (cleaned.length < 10) {
      setError(t.errValid10);
      setSuccess("");
      setIsValidPhone(false);
      return;
    }

    if (cleaned.length > 10) {
      setError(t.errMax10);
      setSuccess("");
      setIsValidPhone(false);
      return;
    }

    if (PHONE_REGEX.test(cleaned) && isFakeNumber(cleaned)) {
      setError(t.errFakeNumber);
      setSuccess("");
      setIsValidPhone(false);
      return;
    }

    if (PHONE_REGEX.test(cleaned)) {
      setSuccess(t.successValidPhone);
      setError("");
      setIsValidPhone(true);
      return;
    }

    setError(t.errInvalidPhone);
    setSuccess("");
    setIsValidPhone(false);
  };

  useEffect(() => {
    if (isValidPhone && phone.length === 10 && !autoSubmitted) {
      setAutoSubmitted(true);
      setTimeout(() => handleLogin(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValidPhone, phone]);

  /* ---------------- LOGIN ---------------- */

  const handleLogin = async (phoneValue?: string) => {
    const number = phoneValue ?? phone;

    // The button stays tappable (CC-84): a tap with a missing or wrong
    // number shows why under the field instead of silently doing nothing.
    if (!PHONE_REGEX.test(number)) {
      setError(number ? error || t.errEnterValidPhone : t.errEnter10);
      setSuccess("");
      phoneInputRef.current?.focus();
      return;
    }

    if (isFakeNumber(number)) {
      setError(t.errFakeNumber);
      setIsValidPhone(false);
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Sends back the previous attempt's user_id, when there is one, so the
      // backend can correct that pending (unverified) row's phone instead of
      // leaving it behind as an orphan account and inserting a new one.
      const res = await authApi.loginUser({
        phone: number,
        user_id: userId || undefined,
      });
      const { data, message } = res?.data;

      resendCountRef.current = 0;
      trackVerificationSent(logAmplitudeEvent, number);
      // Brand-new signup only — see packages/auth login-screen.tsx.
      if (data?.is_new_user && data?.user_id) setAmplitudeUserId(data.user_id);

      localStorage.setItem("is_new_user", data?.is_new_user ? "true" : "false");
      setIsNewUser(Boolean(data?.is_new_user));

      // The backend only echoes `user_id` back for a genuinely new signup
      // (AuthController::login) — an update to an already-known pending row
      // returns none. Fall back to the id we already have instead of
      // blanking it out, so a 2nd+ correction on the same pending row still
      // carries it forward.
      const nextUserId = data?.user_id ?? userId;
      setUserId(nextUserId);
      if (nextUserId) {
        localStorage.setItem(PENDING_USER_ID_KEY, nextUserId);
      }

      setSuccess(message);

      setResendTimer(RESEND_INTERVAL);
      setTimeout(() => {
        setLoading(false);
        setStep("otp");
      }, 200);
    } catch (err) {
      // The OTP was not sent (CC-87/D4): say why, and record it.
      const reason = getAuthFailureReason(err);
      trackVerificationFailed(logAmplitudeEvent, number, reason);
      setLoading(false);
      setError(sendFailureMessage(reason));
    }
  };

  const sendFailureMessage = (reason: AuthFailureReason) =>
    reason === "too_many_attempts"
      ? t.errTooMany
      : reason === "network_error" || reason === "timeout"
        ? t.errNoInternet
        : t.errLoginFailed;

  /* ---------------- RESEND TIMER ---------------- */

  useEffect(() => {
    if (step !== "otp") return;
    if (resendTimer <= 0) return;

    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setResendingOtp(true);
    try {
      await authApi.loginUser({ phone, user_id: userId || undefined });
      setResendTimer(RESEND_INTERVAL);
      // CC-54: a new OTP is on its way, so the old code must not stay in
      // the field, and the input is remounted (+ refocused) so the
      // keyboard's one-time-code chip offers the NEW SMS, not the old one.
      setOtp("");
      setError("");
      setOtpRefocusKey((k) => k + 1);

      resendCountRef.current += 1;
      trackVerificationResent(logAmplitudeEvent, phone, resendCountRef.current);
    } catch (err) {
      // Used to fail silently (console only).
      const reason = getAuthFailureReason(err);
      trackVerificationFailed(logAmplitudeEvent, phone, reason, true);
      setError(sendFailureMessage(reason));
    } finally {
      setResendingOtp(false);
    }
  };

  const handleEditNumber = () => {
    setStep("phone");
    setOtp("");
    setError("");
    setSuccess("");
  };

  const handleWhatsAppLogin = () => {
    window.location.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_DEFAULT_MESSAGE)}`;
  };

  /* ---------------- VERIFY ---------------- */

  const handleVerify = async (autoOtp?: string) => {
    if (isVerifyingRef.current) return;

    const finalOtp = autoOtp || otp;
    if (!finalOtp || finalOtp.length !== OTP_LENGTH) {
      setError(t.errEnterValidOtp);
      return;
    }

    isVerifyingRef.current = true;
    setError("");
    setLoading(true);

    // One Authentication Outcome per attempt (see packages/auth otp-screen.tsx).
    let outcomeTracked = false;

    try {
      const lang = getCurrentLocale();
      // e.g. /start?course=htet, if this page is ever linked from a
      // course-specific page — mirrors the modal flow's course threading
      // (see ContinueFreeButton's `course` prop). Read directly off the URL
      // here (rather than a `useSearchParams()` hook) since this only runs
      // client-side inside this handler — avoids adding a Suspense boundary
      // requirement to this Server Component's tree just for this.
      const course = new URLSearchParams(window.location.search).get("course");

      const res = await authApi.verifyOtp({ phone, otp: finalOtp });
      const { data, status } = res.data;

      if (status !== "success") throw new Error("Verification failed");

      setToken(data.token);
      if (userId) setAmplitudeUserId(userId);
      trackAuthSuccess(logAmplitudeEvent);
      outcomeTracked = true;
      // Verified now — no longer a "pending" row a future refresh should
      // try to reuse/update.
      localStorage.removeItem(PENDING_USER_ID_KEY);
      identifyClarityUser({ userId, phone });

      // See packages/auth/src/screens/otp-screen.tsx's comment above the
      // same pattern: Lead can only pick up phone/external_id on the app
      // side's first Pixel init(), so it's minted here as a one-time
      // registration-occurrence token and threaded through the redirect.
      const leadId = isNewUser ? createLeadId() : undefined;

      const redirectUrl = buildPostVerifyRedirectUrl({
        baseUrl: REDIRECT_BASE_URL,
        token: data.token,
        hasCourse: data.has_course,
        userType: "old",
        lang,
        course,
        leadId,
      });

      // Phase 101: Nibbu's "verified" screen, then the same redirect.
      finishThenGoRef.current(redirectUrl);
    } catch (err: unknown) {
      // One classifier for the event and the message (CC-87): it reads the
      // ApiError's `.status`, which the old `err.response.status` check
      // never found, so every failure here said "something went wrong".
      const reason = getAuthFailureReason(err);
      if (!outcomeTracked) trackAuthFailure(logAmplitudeEvent, reason);
      setLoading(false);
      if (reason === "incorrect_otp" || reason === "otp_expired") {
        setError(reason === "otp_expired" ? t.errOtpExpired : t.errOtpInvalid);
        // An expired code can't be retried: let them resend right away.
        if (reason === "otp_expired") setResendTimer(0);
        // Most often the keyboard chip's code from a previous login — clear
        // it and remount the boxes (OtpBoxInput refocusKey).
        setOtp("");
        setOtpRefocusKey((k) => k + 1);
      } else if (reason === "too_many_attempts") {
        setError(t.errTooMany);
      } else if (reason === "server_error") {
        setError(t.errServer);
      } else if (reason === "network_error" || reason === "timeout") {
        setError(t.errNoInternet);
      } else {
        setError(t.errGeneric);
      }
    } finally {
      isVerifyingRef.current = false;
    }
  };

  // No WebOTP call (see @clearcut/auth otp-screen.tsx): the keyboard's OTP
  // chip fills OtpBoxInput (autoComplete="one-time-code") and its onChange
  // verifies once all digits are in.

  /* ---------------- TRUECALLER ---------------- */

  const truecallerAvailability = useTruecallerAvailability();
  // Both inputs below are browser-only (UA, URL, the localStorage cache), so
  // the server always renders this page without the Truecaller block. Showing
  // it in the very first client render (as before) mismatched that HTML on
  // Android Chrome, and React then re-rendered the whole form on the client.
  // Gating on hydration shows it one render later, matching the server HTML.
  const hydrated = useHydrated();

  // ?showTruecaller=true — set by the Astro /go marketing pages' Login/Try
  // Free CTAs when THEIR OWN on-page detection already found Truecaller
  // available, so the button doesn't have to wait for detection to run again
  // here. Read directly off the URL (not a `useSearchParams()` hook) for the
  // same reason getCurrentLocale() does — this only runs client-side, no
  // need for a Suspense boundary just for this.
  //
  // Still gated on the current browser being an Android browser Truecaller
  // supports and not Facebook's/Instagram's in-app browser: the referring
  // /go page's own detection ran in ITS browser tab, but this param can't
  // know which browser the user will actually land in on /start.
  const forceShowTruecaller =
    typeof window !== "undefined" &&
    isTruecallerSupportedBrowser() &&
    !isFacebookOrInstagramInAppBrowser() &&
    new URLSearchParams(window.location.search).get("showTruecaller") ===
      "true";

  const {
    state: truecallerState,
    error: truecallerError,
    start: startTruecallerLogin,
  } = useTruecallerLogin(authApi, (result) => {
    setToken(result.token);

    const tcUser = result.user as { uuid?: string; phone?: string } | undefined;
    identifyClarityUser({ userId: tcUser?.uuid, phone: tcUser?.phone });

    const lang = getCurrentLocale();
    const course = new URLSearchParams(window.location.search).get("course");

    const redirectUrl = buildPostVerifyRedirectUrl({
      baseUrl: REDIRECT_BASE_URL,
      token: result.token,
      hasCourse: result.hasCourse,
      userType: "old",
      lang,
      course,
    });

    finishThenGoRef.current(redirectUrl);
  }, logAmplitudeEvent);

  /* ---------------- NIBBU + LAYOUT (phase 101: UI only, the logic above is unchanged) ---------------- */

  const c = START_COPY[locale];
  const screen = useOneScreen();
  const nib = useStartMascot(c.say.hello);
  const [done, setDone] = useState(false);
  // Partial-number errors show only after a blur / a tap (the prototype's
  // renderPhone(showErrors)); a wrong first digit, "91", fake or a send
  // failure show at once. The `error` state itself is unchanged.
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [shakeKey, setShakeKey] = useState({ phone: 0, otp: 0, cta: 0 });
  const [confettiKey, setConfettiKey] = useState(0);
  const [sendFailed, setSendFailed] = useState(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleCountRef = useRef(0);
  const otpWrapRef = useRef<HTMLDivElement | null>(null);
  const ctaWrapRef = useRef<HTMLDivElement | null>(null);
  const keepSayRef = useRef(false);
  // The CC-84 auto-focus is not the student's doing: the field's "focus" line
  // only replaces the greeting after a real tap / key press.
  const userActedRef = useRef(false);
  useEffect(() => {
    const acted = () => {
      userActedRef.current = true;
    };
    window.addEventListener("pointerdown", acted, { capture: true, once: true });
    window.addEventListener("keydown", acted, { capture: true, once: true });
    return () => {
      window.removeEventListener("pointerdown", acted, true);
      window.removeEventListener("keydown", acted, true);
    };
  }, []);
  const live = useRef({ step, phone, isValidPhone, loading, done, otp });
  live.current = { step, phone, isValidPhone, loading, done, otp };

  const shake = (k: "phone" | "otp" | "cta") => setShakeKey((s) => ({ ...s, [k]: s[k] + 1 }));

  // Greeting: wave, then point at the field. The CC-84 auto-focus (an earlier
  // effect) already fired the field's focus line; the greeting wins on load.
  useEffect(() => {
    nib.say(c.say.hello);
    nib.setMood("wave", "point", 2400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Nibbu's line for a freshly typed number (same rules, in the same order, as validatePhone). */
  const reactToPhone = (raw: string) => {
    const cleaned = normalizeIndianMobileInput(raw);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    setNudge(false);
    setSendFailed(false);
    nib.lookAtEl(phoneInputRef.current);
    if (!cleaned.length) {
      nib.say(c.say.focus);
      nib.setMood("idle");
    } else if (cleaned.length === 1 && !FIRST_DIGIT_REGEX.test(cleaned)) {
      nib.say(c.say.badStart, "sad");
      nib.setMood("sad", "idle", 1400);
    } else if (cleaned.length >= 2 && cleaned.length < 10 && cleaned.startsWith("91") && (cleaned.length === 2 || /^[6-9]$/.test(cleaned[2]))) {
      nib.say(t.errNo91, "sad");
      nib.setMood("sad", "idle", 1400);
    } else if (cleaned.length < 10) {
      nib.say(c.say.typing(10 - cleaned.length));
      nib.setMood("idle");
      const left = 10 - cleaned.length;
      pauseTimerRef.current = setTimeout(() => {
        if (!live.current.loading && live.current.step === "phone" && live.current.phone.length === cleaned.length) {
          nib.say(c.say.pause(left));
          nib.setMood("point");
        }
      }, 3500);
    } else if (PHONE_REGEX.test(cleaned) && isFakeNumber(cleaned)) {
      nib.say(t.errFakeNumber, "sad");
      nib.setMood("sad", "idle", 1400);
    } else if (PHONE_REGEX.test(cleaned)) {
      // validatePhone's effect sends the OTP on the 10th digit (unchanged).
      nib.say(c.say.valid, "happy");
      nib.setMood("happy");
    } else {
      nib.say(t.errInvalidPhone, "sad");
      nib.setMood("sad", "idle", 1400);
    }
  };

  /** A tap on Start with a missing / wrong number (handleLogin then shows the reason, as before). */
  const reactToBadSubmit = () => {
    setPhoneTouched(true);
    shake("phone");
    const n = phone.length;
    nib.say(!n ? c.say.empty : !FIRST_DIGIT_REGEX.test(phone[0]) ? c.say.badStart : n < 10 ? c.say.short(10 - n) : error || c.say.empty, "sad");
    nib.setMood("sad", "point", 1400);
  };

  const submitPhone = () => {
    if (loading) return;
    if (!PHONE_REGEX.test(phone) || isFakeNumber(phone)) reactToBadSubmit();
    else {
      nib.say(c.say.valid, "happy");
      nib.setMood("happy");
    }
    void handleLogin();
  };

  // A send that failed (handleLogin's catch sets `error` while still on the phone step).
  const prevLoading = useRef(loading);
  useEffect(() => {
    const was = prevLoading.current;
    prevLoading.current = loading;
    if (!was || loading) return;
    if (step === "phone" && error && PHONE_REGEX.test(phone) && !isFakeNumber(phone)) {
      setSendFailed(true);
      shake("cta");
      nib.say(c.say.sendFail, "sad");
      nib.setMood("sad", "point", 1600);
    } else if (step === "otp" && error && !done) {
      nib.say(otp.length === 0 ? c.say.otpWrong : error, "sad");
      nib.setMood("sad", "otp", 1600);
      shake("otp");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Entering / leaving the OTP step (not on mount: the greeting stays).
  const prevStepRef = useRef(step);
  useEffect(() => {
    if (prevStepRef.current === step) return;
    prevStepRef.current = step;
    if (step === "otp") {
      nib.say(c.say.otp);
      nib.setMood("otp");
      nib.lookAtEl(otpWrapRef.current);
    } else if (!done) {
      nib.say(c.say.focus);
      nib.setMood("idle");
    }
    idleCountRef.current = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Resend finished: a new OTP is on its way (or it failed).
  const prevResending = useRef(resendingOtp);
  useEffect(() => {
    const was = prevResending.current;
    prevResending.current = resendingOtp;
    if (!was || resendingOtp) return;
    if (error) {
      nib.say(c.say.sendFail, "sad");
      nib.setMood("sad", "otp", 1600);
    } else {
      nib.say(c.say.resent, "happy");
      nib.setMood("happy", "otp", 1200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resendingOtp]);

  const showDone = () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    // Commit the whole "verified" state at once (panel, bubble, mood, confetti).
    flushSync(() => {
      setDone(true);
      nib.say(c.say.done, "happy");
      nib.setMood("cheer");
      nib.lookFront();
      setConfettiKey((k) => k + 1);
    });
  };
  const showDoneRef = useRef(showDone);
  showDoneRef.current = showDone;

  /**
   * Phase 101: show the "verified" screen, then the (unchanged) redirect one
   * frame later — a location.replace in the same tick started the navigation
   * before the browser ever painted the new state (seen in Playwright). The
   * URL and every step before it are exactly as before; only ~1 frame added.
   */
  const finishThenGo = (url: string) => {
    showDone();
    let gone = false;
    const go = () => {
      if (gone) return;
      gone = true;
      window.location.replace(url);
    };
    window.requestAnimationFrame(() => window.setTimeout(go, 0));
    // A hidden tab (e.g. back from the Truecaller app) runs no animation frames.
    window.setTimeout(go, 120);
  };
  const finishThenGoRef = useRef(finishThenGo);
  finishThenGoRef.current = finishThenGo;

  // Idle nudges: push toward the next action (6 s, then every 9 s).
  useEffect(() => {
    const nudgeNow = () => {
      const s = live.current;
      if (s.loading || s.done) return;
      idleCountRef.current += 1;
      if (s.step === "phone") {
        if (s.isValidPhone) {
          nib.say(c.say.ready, "happy");
          nib.setMood("point");
          nib.lookAtEl(ctaWrapRef.current);
        } else {
          nib.say(s.phone.length > 0 ? c.say.pause(10 - s.phone.length) : c.say.idle[(idleCountRef.current - 1) % 3]);
          nib.setMood("point");
          setNudge(true);
          nib.lookAtEl(phoneInputRef.current);
        }
      } else {
        nib.say(c.say.otpIdle);
        nib.setMood("otp");
        nib.lookAtEl(otpWrapRef.current);
      }
      idleTimerRef.current = setTimeout(nudgeNow, 9000);
    };
    const arm = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      setNudge(false);
      if (live.current.loading || live.current.done) return;
      idleTimerRef.current = setTimeout(nudgeNow, idleCountRef.current === 0 ? 6000 : 9000);
    };
    const onVisible = () => {
      const s = live.current;
      if (!document.hidden && s.step === "phone" && !s.loading && !s.isValidPhone) {
        nib.say(c.say.back);
        nib.setMood("wave", "point", 1600);
        setNudge(true);
      }
    };
    const onLeave = (e: MouseEvent) => {
      const s = live.current;
      if (e.clientY <= 0 && s.step === "phone" && !s.loading && !s.done) {
        nib.say(c.say.exit);
        nib.setMood("wave", "point", 1600);
        setNudge(true);
      }
    };
    arm();
    window.addEventListener("pointerdown", arm, true);
    window.addEventListener("keydown", arm, true);
    document.addEventListener("visibilitychange", onVisible);
    document.addEventListener("mouseleave", onLeave);
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      window.removeEventListener("pointerdown", arm, true);
      window.removeEventListener("keydown", arm, true);
      document.removeEventListener("visibilitychange", onVisible);
      document.removeEventListener("mouseleave", onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const onMascotTap = () => {
    if (loading || done) return;
    if (step === "phone") {
      nib.say(c.say.tap);
      nib.setMood("happy", "point", 900);
      keepSayRef.current = document.activeElement !== phoneInputRef.current;
      phoneInputRef.current?.focus();
    } else {
      nib.say(c.say.otp);
      const boxes = otpWrapRef.current?.querySelectorAll<HTMLInputElement>("input");
      const firstEmpty = boxes ? Array.from(boxes).find((b) => !b.value) ?? boxes[0] : null;
      firstEmpty?.focus();
    }
  };

  const phoneErrorVisible =
    Boolean(error) && (phoneTouched || sendFailed || error !== t.errValid10);
  const phoneState: "valid" | "invalid" | "" = phoneErrorVisible ? "invalid" : isValidPhone ? "valid" : "";
  const stepIndex = done ? 3 : step === "phone" ? 1 : 2;
  const prettyPhone = `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
  const otpReady = otp.length === OTP_LENGTH;

  return (
    <div ref={screen.ref} className={styles.root} data-kb={screen.kb ? "true" : "false"}>
      <main className={styles.card}>
        <div className={styles.left}>
          <StartMascotStage
            ref={nib.mascotRef}
            mood={nib.mood}
            text={nib.line.text}
            tone={nib.line.tone}
            sayKey={nib.line.key}
            column={screen.column}
            confettiKey={confettiKey}
            look={nib.look}
            label={c.mascotLabel}
            onTap={onMascotTap}
          />
        </div>

        <div className={styles.right}>
          <div className={styles.top}>
            <Link href="/" className={styles.brand} aria-label="Clear Cutoff">
              <Image src={IMAGES.mainLogo} alt="Clear Cutoff" width={140} height={40} priority />
            </Link>
            <div className={styles.stepper}>
              <span>{done ? c.stepDone : c.stepOf(stepIndex)}</span>
              <span className={styles.segs} aria-hidden="true">
                <i className={styles.seg} data-state={stepIndex === 1 ? "on" : "ok"} />
                <i className={styles.seg} data-state={stepIndex === 2 ? "on" : stepIndex === 3 ? "ok" : undefined} />
              </span>
            </div>
          </div>

          {done ? (
            <section className={styles.panel} aria-labelledby="h-done">
              <div className={styles.done}>
                <h1 id="h-done" className={styles.h1} tabIndex={-1}>
                  {c.doneHeading}
                </h1>
                <p className={styles.sub}>{c.doneSub}</p>
                <div className={styles.progress}>
                  <i />
                </div>
              </div>
            </section>
          ) : step === "phone" ? (
            <section key="phone" className={styles.panel} aria-labelledby="h-phone">
              <h1 id="h-phone" className={styles.h1}>
                {c.headingBefore}
                <em>{c.headingAccent}</em>
                {c.headingAfter}
              </h1>
              <p className={styles.sub}>{c.sub}</p>

              {/* Truecaller (unchanged rules): Android browsers where the app was
                  found, or ?showTruecaller=true from a /go page. */}
              {hydrated && (truecallerAvailability === "available" || forceShowTruecaller) && (
                <div className="flex md:hidden flex-col gap-2 mb-2">
                  <TruecallerButton
                    state={truecallerState}
                    error={truecallerError}
                    onClick={startTruecallerLogin}
                    leadingText={t.truecallerBtn}
                    waitingLabel={t.truecallerWaiting}
                    unavailableMessage={t.truecallerUnavailable}
                  />
                  <div className={styles.orRow}>{t.orDivider}</div>
                </div>
              )}

              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  submitPhone();
                }}
              >
                <label className={styles.fieldLabel} htmlFor="start-phone">
                  <Image src="/images/indian-flage.webp" alt="" width={21} height={14} className={styles.flag} unoptimized />
                  {t.mobileLabel}
                </label>
                <div
                  key={`phone-${shakeKey.phone}`}
                  className={`${styles.phone} ${shakeKey.phone ? styles.shake : ""}`}
                  data-state={phoneState || undefined}
                  data-nudge={nudge ? "true" : undefined}
                  onClick={() => phoneInputRef.current?.focus()}
                >
                  <span className={styles.cc} aria-hidden="true">
                    +91
                  </span>
                  <input
                    ref={phoneInputRef}
                    id="start-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder={t.phonePlaceholder}
                    value={phone}
                    readOnly={loading}
                    aria-invalid={phoneState === "invalid"}
                    aria-describedby="phone-msg"
                    onFocus={() => {
                      setNudge(false);
                      nib.lookAtEl(phoneInputRef.current);
                      if (!phone && !loading && !keepSayRef.current && userActedRef.current) {
                        nib.say(c.say.focus);
                        nib.setMood("idle");
                      }
                      keepSayRef.current = false;
                    }}
                    onChange={(e) => {
                      validatePhone(e.target.value);
                      reactToPhone(e.target.value);
                    }}
                    onBlur={() => {
                      if (phone.length > 0 && phone.length < 10 && FIRST_DIGIT_REGEX.test(phone[0])) {
                        setPhoneTouched(true);
                        nib.say(c.say.short(10 - phone.length), "sad");
                        nib.setMood("sad", "point", 1400);
                      }
                    }}
                  />
                  <span className={styles.dots} aria-hidden="true">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <i key={i} data-on={i < phone.length ? "true" : undefined} />
                    ))}
                  </span>
                </div>
                <p id="phone-msg" className={styles.msg} data-kind={phoneErrorVisible ? "error" : success ? "ok" : undefined} aria-live="polite">
                  {phoneErrorVisible ? error : success}
                </p>

                <div ref={ctaWrapRef} key={`cta-${shakeKey.cta}`} className={shakeKey.cta ? styles.shake : undefined}>
                  <Button
                    type="submit"
                    size="lg"
                    sx={{ borderRadius: "50px" }}
                    fullWidth
                    disabled={loading}
                    loading={loading}
                    rightIcon={loading ? undefined : <span aria-hidden="true">→</span>}
                    className={styles.cta}
                    data-ready={isValidPhone && !loading ? "true" : undefined}
                  >
                    {loading ? c.sending : sendFailed ? c.tryAgain : t.continueBtn}
                  </Button>
                </div>
              </form>
              <p className={styles.perks}>
                <span>{c.perkTrial}</span> · <span>{c.perkNoCard}</span>
              </p>
            </section>
          ) : (
            <section key="otp" className={styles.panel} aria-labelledby="h-otp">
              <h1 id="h-otp" className={styles.h1}>
                {c.otpHeading}
              </h1>
              <p className={styles.sent}>
                {c.sentTo} <b>{prettyPhone}</b>{" "}
                <button type="button" className={styles.linkbtn} onClick={handleEditNumber} disabled={loading}>
                  {c.change}
                </button>
              </p>
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!otpReady) {
                    shake("otp");
                    nib.say(c.say.otpShort, "sad");
                    nib.setMood("sad", "otp", 1400);
                  } else {
                    nib.say(c.say.otpCheck);
                    nib.setMood("idle");
                  }
                  void handleVerify();
                }}
              >
                <div ref={otpWrapRef} key={`otp-${shakeKey.otp}`} className={shakeKey.otp ? styles.shake : undefined} role="group" aria-label={t.otpLabel}>
                  <OtpBoxInput
                    variant="boxed"
                    length={OTP_LENGTH}
                    value={otp}
                    error={!!error}
                    disabled={loading}
                    autoFocus
                    refocusKey={otpRefocusKey}
                    onChange={(val) => {
                      setOtp(val);
                      nib.lookAtEl(otpWrapRef.current);
                      if (val.length === OTP_LENGTH) {
                        nib.say(c.say.otpCheck);
                        nib.setMood("idle");
                        handleVerify(val);
                      } else if (val.length) {
                        nib.say(c.say.otpType(OTP_LENGTH - val.length));
                        nib.setMood("otp");
                      }
                    }}
                  />
                </div>
                <p className={styles.msg} data-kind={error ? "error" : undefined} aria-live="polite">
                  {error}
                </p>
                <Button
                  type="submit"
                  size="lg"
                  sx={{ borderRadius: "50px" }}
                  fullWidth
                  disabled={loading}
                  loading={loading}
                  rightIcon={loading ? undefined : <span aria-hidden="true">→</span>}
                  className={styles.cta}
                  data-dim={!otpReady && !loading ? "true" : undefined}
                  aria-disabled={!otpReady}
                >
                  {loading ? c.verifying : c.verifyStart}
                </Button>
              </form>
              <div className={styles.resend}>
                <span className={styles.resendHint}>{c.didntGet}</span>
                {resendingOtp ? (
                  <span className={styles.count}>{t.resendingOtp}</span>
                ) : (
                  <button type="button" className={styles.linkbtn} onClick={handleResendOtp} disabled={resendTimer > 0 || loading}>
                    {resendTimer > 0 ? (
                      <>
                        {t.resendOtp} <span className={styles.count}>0:{String(resendTimer).padStart(2, "0")}</span>
                      </>
                    ) : (
                      t.resendOtp
                    )}
                  </button>
                )}
              </div>
            </section>
          )}

          <p className={styles.legal}>
            {/* New tab (CC-85) so the form and the typed number stay. */}
            {t.terms}{" "}
            <Link href="/terms-and-conditions" target="_blank" rel="noopener noreferrer">
              {t.termsLink}
            </Link>{" "}
            {t.andWord}{" "}
            <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer">
              {t.privacyLink}
            </Link>
            {t.termsSuffix}
          </p>
        </div>
      </main>
    </div>
  );
}
