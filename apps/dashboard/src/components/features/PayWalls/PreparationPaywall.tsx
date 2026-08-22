"use client";

import React, { useMemo, useCallback } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";

import {
  ArrowIcon,
  CheckIcon,
  LockIcon,
  PaymentCardIcon,
} from "@/components/ui/icons";
import Image from "next/image";
import ShimmerButton from "@/components/ui/button/shimmer-button";
import { Button } from "@clearcut/ui/button";
import { AnimatePresence } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useRazorpayPayment } from "@/hooks/payment/useRazorpayPayment";
import { Modal } from "@/components/features/Sheets/Modal";
import { useLevels } from "@/hooks/onboarding/useLevels";
import { parseTranslation } from "@/utils/text/translation";
import { LevelTranslation } from "@/lib/api/onboarding";
import StatusChip from "@/components/ui/cards/preparation/chapter-list/StatusChip";
import { Skeleton } from "@/components/ui/skeleton";
import { useDrawerBackHandler } from "@/hooks/Global/useDrawerBackHandler";
import { usePaywallsStore } from "./usePaywallsStore";
import { BottomSheet } from "../Sheets/BottomSheet";
import WarningCirleIcon from "@/components/ui/icons/warning-circle-icon";
import { Card } from "@clearcut/ui/card";
import Text from "@clearcut/ui/text";
import StarIcon from "@/components/ui/icons/star-icon";
import { PaymentType } from "@/lib/payment/payment";
import { getPriceForVariant } from "@/lib/payment/examPriceOverrides";
import { useRouter } from "@/i18n/navigation";

export const FALLBACK_IMAGE =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNYAyuu-blwzsEjTj92dldM2I2UvueiguRwA&s";


