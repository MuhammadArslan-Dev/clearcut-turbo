"use client";
import Button from "@clearcut/ui/button";
import MainButton from "@/components/ui/button/main-button";
import { Card } from "@clearcut/ui/card";
import { ChevronIcon, LockIcon, SettingGearIcon } from "@/components/ui/icons";
import ProgressBar from "@/components/ui/ProgressBar";
import { CourseStatus } from "@/lib/status/courseStatus";
import { getCourseStatus } from "@/lib/status/getCourseStatus";
import { highlightTextUtil } from "@/utils/text/highlightTextUtil";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import Image from "next/image";
import React, { useMemo } from "react";

export interface MyCOurseCardProps {
  price?: string | React.ReactNode | null;
  logo?: string | null;
  courseName?: string | null;
  examData?: string | number | null;
  rating?: string | number | null;
  badge?: string;

  // progress bar
  topics?: {
    title?: string | null;
    completed?: string | number;
    total?: string | number;
  };
  tests?: {
    title?: string | null;
    completed?: string | number;
    total?: string | number;
  };

  maxWidth?: string;
  bgColor?: string;
  cardClasses?: string;

  // CTA Action
  continueClick?: () => void;
  unlockClick?: () => void;
  editClick?: () => void;
}

export default function MyCourseCard({
  price,
  bgColor,
  courseName,
  logo,
  examData,
  rating,
  badge,
  topics,
  tests,
  continueClick,
  unlockClick,
  editClick,
  maxWidth = "400px",
  cardClasses,
}: MyCOurseCardProps) {
  const t = useTranslations();
  const [continueLoading, setContinueLoading] = React.useState(false);
  const [unlockLoading, setUnlockLoading] = React.useState(false);

  const { label, color } = getCourseStatus(badge as CourseStatus, t, {
    color: false,
  });

  const examPrice = useMemo(() => JSON.parse(price ?? "{}") ?? 0, [price]);
  return (
    <Card
      bgcolor={bgColor}
      minWidth={"250px"}
      padding={0}
      maxWidth={maxWidth}
      className={cardClasses}
    >
      <div className="flex flex-col gap-3 px-4 pt-4 pb-2 relative">
        <div
          className={clsx(
            "absolute flex z-[1000] items-center -top-[10.5px] right-5 rounded-full text-center px-4 h-6 body-small !font-semibold ",
            color ? color : "bg-brand text-white",
          )}
        >
          {label}
        </div>

        <div className="flex items-center justify-between ">
          <div className="flex items-center gap-3">
            <div className="w-[48px] h-[48px] rounded-full overflow-hidden">
              <Image
                src={
                  logo ||
                  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNYAyuu-blwzsEjTj92dldM2I2UvueiguRwA&s"
                }
                alt=""
                width={48}
                height={48}
                className="w-[48px] h-[48px] object-cover rounded-full"
              />
            </div>
            <div>
              <h5 className="heading-large !font-semibold text-surface-gray-normal">
                {courseName}
              </h5>
            </div>
          </div>
          {editClick && (
            <Button
              onClick={() => editClick?.()}
              size="sm"
              color="gray"
              variant="soft"
              rounded="50px"
              rightIcon={<SettingGearIcon color="#000" size={12} />}
            >
              {t("actions.edit")}
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {topics && (
            <div className="flex flex-col gap-1 px-1">
              <div className="flex justify-between text-surface-gray-muted">
                <p className="body-medium !font-normal">
                  {t("myCourses.chaptersCompleted")}
                </p>
                <p className="body-medium !font-normal">
                  {highlightTextUtil(
                    topics?.completed + " / " + topics?.total,
                    String(topics?.completed),
                    "text-[#192839]",
                  )}
                </p>
              </div>
              <div>
                <ProgressBar
                  showLabel={false}
                  completed={Number(topics?.completed ?? 2)}
                  total={Number(topics?.total ?? 12)}
                />
              </div>
              <div className="heading-small !font-semibold !text-surface-text-gray-normal">
                {t("myCourses.chaptersLabel")}
              </div>
            </div>
          )}
          {tests && (
            <div className="flex flex-col gap-1 px-1">
              <div className="flex justify-between text-surface-gray-muted">
                <p className="body-medium !font-normal">
                  {t("myCourses.testsAttempted")}
                </p>
                <p className="body-medium !font-normal">
                  {highlightTextUtil(
                    tests?.completed + " / " + tests?.total,
                    String(tests?.completed),
                    "text-[#192839]",
                  )}
                  {/* {tests?.completed}/{tests?.total} */}
                </p>
              </div>
              <div>
                <ProgressBar
                  showLabel={false}
                  total={Number(tests?.total ?? 12)}
                  completed={Number(tests?.completed ?? 2)}
                />
              </div>
              <div className="heading-small !font-semibold text-surface-text-gray-normal">
                {t("myCourses.testSeriesLabel")}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 py-1">
          {continueClick && (
            <div>
              <MainButton
                loading={continueLoading}
                fullWidth
                onClick={() => {
                  setContinueLoading(true);
                  continueClick?.();
                }}
                text={
                  badge === "active"
                    ? t("myCourses.continueLearningActive")
                    : t("myCourses.continueLearning")
                }
                showShimmer
                rightIcon={<ChevronIcon size={20} />}
              />
            </div>
          )}
          {unlockClick && (
            <>
              <MainButton
                fullWidth
                loading={unlockLoading}
                color="success"
                text={t("myCourses.buyFullCourse")}
                rightIcon={<ChevronIcon size={20} />}
                onClick={() => {
                  setUnlockLoading(true);
                  unlockClick?.();
                }}
              />
              <div className="flex flex-col items-center gap-1">
                <p className="body-medium !font-normal text-surface-gray-subtle flex gap-2 items-center">
                  <LockIcon size={20} />{" "}
                  <span>
                    {" "}
                    {t("myCourses.priceNote", {
                      price: 99,
                    })}
                    {/* {t("myCourses.priceNote", {
                      price: examPrice?.final_price,
                    })} */}
                  </span>
                </p>
                <p className="body-medium !font-normal text-surface-gray-muted">
                  {t("myCourses.trialLimit", { days: 3 })}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
