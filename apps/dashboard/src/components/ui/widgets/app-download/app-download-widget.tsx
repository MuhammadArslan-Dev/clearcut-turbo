"use client";

import Image from "next/image";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import React, { useEffect, useRef, useState } from "react";
import MainButton from "../../button/main-button";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { PenIcon, TrophyIcon } from "../../icons";
import { RotatingBadge } from "../../animation/RotatingBadge";
import { trackEvent } from "@/lib/analytics/browser";

// Real values, confirmed against the RN app's app.json / constants/config.ts
// (scheme registered under `expo.scheme`; Android package under `expo.android.package`).
const APP_SCHEME = "clearcutoffapp://";
const ANDROID_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.clearcutoff.app";
// The iOS app isn't published yet (constants/config.ts has an empty
// IOS_APP_ID) — there's no store link to fall back to on iOS until then.

type AppDownloadWidgetProps = {
  bgColor?: string;
  rounded?: string;
  /** Active course's exam short name, e.g. "CTET" — shown in "Clear {exam}". */
  examTitle?: string;
};

export default function AppDownloadWidget({
  bgColor = "bg-white",
  rounded = "rounded-md",
  examTitle = "",
}: AppDownloadWidgetProps) {
  const t = useTranslations();

  // Hidden inside the mobile app's own WebView — promoting the app to a user
  // already inside it makes no sense. Also hidden on a mobile browser where
  // the app turns out to already be installed (the probe below sends that
  // device straight into the app instead of showing this promo).
  const [hidden, setHidden] = useState(false);
  const probed = useRef(false);

  useEffect(() => {
    if (probed.current) return;
    probed.current = true;

    const ua = navigator.userAgent;
    // `window.ReactNativeWebView` is injected automatically by the
    // react-native-webview package on both Android and iOS — no native app
    // change needed. It's checked first because iOS's WKWebView doesn't mark
    // itself in the user agent the way Android's WebView does with "wv".
    const isWebView =
      typeof (window as any).ReactNativeWebView !== "undefined" ||
      /wv/.test(ua) ||
      /Android.*Version\/[\d.]+/.test(ua);
    if (isWebView) {
      setHidden(true);
      return;
    }

    const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(ua);
    if (!isMobileDevice) return;

    // Silent install probe: fire the custom scheme: if the OS switches away
    // to open the app, this tab is hidden almost immediately — treat that as
    // "app installed" and keep the promo off screen. If nothing happens
    // within the window, assume it isn't installed and show the promo as
    // usual (this does NOT fall back to the Play Store on its own — that
    // only happens if the user explicitly taps "Continue in App").
    let settled = false;
    const onVisibilityChange = () => {
      if (document.hidden && !settled) {
        settled = true;
        setHidden(true);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const timeout = setTimeout(() => {
      settled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
    }, 1200);

    window.location.href = APP_SCHEME;

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const handleContinueInApp = async () => {
    await trackEvent("App Download Initiated", {
      widget_location: "learn_dashboard",
      widget_type: "app_promo_banner",
    });

    // By the time this widget is visible, the mount-time probe has already
    // decided the app isn't installed (or couldn't tell) — so this button
    // goes straight to the store instead of re-attempting the custom-scheme
    // deep link, which is unreliable as an explicit-click action too.
    const isIOSDevice = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isIOSDevice) {
      // No iOS store link yet — best effort is still the app scheme.
      window.location.href = APP_SCHEME;
      return;
    }

    window.location.href = ANDROID_STORE_URL;
  };

  if (hidden) return null;

  return (
    <div
      className={clsx(
        "flex md:w-fit flex-col md:flex-row items-center gap-4 md:gap-6 p-4 md:p-6",
        bgColor,
        rounded,
      )}
    >
      <div className="flex-1 flex flex-col justify-center gap-4 w-full">
        <h6 className="text-center heading-medium !font-semibold text-surface-gray-normal">
          {t("appDownload.titleLine1")}
          <br />
          {t("appDownload.titleLine2")}
        </h6>

        <div className="flex flex-col gap-3">
          <FeatureRow
            icon={
              <PenIcon variant="book-pen" size={20} color="var(--color-brand)" />
            }
            title={t("appDownload.features.completeCourse.title")}
            subtitle={t("appDownload.features.completeCourse.subtitle")}
          />
          <FeatureRow
            icon={
              <PenIcon variant="pencil" size={20} color="var(--color-brand)" />
            }
            title={t("appDownload.features.practiceMore.title")}
            subtitle={t("appDownload.features.practiceMore.subtitle")}
          />
          <FeatureRow
            icon={<TrophyIcon size={20} />}
            title={t("appDownload.features.clearExam.title", {
              exam: examTitle,
            })}
            subtitle={t("appDownload.features.clearExam.subtitle")}
          />
        </div>

        <div className="flex flex-col gap-2 items-start w-full">
          <div className=" w-full">
            <MainButton
              fullWidth
              bgColor="var(--color-brand)"
              rounded="50px"
              rightIcon={<ChevronRightIcon width={16} strokeWidth={3} />}
              size="md"
              text={t("appDownload.continueInApp")}
              onClick={handleContinueInApp}
            />
          </div>
          <RotatingBadge
            animationDuration={0.45}
            direction="up"
            text={t("appDownload.unlockTopics")}
            items={["Videos", "Notes", "PDFs", "Tests"]}
          />
        </div>
      </div>

      {/* <div className="shrink-0">
        <Image
          src="/images/app-download-illustration.png"
          alt={t("appDownload.titleLine1")}
          width={242}
          height={274}
          className="w-[160px] md:w-[200px] h-auto"
          priority
        />
      </div> */}
    </div>
  );
}

function FeatureRow({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 shrink-0 rounded-md bg-brand/9 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="heading-small !font-semibold text-surface-gray-normal">
          {title}
        </div>
        <div className="body-small !font-normal text-surface-gray-muted">
          {subtitle}
        </div>
      </div>
    </div>
  );
}