export default function PreparationPaywall() {
  const modalT = useTranslations("modals.unlockFullAccessModal");
  const { isOpen, data, close, mode, open } = usePaywallsStore();
  const isMobile = useIsMobile();
  const locale = useLocale(); // "en", "hi", etc.
  const router = useRouter();
  useDrawerBackHandler();
  const [selectVariant, setSelectVariant] =
    React.useState<PaymentType>("1year");

  const {
    levels: levelsRaw = [],
    loading: levelsLoading,
  } = useLevels(data?.id);

  /* ---------------------------------- container (stable) ---------------------------------- */
  const Container = useMemo(() => (isMobile ? BottomSheet : Modal), [isMobile]);

  /* ---------------------------------- memoized derived values ---------------------------------- */

  const rootLevels = useMemo(
    () => levelsRaw?.filter((item) => item.parent_id === null) ?? [],
    [levelsRaw],
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
    [data?.short_name],
  );

  const Price = useMemo(
    () => JSON.parse(data?.price ?? "{}") ?? 0,
    [data?.price],
  );
  const comboPrice = useMemo(
    () => JSON.parse(data?.combo_price ?? "{}") ?? 0,
    [data?.combo_price],
  );

  const examLogo = useMemo(
    () => data?.logo_url || FALLBACK_IMAGE,
    [data?.logo_url],
  );

  // Per-exam override (e.g. HPTET → ₹799) from the same source of truth as
  // payment/initiated — see @/lib/payment/examPriceOverrides.
  const oneYearPrice = useMemo(
    () => getPriceForVariant("1year", null, data?.short_name),
    [data?.short_name],
  );

  /* ---------------------------------- payment hook ---------------------------------- */
  const { handlePayment, loading } = useRazorpayPayment({
    examId: data?.id!,
    examName: data?.short_name!,
    price: oneYearPrice, // 1year plan price
    // price:
    //   selectVariant === "6months"
    //     ? Price?.final_price
    //     : comboPrice?.final_price,
    type: selectVariant,
    onClose: close,
    onSuccess: () => {
      router.push('/payment/success');
      // window.location.reload();
    },
    onFailure: () => {},
  });

  /* ---------------------------------- handlers ---------------------------------- */
  const handlePayClick = useCallback(() => {
    handlePayment();
  }, [handlePayment]);

  /* ---------------------------------- render ---------------------------------- */
  return (
    <AnimatePresence>
      {isOpen && mode === "preparation-paywall" && (
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
              <div className="max-w-[352px] w-full flex flex-col gap-5 bg-white p-4 md:rounded-lg">
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
                </div>

                <div className="flex items-center justify-center gap-1">
                  <WarningCirleIcon
                    size={16}
                    color="var(--color-surface-gray-muted)"
                  />
                  <p className="body-small text-surface-gray-muted">
                    {modalT("everything_included_one_price")}
                  </p>
                </div>

                {/* pricing    */}
                <div className="flex flex-col gap-4">
                  {/* 6-month plan — replaced by 1-year plan at ₹599
                  <Card
                    padding={"8px 20px"}
                    borderRadius={4}
                    cursor="pointer"
                    bgcolor={
                      selectVariant === "6months"
                        ? "var(--color-primary-subtle)"
                        : "white"
                    }
                    bordercolor={
                      selectVariant === "6months" ? "var(--color-brand)" : "#ccc"
                    }
                    className={`exam-card transition-all duration-200 ease-out `}
                    onClick={() => { setSelectVariant("6months"); }}
                  >
                    <div className="flex justify-between items-center w-full">
                      <div className="flex flex-col">
                        <p className="heading-medium !font-semibold text-surface-gray-normal">
                          {modalT("months", { count: 6 })} • {"₹" + Price?.final_price}{" "}
                          <Text className="line-through" variant="body-small">{"₹" + Price?.actual_price}</Text>
                        </p>
                        <p className="body-small !font-normal text-surface-gray-muted">
                          {modalT("best_for_upcoming_exam")}
                        </p>
                      </div>
                      {selectVariant === "6months" ? <CheckIcon size={16} /> : <div className="border border-gray-400 w-4 h-4 rounded-full" />}
                    </div>
                  </Card>
                  */}

                  {/* 15-month plan — replaced by 1-year plan at ₹599
                  <Card
                    padding={"8px 20px"}
                    borderRadius={4}
                    cursor="pointer"
                    bgcolor={
                      selectVariant === "15months"
                        ? "var(--color-primary-subtle)"
                        : "white"
                    }
                    bordercolor={
                      selectVariant === "15months" ? "var(--color-brand)" : "#ccc"
                    }
                    className={`exam-card transition-all duration-200 ease-out `}
                    onClick={() => { setSelectVariant("15months"); }}
                  >
                    <div className="flex justify-between items-center w-full">
                      <div className="flex flex-col gap-1">
                        <p className="heading-medium !font-semibold text-surface-gray-normal">
                          {modalT("months", { count: 15 })} • {"₹" + comboPrice?.final_price}{" "}
                          <Text className="line-through" variant="body-small">{"₹" + comboPrice?.actual_price}</Text>
                        </p>
                        <div className="flex items-center gap-1">
                          <StarIcon />
                          <p className="body-small !font-normal text-surface-gray-muted">{modalT("most_popular")}</p>
                        </div>
                        <StatusChip className="!text-brand !bg-brand/9 !body-medium !font-semibold" variant="outline" tone="info" label={modalT("best_value_covers_next_exam")} />
                      </div>
                      {selectVariant === "15months" ? <CheckIcon size={16} /> : <div className="border border-gray-400 w-4 h-4 rounded-full" />}
                    </div>
                  </Card>
                  */}

                  {/* 1-year plan */}
                  <Card
                    padding={"8px 20px"}
                    borderRadius={4}
                    cursor="pointer"
                    bgcolor={
                      selectVariant === "1year"
                        ? "var(--color-primary-subtle)"
                        : "white"
                    }
                    bordercolor={
                      selectVariant === "1year" ? "var(--color-brand)" : "#ccc"
                    }
                    className={`exam-card transition-all duration-200 ease-out`}
                    onClick={() => setSelectVariant("1year")}
                  >
                    <div className="flex justify-between items-center w-full">
                      <div className="flex flex-col gap-1">
                        <p className="heading-medium !font-semibold text-surface-gray-normal">
                          {modalT("months", { count: 12 })} •{" "}
                          {`₹${oneYearPrice}`}
                        </p>
                        <div className="flex items-center gap-1">
                          <StarIcon />
                          <p className="body-small !font-normal text-surface-gray-muted">
                            {modalT("most_popular")}
                          </p>
                        </div>
                        <StatusChip
                          className="!text-brand !bg-brand/9 !body-medium !font-semibold"
                          variant="outline"
                          tone="info"
                          label={modalT("best_value_covers_next_exam")}
                        />
                      </div>

                      {selectVariant === "1year" ? (
                        <CheckIcon size={16} />
                      ) : (
                        <div className="border border-gray-400 w-4 h-4 rounded-full" />
                      )}
                    </div>
                  </Card>
                </div>

                <div className="flex items-center justify-center gap-1">
                  <WarningCirleIcon
                    size={16}
                    color="var(--color-surface-gray-muted)"
                  />
                  <p className="body-small text-surface-gray-muted">
                    {modalT("offline_coaching_cost", {
                      exam: examTitle,
                      min: 15000,
                      max: 25000,
                    })}
                  </p>
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
                      text={modalT("cta", {
                        exam: `₹${oneYearPrice}`,
                        // exam:
                        //   selectVariant === "6months"
                        //     ? "₹" + Price?.final_price
                        //     : "₹" + comboPrice?.final_price,
                      })}
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
