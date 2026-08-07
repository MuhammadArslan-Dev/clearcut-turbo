import clsx from "clsx";
import { useTranslations } from "next-intl";
import React from "react";
import MainButton from "../../button/main-button";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { CourseCheckBadge, FireIcon } from "../../icons";
import { RotatingBadge } from "../../animation/RotatingBadge";

type AppDownloadWidgetProps = {
  bgColor?: string;
  rounded?: string;
};

export default function AppDownloadWidget({
  bgColor = "bg-white",
  rounded = "rounded-md",
}: AppDownloadWidgetProps) {
  const t = useTranslations();

  return (
    <div className={clsx("flex p-4 flex-col gap-4", bgColor, rounded)}>
      {/* Header */}
      <div>
        <h6 className="heading-medium !font-semibold">
          {t("appDownload.title")}
        </h6>
        <div className="body-small !font-normal text-surface-gray-muted">
          {t("appDownload.subtitle")}
        </div>
      </div>

      <div className="flex flex-col justify-between items-center">
        <div className="space-y-3">
          <div className="flex justify-start items-center">
            <div className="flex gap-2">
              <CourseCheckBadge />
              <p className="body-medium !font-normal text-surface-gray-normal">
                {t("appDownload.offlineNotes")}
              </p>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <CourseCheckBadge />
              <p className="body-medium !font-normal text-surface-gray-normal">
                {t("appDownload.dailyReminders")}
              </p>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <CourseCheckBadge />
              <p className="body-medium !font-normal text-surface-gray-normal">
                {t("appDownload.fasterTests")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-1 w-full justify-center items-center text-center">
        <div className="flex w-full flex-col gap-2 items-center">
          <div className="max-w-[320px] w-full">
            <MainButton
              fullWidth
              bgColor="#0053A2"
              rightIcon={<ChevronRightIcon width={16} strokeWidth={3} />}
              size="md"
              text={t("appDownload.continueInApp")}
            />
          </div>
          <RotatingBadge
            animationDuration={0.45}
            direction="up"
            text={t("appDownload.unlockTopics")}
            items={["Videos", "Notes", "PDFs", "Tests"]}
          />
        </div>
      </div>
    </div>
  );
}
