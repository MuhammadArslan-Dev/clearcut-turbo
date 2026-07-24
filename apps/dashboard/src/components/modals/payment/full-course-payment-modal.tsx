"use client";

import React, { useMemo, useCallback } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";

import { useCourseStore } from "@/store/course/useCourseStore";
import {
  ArrowIcon,
  CheckIcon,
  LockIcon,
  PaymentCardIcon,
  SheildIcon,
  TrophyIcon,
} from "@/components/ui/icons";
import { highlightTextUtil } from "@/utils/text/highlightTextUtil";
import Image from "next/image";
import ShimmerButton from "@/components/ui/button/shimmer-button";
import { Button } from "@mui/joy";
import { AnimatePresence } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useRazorpayPayment } from "@/hooks/payment/useRazorpayPayment";
import { Modal } from "@/components/features/Sheets/Modal";
import { DrawerSheet } from "@/components/features/Sheets/DrawerSheet";
import { useLevels } from "@/hooks/onboarding/useLevels";
import { parseTranslation } from "@/utils/text/translation";
import { LevelTranslation } from "@/lib/api/onboarding";
import StatusChip from "@/components/ui/cards/preparation/chapter-list/StatusChip";
import { Skeleton } from "@/components/ui/skeleton";
import { useDrawerBackHandler } from "@/hooks/Global/useDrawerBackHandler";

const FALLBACK_IMAGE =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNYAyuu-blwzsEjTj92dldM2I2UvueiguRwA&s";

const FEATURES = [
  { text: "latestPattern", highlight: "latestPatternHighlight" },
  { text: "fullCourse", highlight: "fullCourseHighlight" },
  { text: "topperTests", highlight: "topperTestsHighlight" },
];

