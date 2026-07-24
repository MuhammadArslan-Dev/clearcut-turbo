"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

import { useIsMobile } from "@/hooks/useIsMobile";
import useLanguageSwitch from "@/hooks/useLanguageSwitch";
import { useModalStore } from "@/store/modal/useModalStore";
import { trackEvent } from "@/lib/analytics/browser";

import { BottomSheet } from "@/components/features/Sheets/BottomSheet";
import { Modal } from "@/components/features/Sheets/Modal";
import ShimmerButton from "@/components/ui/button/shimmer-button";
import OptionSelectionCard from "@/components/ui/cards/option-selection-card";
import {
  CrossIcon,
  HindiLangCircleIcon,
} from "@/components/ui/icons";
import EnLangCirlcIcon from "@/components/ui/icons/en-lang-circle-icon";
import type { AppLocale } from "@/types/components/language";

const LANGUAGES: { id: string; title: string; code: AppLocale; icon: React.ReactNode }[] = [
  {
    id: "हिंदी",
    title: "हिंदी",
    code: "hi",
    icon: <HindiLangCircleIcon />,
  },
  {
    id: "English",
    title: "English",
    code: "en",
    icon: <EnLangCirlcIcon />,
  },
];

export default function LanguageModal() {
  const isMobile = useIsMobile();
  const t = useTranslations("");
  const langT = useTranslations("modals.languageSelector");

  const { switchLanguage, locale } = useLanguageSwitch();
  const { isOpen, closeModal, stack } = useModalStore();

  const active = stack[stack.length - 1];

  const [userLocale, setUserLocale] = useState(locale);
  const [isSwitching, setIsSwitching] = useState(false);

  /* ---------------------------------- container ---------------------------------- */
  const Container = useMemo(
    () => (isMobile ? BottomSheet : Modal),
    [isMobile]
  );

  /* ---------------------------------- reset ONLY on open ---------------------------------- */
  useEffect(() => {
    if (isOpen) {
      setUserLocale(locale);
    }
  }, [isOpen]); // ❗ intentionally NOT depending on locale

  /* ---------------------------------- handlers ---------------------------------- */
  const handleConfirmLanguage = useCallback(() => {
    if (isSwitching) return;

    setIsSwitching(true);

    if (userLocale !== locale) {
      try {
        trackEvent("Language Setting Changed", {
          language_type: "app_language",
          from_language: locale,
          to_language: userLocale,
        });
      } catch {
        // analytics failure should not block the switch
      }
      // Hard redirect — page reloads with the new locale so there is no
      // stale-context race condition between the URL change and React re-render.
      switchLanguage(userLocale);
      return; // page is navigating; no further cleanup needed
    }

    closeModal("language");
    setIsSwitching(false);
  }, [
    userLocale,
    locale,
    switchLanguage,
    closeModal,
    isSwitching,
  ]);

  /* ---------------------------------- render ---------------------------------- */
  return (
    <AnimatePresence>
      {isOpen && active === "language" && (
        <Container
          isHeader={false}
          titleClass="heading-medium !font-semibold"
          isOpen={isOpen}
          onClose={() => closeModal("language")}
        >
          <div className="p-4 flex flex-col gap-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h6 className="heading-medium !font-semibold">
                {langT("title")}
              </h6>
              <button
                className="cursor-pointer"
                onClick={() => closeModal("language")}
                aria-label="Close language modal"
              >
                <CrossIcon />
              </button>
            </div>

            {/* Language options */}
            <div className="grid grid-cols-1 gap-4">
              {LANGUAGES.map((lang) => (
                <OptionSelectionCard
                  key={lang.id}
                  content={
                    <span className="flex items-center gap-2">
                      {lang.icon}
                      <p>{lang.title}</p>
                    </span>
                  }
                  selected={userLocale === lang.code}
                  showIcon
                  onClick={() => setUserLocale(lang.code)}
                />
              ))}
            </div>

            {/* Confirm button */}
            <ShimmerButton
              text={t("actions.confirm_language")}
              onClick={handleConfirmLanguage}
              size="md"
              gap={4}
              iconPosition="right"
              disabled={isSwitching}
            />
          </div>
        </Container>
      )}
    </AnimatePresence>
  );
}
