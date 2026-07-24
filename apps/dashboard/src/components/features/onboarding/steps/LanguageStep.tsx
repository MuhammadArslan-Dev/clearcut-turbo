// app/onboarding/steps/LanguageStep.tsx
import React, { useEffect } from "react";
import Image from "next/image";
import { highlightTextUtil } from "@/utils/text/highlightTextUtil";
import EnLangCirlcIcon from "@/components/ui/icons/en-lang-circle-icon";
import HindiLangCirclIcon from "@/components/ui/icons/hindi-lang-circle-icon";
import MainContainer from "@/components/ui/main-container";
import { StepProps } from "@/types/onboarding/onboarding";
import { useTranslations } from "next-intl";
import useLanguageSwitch from "@/hooks/useLanguageSwitch";
import { trackEvent } from "@/lib/analytics/browser";
import { AppLanguageCode } from "@/lib/analytics/events/onboarding";
import ShimmerButton from "@/components/ui/button/shimmer-button";
import { motion } from "framer-motion";
import useButtonArrowAnimation from "@/hooks/useButtonArrowAnimation";
import { useSearchParams } from "next/navigation";
import OptionSelectionCard from "@/components/ui/cards/option-selection-card";
import { ChevronIcon } from "@/components/ui/icons";
import MainButton from "@/components/ui/button/main-button";

const LANGUAGES = [
  { id: "हिंदी", title: "हिंदी", code: "hi", icon: <HindiLangCirclIcon /> },
  { id: "English", title: "English", code: "en", icon: <EnLangCirlcIcon /> },
];

export default function LanguageStep({
  data,
  steps,
  currentStep,
  updateData,
  goNext,
  goBack,
  isFirst,
}: StepProps) {
  const { switchLanguage } = useLanguageSwitch();
  const searchParams = useSearchParams();

  const selectLanguage = (lang: {
    id: string;
    title: string;
    code: string;
    icon: React.ReactNode;
  }) => {
    switchLanguage(lang.code);

    updateData({ language: lang.code });
  };

  useEffect(() => {
    const lang = searchParams.get("lang");
    const course = searchParams.get("course");
    if (course) {
      localStorage.setItem("UPCOMING_COURSE", course);
    }

    if (lang) {
      const selectedLang = LANGUAGES.find((item) => item.code === lang);
      if (selectedLang) {
        selectLanguage(selectedLang);
      }
    }
  }, []);

  const t = useTranslations("");

  const step = steps[currentStep];

  const { buttonPhase } = useButtonArrowAnimation({
    data: !!data.language || null,
  });

  return (
    <div className="w-full h-screen bg-white">
      <MainContainer maxWidth={"max-w-[850px]"} padding="md:pt-14">
        <div className="px-3 py-4 space-y-3">
          <div className="flex flex-col gap-8 items-center">
            <div className="px-4 pt-6 mb-2 flex flex-col items-center justify-between">
              <div className="heading-xlarge !font-semibold text-surface-gray-normal text-center">
                {t("Onboarding.language.welcome_to")}
              </div>
              <div>
                <Image
                  src={"/logos/clear_cutoff_logo.png"}
                  width={239}
                  height={48}
                  alt="Main Logo"
                  className="w-[239px] h-[48px]"
                />
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="heading-xlarge !font-semibold text-surface-gray-normal text-center">
                {highlightTextUtil(
                  t("Onboarding.language.choose_language"),
                  t("Onboarding.language.highlight_text"),
                )}
              </div>
              <div className="body-medium !font-normal text-surface-gray-muted text-center">
                {t("Onboarding.language.description")}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 py-4">
            {LANGUAGES.map((lang) => (
              <OptionSelectionCard
                key={lang.id}
                content={
                  <span className="flex items-center gap-2">
                    {" "}
                    {lang.icon}
                    <p>{lang.title}</p>
                  </span>
                }
                selected={data.language === lang.code}
                showIcon={true}
                borderRadius={8}
                onClick={() => selectLanguage(lang)}
              />
            ))}
          </div>
        </div>

        <div className="py-2 px-4 bg-white fixed bottom-0 left-0 right-0 md:static md:bottom-auto md:left-auto md:right-auto">
          <MainButton
            text={t("actions.continue")}
            fullWidth={true}
            showShimmer={buttonPhase === "shimmer" || buttonPhase === "icon"}
            disabled={!data.language}
            onClick={() => {
              trackEvent("Onboarding Step Completed", {
                step_number: 1,
                step_name: "language_selection",
                app_language_choice: data.language as AppLanguageCode,
              });
              goNext();
            }}
            
          />
      
        </div>
      </MainContainer>
    </div>
  );
}
