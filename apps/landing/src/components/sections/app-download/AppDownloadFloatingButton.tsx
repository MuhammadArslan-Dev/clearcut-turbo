import { Download } from "lucide-react";
import clsx from "clsx";
import { Button } from "@clearcut/ui/button";
import { Locale, defaultLocale } from "@/lib/i18n/config";
import DownloadLinkButton from "./DownloadLinkButton";
import { PLAY_STORE_URL } from "@/lib/data/appLinks";
import type { AppPlatform } from "./AppDownloadHero";

const CTA_LABEL: Record<Locale, Record<AppPlatform, string>> = {
  en: { android: "Download on Google Play", ios: "Coming soon on the App Store" },
  hi: { android: "Google Play पर डाउनलोड करें", ios: "App Store पर जल्द आ रहा है" },
  mr: { android: "Google Play वर डाउनलोड करा", ios: "App Store वर लवकरच येत आहे" },
};

// Mobile-only sticky download bar — same structure/tokens as the homepage's
// `components/global/FloatingButton.tsx` ("Start 3-day FREE trial").
export default function AppDownloadFloatingButton({
  platform,
  locale = defaultLocale,
}: {
  platform: AppPlatform;
  locale?: Locale;
}) {
  const label = CTA_LABEL[locale][platform];
  const isAndroid = platform === "android";

  return (
    <div className={clsx("sticky bottom-0 z-50 right-0 left-0")}>
      <div className="md:hidden z-[var(--z-floating-cta)] bg-white w-full py-3 px-3 shadow-[var(--shadow-floating-bar)] transition-shadow duration-300">
        {isAndroid ? (
          <DownloadLinkButton href={PLAY_STORE_URL} icon={<Download size={18} />} className="w-full">
            {label}
          </DownloadLinkButton>
        ) : (
          <Button variant="solid" color="primary" size="lg" disabled fullWidth sx={{ borderRadius: "50px" }} leftIcon={<Download size={18} />}>
            {label}
          </Button>
        )}
      </div>
    </div>
  );
}
