"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Modal } from "@/components/features/Sheets/Modal";
import { BottomSheet } from "@/components/features/Sheets/BottomSheet";
import { Button } from "@clearcut/ui/button";
import ShimmerButton from "@/components/ui/button/shimmer-button";
import {
  ArrowIcon,
  CheckIcon,
  CrossIcon,
  LockIcon,
} from "@/components/ui/icons";
import { useDrawerBackHandler } from "@/hooks/Global/useDrawerBackHandler";
import { usePaywallsStore } from "./usePaywallsStore";
import { handleOpenPaywall } from "./PaywallFloatingWidget";
import { useRouter } from "@/i18n/navigation";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

/**
 * Interstitial shown before a locked chapter/topic/test card sends the user
 * to `/payment/initiated` — same open/close/back-handler wiring as
 * MainPaywall/PreparationPaywall (usePaywallsStore + Modal/BottomSheet
 * Container + useDrawerBackHandler), just simpler content. One component
 * covers both variants (mode drives copy + icon set) instead of duplicating
 * the file per variant.
 */
export default function LockedContentModal() {
  const { isOpen, mode, close, source, course } = usePaywallsStore();
  const isMobile = useIsMobile();
  const router = useRouter();
  useDrawerBackHandler();

  const isTest = mode === "test-locked-modal";
  const modalT = useTranslations(
    isTest ? "modals.testLockedModal" : "modals.topicLockedModal",
  );

  const Container = useMemo(() => (isMobile ? BottomSheet : Modal), [isMobile]);

  const examTitle = course?.exam?.short_name ?? "";

  const features = isTest
    ? [
        modalT("features.attemptTest"),
        modalT("features.detailedSolutions"),
        modalT("features.compareRank"),
        modalT("features.improveClear", { exam: examTitle }),
      ]
    : [
        modalT("features.accessTopic"),
        modalT("features.practiceTests"),
        modalT("features.trackProgress"),
        modalT("features.boostScore"),
      ];

  return (
    <AnimatePresence>
      {isOpen &&
        (mode === "topic-locked-modal" || mode === "test-locked-modal") && (
          <Container
            maxWidth="max-w-[420px] !rounded-t-lg"
            isHeader={false}
            maxHeight="max-h-[95vh]"
            isOpen
            onClose={close}
          >
            <div className="bg-white flex flex-col gap-3 p-5">
              {/* Close */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={close}
                  className="cursor-pointer"
                  aria-label="Close"
                >
                  <CrossIcon />
                </button>
              </div>

              {/* Lock icon + title */}
              <div className="flex flex-col items-center gap-1 -mt-6">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4">
                
                  <DotLottieReact
                    src="https://lottie.host/a5ed70b4-cf37-4dd6-9017-f8bb2308cef1/3gFWeilvP5.lottie"
                    loop
                    autoplay
                  />
                </div>
                <div className="heading-large !font-semibold text-surface-gray-normal text-center">
                  {modalT("title")}
                </div>
                <div className="body-medium text-surface-gray-muted text-center">
                  {modalT("subtitle")}
                </div>
              </div>

              {/* Illustration */}
              <div className="flex items-center justify-center py-2">
                <Image
                  src={
                    isTest
                      ? "/images/test-locked-illustration.png"
                      : "/images/topic-locked-illustration.png"
                  }
                  alt={modalT("title")}
                  width={isTest ? 545 : 550}
                  height={260}
                  className="w-full max-w-[362px] h-auto"
                  priority
                />
              </div>

              {/* Unlock and get */}
              <div className="flex items-center justify-center">
                <div className="bg-[var(--background-gray-subtle)] rounded-md py-4 px-8 flex flex-col gap-3 w-fit items-center">
                  <div className="heading-small !font-semibold text-surface-gray-normal">
                    {modalT("unlockAndGet")}
                  </div>
                  <div className="flex flex-col gap-2">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckIcon size={18} />
                        <span className="body-medium text-surface-gray-normal">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col gap-2">
                <ShimmerButton
                  onClick={() =>
                    handleOpenPaywall(
                      router,
                      source ?? "topic_card_clicked",
                      course,
                    )
                  }
                  size="lg"
                  iconPosition="right"
                  icon={
                    <LockIcon variant="without-key" size={16} color="white" />
                  }
                  text={modalT("cta")}
                />
                <Button
                  onClick={close}
                  fullWidth
                  size="sm"
                  sx={{ borderRadius: "50px" }}
                  color="gray"
                  variant="soft"
                >
                  <div className="flex items-center gap-2">
                    <ArrowIcon />
                    <span>{modalT("continueFree")}</span>
                  </div>
                </Button>
              </div>
            </div>
          </Container>
        )}
    </AnimatePresence>
  );
}
