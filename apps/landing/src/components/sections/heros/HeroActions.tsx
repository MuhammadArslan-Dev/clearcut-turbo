"use client";
import Text from "@clearcut/ui/text";
import StarIcon from "../../icons/star-icon";
import FireIcon from "@/components/icons/fire-icon";
import ContinueFreeButton from "@/components/ui/buttons/ContinueFreeButton";
import { Locale } from "@/lib/i18n/config";
import { useLocale } from "next-intl";

const COPY: Record<Locale, { trial: string; noCard: string; rating: string }> = {
  en: {
    trial: "3-day free trial",
    noCard: "No card or payment required",
    rating: "Average rating given by our students",
  },
  hi: {
    trial: "3 दिन का फ्री ट्रायल",
    noCard: "कोई कार्ड या भुगतान आवश्यक नहीं",
    rating: "हमारे विद्यार्थियों द्वारा दी गई औसत रेटिंग",
  },
};

export default function HeroActions() {
  const t = COPY[useLocale()];
  return (
    <div className="flex flex-col items-center md:items-start gap-4">
      <div className="flex md:flex-row flex-col items-center justify-between w-full gap-6">
        <div className="flex flex-col justify-between items-center gap-4">
          <ContinueFreeButton showIcon={false} fullWidth size="lg" />
          <div className="space-y-1">
            <div className="mx-auto max-w-[150px] min-w-[130px]">
              <div className="px-3 py-1 rounded-full bg-brand/10 text-brand body-medium flex border-2 border-brand items-center justify-center !font-semibold">
                {t.trial}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <FireIcon size={16} variant="outline" />
              <Text as="p" variant="body-small" color="gray-muted" className="text-center md:text-left">
                {t.noCard}
              </Text>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700 w-[220px] h-[40px] bg-[#f8fafc] px-3 rounded-md">
          <StarIcon size={32} type="filled" />
          <span className="heading-large !font-semibold">4.9</span>
          <span className="text-gray-500 body-xsmall !font-normal">{t.rating}</span>
        </div>
      </div>
    </div>
  );
}