export default function FullCoursePaymentModal() {
  const modalT = useTranslations("modals.unlockFullAccessModal");
  const { isOpen, data, close, mode, open } = useCourseStore();
  const isMobile = useIsMobile();
  const locale = useLocale(); // "en", "hi", etc.
  useDrawerBackHandler();

  const {
    levels: levelsRaw = [],
    loading: levelsLoading,
    error,
  } = useLevels(data?.id);



  /* ---------------------------------- container (stable) ---------------------------------- */
  const Container = useMemo(() => (isMobile ? DrawerSheet : Modal), [isMobile]);

  /* ---------------------------------- payment hook ---------------------------------- */
  const { handlePayment, loading } = useRazorpayPayment({
    examId: data?.id!,
    examName: data?.short_name!,
    price: Number(data?.price),
    onClose: close,
    onSuccess: () => open("payment-success", data!),
    onFailure: () => open("payment-failed", data!),
  });

  /* ---------------------------------- memoized derived values ---------------------------------- */

  const rootLevels = useMemo(
    () => levelsRaw?.filter((item) => item.parent_id === null) ?? [],
    [levelsRaw]
  );

  const papers = useMemo(() => {
    return rootLevels.map((item) => {
      const translation = parseTranslation<LevelTranslation>(item.translation);
      const t = translation?.[locale];

      return {
        id: item.id,
        name: t?.name ?? item.name,
        group: t?.group ?? item.group,
        detail: t?.detail ?? "",
        slug: item.slug,
      };
    });
  }, [rootLevels, locale]);

  const examTitle = useMemo(
    () => `${data?.short_name ?? ""} Exam`,
    [data?.short_name]
  );

  const examPrice = useMemo(() => Number(data?.price) ?? 0, [data?.price]);

  const examLogo = useMemo(
    () => data?.logo_url || FALLBACK_IMAGE,
    [data?.logo_url]
  );

  /* ---------------------------------- handlers ---------------------------------- */
  const handlePayClick = useCallback(() => {
    handlePayment();
  }, [handlePayment]);

  /* ---------------------------------- render ---------------------------------- */
  return (
    <AnimatePresence>
      {isOpen && mode === "payment" && (
        <Container
          maxWidth="max-w-[600px] !rounded-t-lg"
          isHeader={false}
          maxHeight="max-h-[95vh]"
          isOpen
          onClose={close}
        >
          <div className="bg-gray-100 h-full flex flex-col justify-between md:gap-2">
            {/* Header */}
            <div className="sticky top-0 z-10 flex gap-4 px-3 py-4 bg-white">
              <button
                type="button"
                onClick={close}
                className="cursor-pointer"
                aria-label="Go back"
              >
                <ArrowIcon />
              </button>

              <div>
                <div className="heading-medium !font-semibold text-surface-gray-normal">
                  {modalT("title")}
                </div>
                <div className="body-small !font-normal text-surface-gray-muted">
                  {modalT("subtitle", { exam: examTitle })}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="w-full flex justify-center">
              <div className="max-w-[352px] w-full flex flex-col gap-5 bg-white p-4 rounded-lg">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <Image
                      src={examLogo}
                      alt={data?.short_name || "Course logo"}
                      width={64}
                      height={64}
                      className="w-[64px] h-[64px] object-cover rounded-full"
                      priority
                    />
                    <div className="heading-large !font-semibold text-surface-gray-normal">
                      {examTitle}
                    </div>
                    <div className="">
                      {levelsLoading ? (
                        <Skeleton className="h-6 rounded-full" />
                      ) : papers.length > 0 ? (
                        <StatusChip
                          className="!text-brand !bg-brand/9 !body-medium !font-semibold"
                          label={papers.map((item) => item.name).join(" + ")}
                        />
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {FEATURES.map((item) => (
                      <div key={item.text} className="flex items-center gap-2">
                        <CheckIcon color="var(--color-success)" />
                        <div className="text-surface-gray-subtle body-medium flex-1">
                          {highlightTextUtil(
                            modalT(`features.${item.text}`),
                            modalT(`features.${item.highlight}`),
                            "body-medium !font-semibold text-surface-gray-subtle"
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing */}
                <div className="p-3 flex flex-col items-center bg-[var(--background-gray-subtle)] rounded-md gap-1">
                  <div className="body-small text-surface-gray-muted flex items-center gap-1">
                    {highlightTextUtil(
                      `₹${examPrice} ${modalT("price.taxInfo")}`,
                      `₹${examPrice}`,
                      "heading-xlarge !font-semibold text-surface-gray-normal"
                    )}
                  </div>

                  <p className="body-medium text-surface-gray-subtle flex items-center gap-2">
                    <SheildIcon />
                    <span>{modalT("validity")}</span>
                  </p>

                  <div className="flex items-center gap-1">
                    <TrophyIcon
                      size={16}
                      color="var(--color-surface-gray-muted)"
                      variant="outline"
                    />
                    <p className="body-small text-surface-gray-muted">
                      {modalT("trustedBy", { count: 1000 })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 z-10 px-3 py-2 bg-white">
              <div className="w-full flex flex-col items-center gap-4">
                <div className="w-full flex flex-col items-center gap-1">
                  <div className="w-full max-w-[400px]">
                    <ShimmerButton
                      onClick={handlePayClick}
                      size="lg"
                      loading={loading}
                      iconPosition="right"
                      icon={
                        <LockIcon
                          variant="without-key"
                          size={16}
                          color="white"
                        />
                      }
                      text={modalT("cta", { exam: examTitle })}
                    />
                  </div>

                  <div className="flex body-small items-center gap-2 text-surface-gray-muted">
                    <div className="flex items-center gap-2">
                      <LockIcon
                        size={20}
                        color="var(--color-surface-gray-muted)"
                      />
                      <p>{modalT("paymentInfo")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <PaymentCardIcon
                        size={16}
                        variant="outline"
                        color="var(--color-surface-gray-muted)"
                      />
                      <p>{modalT("paymentMethods")}</p>
                    </div>
                  </div>
                </div>

                <div className="w-full max-w-[400px]">
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
            </div>
          </div>
        </Container>
      )}
    </AnimatePresence>
  );
}
