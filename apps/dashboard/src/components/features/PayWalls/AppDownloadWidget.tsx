import { RotatingBadge } from "@/components/ui/animation/RotatingBadge";
import Button from "@clearcut/ui/button";
import { Card } from "@clearcut/ui/card";
import { trackEvent } from "@/lib/analytics/browser";
import React, { useEffect, useState } from "react";

// Real values, confirmed against the RN app's app.json / constants/config.ts.
const APP_SCHEME = "clearcutoffapp://";
const ANDROID_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.clearcutoff.app";
// The iOS app isn't published yet (constants/config.ts has an empty
// IOS_APP_ID) — there's no store link to fall back to on iOS until then.

export default function AppDownloadWidget() {
  const [isWebView, setIsWebView] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    // `window.ReactNativeWebView` is injected automatically by the
    // react-native-webview package on both Android and iOS — no native app
    // change needed, and it catches iOS (whose WKWebView doesn't mark
    // itself in the user agent the way Android's WebView does with "wv").
    if (
      typeof (window as any).ReactNativeWebView !== "undefined" ||
      /wv/.test(ua) ||
      /Android.*Version\/[\d.]+/.test(ua)
    ) {
      setIsWebView(true);
    }
  }, []);

  const handleOpenApp = async () => {
    await trackEvent("App Download Initiated", {
      widget_location: "course_page",
      widget_type: "floating_widget",
    });

    const isIOSDevice = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isIOSDevice) {
      const timeout = setTimeout(() => {
        window.location.href = ANDROID_STORE_URL;
      }, 1500);

      window.addEventListener("blur", () => clearTimeout(timeout), {
        once: true,
      });
    }

    window.location.href = APP_SCHEME;
  };

  return (
    !isWebView && (
      <div className="px-3 md:px-4 ">
        <Card padding={"12px 16px"} bgcolor="bg-white">
          <div className="flex w-full flex-col gap-2 items-center">
            <Button
              fullWidth
              size="lg"
              rounded="50px"
              bgColor="var(--color-brand-dark)"
              onClick={handleOpenApp}
            >
              <div className="flex items-center gap-1">
                <span>Continue in App</span>
              </div>
            </Button>

            <RotatingBadge
              animationDuration={0.45}
              direction="up"
              text="Unlock one topic daily for FREE in App —"
              items={["Videos", "Notes", "PDFs", "Tests"]}
            />
          </div>
        </Card>
      </div>
    )
  );
}
