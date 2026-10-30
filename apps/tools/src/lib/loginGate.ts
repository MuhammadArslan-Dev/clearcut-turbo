import type { Locale } from "./dictionary";

// One place that describes WHY a Tools page is asking a visitor to log in.
// The OTP flow itself (send, verify, resend cooldown, rate limits, session) is
// the shared @clearcut/auth feature (see toolsAuthFeature.ts) — a gate config
// only supplies the words the modal shows and an id that is attached to the
// auth analytics events as `context`.
export interface LoginGateConfig {
  /** Stable id, sent as the `context` property on the auth events. */
  id: string;
  title: string;
  subtitle: string;
  /** The modal's primary button (the "send OTP" step). */
  submitLabel: string;
}

export type LoginGatePreset = "download";

const PRESETS: Record<LoginGatePreset, Record<Locale, Omit<LoginGateConfig, "id">>> = {
  download: {
    en: {
      title: "Verify your number to download",
      subtitle: "Verify your mobile number with OTP to download your image for free. No payment required.",
      submitLabel: "Continue",
    },
    hi: {
      title: "डाउनलोड के लिए अपना नंबर वेरिफ़ाई करें",
      subtitle: "अपनी इमेज मुफ़्त डाउनलोड करने के लिए OTP से अपना मोबाइल नंबर वेरिफ़ाई करें। कोई भुगतान नहीं।",
      submitLabel: "आगे बढ़ें",
    },
    mr: {
      title: "डाउनलोडसाठी तुमचा नंबर व्हेरिफाय करा",
      subtitle: "तुमची इमेज मोफत डाउनलोड करण्यासाठी OTP ने तुमचा मोबाइल नंबर व्हेरिफाय करा. कोणतेही पेमेंट नाही.",
      submitLabel: "पुढे जा",
    },
  },
};

export function getLoginGateConfig(preset: LoginGatePreset, locale: Locale): LoginGateConfig {
  return { id: preset, ...PRESETS[preset][locale] };
}
