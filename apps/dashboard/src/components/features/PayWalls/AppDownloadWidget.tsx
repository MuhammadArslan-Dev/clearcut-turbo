import { RotatingBadge } from "@/components/ui/animation/RotatingBadge";
import Button from "@clearcut/ui/button";
import { Card } from "@clearcut/ui/card";
import { trackEvent } from "@/lib/analytics/browser";
import React, { useEffect, useState } from "react";

export default function AppDownloadWidget() {
  const [isWebView, setIsWebView] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/wv/.test(ua) || /Android.*Version\/[\d.]+/.test(ua)) {
      setIsWebView(true);
    }
  }, []);

  const handleOpenApp = async () => {
    const appScheme = "myapp://home"; // <-- change this
    const playStoreUrl =
      "https://play.google.com/store/apps/details?id=com.shani9300.ClearCutoffApp"; // <-- change this

    await trackEvent("App Download Initiated", {
      widget_location: "course_page",
      widget_type: "floating_widget",
    });

    const timeout = setTimeout(() => {
      window.location.href = playStoreUrl;
    }, 1500);

    window.location.href = appScheme;

    window.addEventListener("blur", () => {
      clearTimeout(timeout);
    });
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
