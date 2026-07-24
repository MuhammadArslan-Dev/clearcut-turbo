"use client";
import React, { useMemo, useCallback, useEffect } from "react";
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
import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";
import Text from "@clearcut/ui/text";

const FEATURES = ["featureVideos", "featureNotes", "featureTests"] as const;

export default function Success() {
  const isMobile = useIsMobile();
  const modalT = useTranslations("payment");
  const { activeCourse, allCourses } = useMyActiveCourses();
  const open = useCourseStore((s) => s.open);
  const locale = useLocale(); // "en", "hi", etc.
  useDrawerBackHandler();
  const router = useRouter();

  const { get, set } = useQueryParams();

  const courseId = get("exam_id") as string;
  const courseName = get("course_name") as string;
  const source = get("source") as string;
  const price = get("price") as string;

  useEffect(() => {
    if (!courseId) {
      router.push("/dashboard");
    }
  }, [courseId, router]);

  const course = allCourses?.find((c) => c?.group_code === courseId);
  const data = course?.exam;
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
    if (!activeCourse) return;
    if (activeCourse?.stage_id) {
      await trackEvent("Content Started", {
        source: "payment_success_modal",
        exam_name: course?.exam?.short_name!,
      });

      router.push(`/preparation/${course?.group_code}`);
    } else {
      open("single", activeCourse.exam!);
    };


    // router.push(`/preparation/${course?.group_code}`);
  }, [activeCourse?.uuid,open]);

  const Price = useMemo(
    () => JSON.parse(data?.price ?? "{}") ?? 0,
    [data?.price],
  );
  const comboPrice = useMemo(
    () => JSON.parse(data?.combo_price ?? "{}") ?? 0,
    [data?.combo_price],
  );

  /* ---------------------------------- render ---------------------------------- */
  return (
    <div className="bg-[#f1f5fa] min-h-screen w-full flex justify-center items-center sm:px-4">
      <div className="w-full sm:h-auto h-screen sm:max-w-[600px]  flex flex-col justify-between items-center gap-4">
        <div className="h-full flex flex-col min-h-[60vh] justify-between md:gap-2">
          {/* Header */}
          <div className="sticky w-full top-0 z-10 flex gap-4 px-3 py-4 bg-white">
            <button
              type="button"
              onClick={() => router.back()}
              className="cursor-pointer sm:hidden"
              aria-label="Go back"
            >
              <ArrowIcon />
            </button>

            <div className="w-full">
              <div className="heading-medium sm:text-center !font-semibold text-surface-gray-normal">
                {modalT("paymentSuccess.officialPrep", {
                  exam: examTitle,
                })}
              </div>
              <div className="body-small sm:text-center !font-normal text-surface-gray-muted">
                {modalT("paymentSuccess.startPrep", {
                  exam: examTitle,
                })}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="w-full sm:bg-white flex justify-center px-4">
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

                <div className="flex justify-center item-center">
                  <div className="w-[150px] bg-[#f1f5fa] h-7 rounded-md flex gap-1 items-center justify-center">
                    <div className="flex">
                      <Text as="p" variant="heading-medium" weight="semibold">
                        ₹
                      </Text>
                      <Text as="h5" variant="heading-medium" weight="semibold">
                        {price}
                      </Text>
                    </div>
                    <Text
                      as="h5"
                      variant="body-small"
                      className="text-surface-gray-muted"
                    >
                      (incl. GST)
                    </Text>
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
          <div className="sticky bottom-0 w-full z-10 px-3 py-2 bg-white">
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
                    <FireIcon size={20} variant="outline" color="gray-muted" />
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
      </div>
    </div>
  );
}
