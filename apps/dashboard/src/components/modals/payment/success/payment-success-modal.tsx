import React, { useMemo, useCallback } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useCourseStore } from "@/store/course/useCourseStore";
import { ArrowIcon, CheckIcon, FireIcon } from "@/components/ui/icons";
import { AnimatePresence } from "framer-motion";
import ShimmerButton from "@/components/ui/button/shimmer-button";
import { useLocale, useTranslations } from "next-intl";
import { useMyActiveCourses } from "@/hooks/course/useMyActiveCourses";
import { Modal } from "@/components/features/Sheets/Modal";
import { DrawerSheet } from "@/components/features/Sheets/DrawerSheet";
import { token } from "@/lib/auth-token-client";
import { trackEvent } from "@/lib/analytics/browser";
import { useLevels } from "@/hooks/onboarding/useLevels";
import { parseTranslation } from "@/utils/text/translation";
import { LevelTranslation } from "@/lib/api/onboarding";
import { Skeleton } from "@/components/ui/skeleton";
import StatusChip from "@/components/ui/cards/preparation/chapter-list/StatusChip";
import { useDrawerBackHandler } from "@/hooks/Global/useDrawerBackHandler";
import { useRouter } from "@/i18n/navigation";

const FEATURES = ["featureVideos", "featureNotes", "featureTests"] as const;

export default function PaymentSuccessModal() {
  const { isOpen, data, close, mode } = useCourseStore();
  const isMobile = useIsMobile();
  const modalT = useTranslations("payment");
  const { activeCourse } = useMyActiveCourses();
  const locale = useLocale(); // "en", "hi", etc.
  useDrawerBackHandler();
  const router = useRouter();

  const {
    levels: levelsRaw = [],
    loading: levelsLoading,
    error,
  } = useLevels(data?.id);

  /* ---------------------------------- container (stable) ---------------------------------- */
  const Container = useMemo(() => (isMobile ? DrawerSheet : Modal), [isMobile]);

  /* ---------------------------------- derived values ---------------------------------- */

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

  /* ---------------------------------- handlers ---------------------------------- */
  const handleResume = useCallback(async () => {
    if (!activeCourse?.uuid) return;
    await trackEvent("Content Started", {
      source: "payment_success_modal",
      exam_name: activeCourse.exam?.short_name!,
    });
    
    router.push(`/preparation/${activeCourse?.group_code}`);

    // window.location.href = `https://app.clearcutoff.in/prepration/${
    //   activeCourse.uuid
    // }?token=${token()}`;
  }, [activeCourse?.uuid]);

  /* ---------------------------------- render ---------------------------------- */
  return (
    <AnimatePresence>
      {isOpen && mode === "payment-success" && (
        <Container
          maxWidth="max-w-[600px] !rounded-t-lg"
          isHeader={false}
          maxHeight="max-h-[95vh]"
          isOpen
          onClose={close}
        >
          <div className="bg-gray-100 h-full flex flex-col min-h-[70vh] justify-between md:gap-2">
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
                  {modalT("paymentSuccess.officialPrep", {
                    exam: examTitle,
                  })}
                </div>
                <div className="body-small !font-normal text-surface-gray-muted">
                  {modalT("paymentSuccess.startPrep", {
                    exam: examTitle,
                  })}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="w-full flex justify-center">
              <div className="max-w-[352px] w-full flex flex-col gap-5 bg-white p-4 rounded-lg">
                <div className="flex flex-col gap-8">
                  <div className="flex flex-col items-center gap-4">
                    <CheckIcon size={48} color="var(--color-success)" />

                    <div className="text-center">
                      <div className="heading-large !font-semibold text-surface-gray-normal">
                        {modalT("paymentSuccess.unlockedTitle", {
                          exam: examTitle,
                        })}
                      </div>
                      <p className="body-small text-surface-gray-muted">
                        {modalT("paymentSuccess.featuresAvailable")}
                      </p>
                      <div className="mt-2">
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

                  <div className="flex justify-center">
                    <div className="flex flex-col gap-2 items-start">
                      {FEATURES.map((key) => (
                        <div key={key} className="flex items-center gap-2">
                          <CheckIcon color="var(--color-success)" />
                          <div className="text-surface-gray-muted body-medium flex-1">
                            {modalT(`paymentSuccess.${key}`)}
                          </div>
                        </div>
                      ))}
                    </div>
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
                      onClick={handleResume}
                      size="lg"
                      iconPosition="right"
                      text={modalT("paymentSuccess.resume", {
                        exam: examTitle,
                      })}
                    />
                  </div>

                  <div className="flex body-small items-center gap-2 text-surface-gray-muted">
                    <div className="flex items-center gap-2">
                      <FireIcon
                        size={20}
                        variant="outline"
                        color="gray-muted"
                      />
                      <p>
                        {modalT("paymentSuccess.followUpStudents", {
                          exam: examTitle,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      )}
    </AnimatePresence>
  );
}
