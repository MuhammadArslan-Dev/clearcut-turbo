"use client";

import { motion } from "framer-motion";
import Text from "@clearcut/ui/text";
import MainAppLogo from "./icons/main-app-logo";
import { Locale } from "@/lib/dictionary";

// Real Play Store listing — confirmed against the RN app's app.json
// (expo.android.package). No iOS link yet: the iOS app isn't published.
const ANDROID_STORE_URL = "https://play.google.com/store/apps/details?id=com.clearcutoff.app";

const COPY: Record<
  Locale,
  { eyebrow: string; title: string; lead: string; cta: string; ctaSub: string; features: string[] }
> = {
  en: {
    eyebrow: "Clear Cutoff App",
    title: "Take your exam prep with you",
    lead: "Free mock tests, live classes and study material for CTET, HTET, UPTET and more — on your phone.",
    cta: "Get it on Google Play",
    ctaSub: "Free download · Android",
    features: ["Free mock tests", "Live & recorded classes", "Daily practice questions"],
  },
  hi: {
    eyebrow: "Clear Cutoff ऐप",
    title: "एग्जाम की तैयारी अब आपकी जेब में",
    lead: "CTET, HTET, UPTET जैसे एग्जाम्स के लिए फ्री मॉक टेस्ट, लाइव क्लासेज़ और स्टडी मटेरियल — अपने फोन पर।",
    cta: "Google Play पर पाएं",
    ctaSub: "फ्री डाउनलोड · Android",
    features: ["फ्री मॉक टेस्ट", "लाइव और रिकॉर्डेड क्लासेज़", "डेली प्रैक्टिस क्वेश्चन"],
  },
};

function PlayStoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
      {/* flat left edge of the play triangle, split into a blue (top) and green (bottom) half */}
      <path d="M4 2.6C3.6 2.9 3.4 3.4 3.4 4v16c0 .6.2 1.1.6 1.4L14.4 12 4 2.6z" fill="#00D2FF" />
      <path d="M4 2.6 14.4 12 4 21.4c-.4-.3-.6-.8-.6-1.4V4c0-.6.2-1.1.6-1.4z" fill="#00E884" />
      {/* the two triangular tips meeting at the right point, yellow (top) and red (bottom) */}
      <path d="M5 2.6c.3-.2.7-.2 1 0l11.6 6.6-2.2 2.4L5 2.6z" fill="#FFC400" />
      <path d="M5 21.4c.3.2.7.2 1 0l11.6-6.6-2.2-2.4L5 21.4z" fill="#FF3B30" />
      <path d="M17.6 9.8l3 1.7c.9.5.9 1.7 0 2.2l-3 1.7-2.2-2.4 2.2-2.4z" fill="#FFC400" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A phone frame styled to look like the app's own home screen, not a generic doodle. */
function PhoneMockup() {
  return (
    <div className="relative w-[168px] h-[336px] rounded-[28px] bg-white/10 border border-white/25 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.25)] backdrop-blur-sm">
      <div className="relative w-full h-full rounded-[20px] bg-white overflow-hidden flex flex-col">
        <div className="flex items-center gap-2 px-3 pt-4 pb-3">
          <div className="w-8 h-8 rounded-[9px] bg-[var(--color-brand)] flex items-center justify-center shrink-0">
            <MainAppLogo variant="icon" width={13} iconColor="white" />
          </div>
          <div className="h-2 w-16 rounded-full bg-[var(--color-border-gray-subtle)]" />
        </div>

        <div className="px-3 flex flex-col gap-2">
          {[100, 78, 88].map((w, i) => (
            <div
              key={i}
              className="h-11 rounded-lg bg-[var(--color-brand)]/6 border border-[var(--color-brand)]/10 flex items-center px-2.5 gap-2"
            >
              <div className="w-6 h-6 rounded-md bg-[var(--color-brand)]/20 shrink-0" />
              <div className="flex flex-col gap-1" style={{ width: `${w * 0.55}px` }}>
                <div className="h-1.5 rounded-full bg-[var(--color-brand)]/30 w-full" />
                <div className="h-1.5 rounded-full bg-[var(--color-border-gray-subtle)] w-2/3" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-around px-2 py-3 border-t border-[var(--color-border-gray-subtle)]">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-5 h-5 rounded-md ${i === 0 ? "bg-[var(--color-brand)]" : "bg-[var(--color-border-gray-subtle)]"}`}
            />
          ))}
        </div>
      </div>

      {/* app icon badge, overlapping the top-right corner like a store listing */}
      <div className="absolute -right-3 -top-3 w-12 h-12 rounded-2xl bg-white shadow-[0_6px_16px_rgba(0,0,0,0.2)] flex items-center justify-center">
        <MainAppLogo variant="icon" width={17} />
      </div>
    </div>
  );
}

/**
 * Global, drop-anywhere promo for the ClearCutoff mobile app. This tools
 * app has no auth/analytics wiring (see apps/tools's CLAUDE.md notes), so
 * — unlike dashboard's AppDownloadWidget — this is a plain Play Store link,
 * not a deep-link/install-probe flow.
 */
export default function AppDownloadWidget({ locale = "en" }: { locale?: Locale }) {
  const t = COPY[locale] ?? COPY.en;

  return (
    <motion.div
      className="max-w-[960px] mx-auto mt-16 md:mt-20 px-2"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[var(--color-brand)] via-[var(--color-brand)] to-[var(--color-brand-dark)] px-6 py-10 md:px-12 md:py-0 shadow-[0_16px_40px_rgba(0,83,162,0.25)]">
        {/* decorative texture: soft glows + a faint dot grid, kept behind everything */}
        <div className="pointer-events-none absolute -right-16 -top-16 w-72 h-72 rounded-full bg-white/10" aria-hidden />
        <div className="pointer-events-none absolute -left-10 -bottom-16 w-56 h-56 rounded-full bg-black/10" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "16px 16px" }}
          aria-hidden
        />

        <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-10 md:py-10">
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
                <MainAppLogo variant="icon" width={13} />
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-white/15 text-white">
                {t.eyebrow}
              </span>
            </div>

            <Text as="h2" variant="heading-large" weight="bold" color="white">
              {t.title}
            </Text>
            <Text as="p" variant="body-medium" color="white" className="!opacity-85 max-w-[440px]">
              {t.lead}
            </Text>

            <ul className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1.5 mt-1">
              {t.features.map((feature) => (
                <li key={feature} className="inline-flex items-center gap-1.5 text-sm text-white/90">
                  <CheckIcon />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="flex flex-col items-center md:items-start gap-1.5 mt-2">
              <a
                href={ANDROID_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white text-text-gray-normal px-5 py-2.5 font-semibold text-sm shadow-[0_4px_14px_rgba(0,0,0,0.15)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)]"
              >
                <PlayStoreIcon />
                {t.cta}
              </a>
              <span className="text-xs text-white/70">{t.ctaSub}</span>
            </div>
          </div>

          <div className="hidden md:block shrink-0 pt-6">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
