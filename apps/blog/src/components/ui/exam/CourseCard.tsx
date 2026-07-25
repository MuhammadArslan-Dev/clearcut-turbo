"use client";

import { Card } from "@clearcut/ui/card";
import Button from "@mui/joy/Button";
import { useTranslations } from "next-intl";
import Image from "next/image";
import CalendarIcon from "@clearcut/ui/icons/calendar-icon";
import ClockIcon from "../icons/clock-icon";
import WarningCirleIcon from "@clearcut/ui/icons/warning-circle-icon";
import ChartSuccessBarIcon from "../icons/chart-success-bar-icon";
import CheckIcon from "../icons/check-icon";

export interface CourseCardProps {
  logo?: string | null;
  courseName?: string | null;
  examType?: string | null;
  examData?: string | number | null;
  examDate?: string | number | null;
  examMode?: string | number | null;
  duration?: string | number | null;
  rating?: string | number | null;
  badge?: string | null;
  bgColor?: string;

  // CTA Action
  onClick?: () => void;
  unlockClick?: () => void;
}

export default function CourseCard({
  courseName,
  logo,
  examData,
  examDate,
  rating,
  examType,
  examMode,
  duration,
  badge,
  onClick = () => {},
  bgColor = "",
}: CourseCardProps) {
  const t = useTranslations();

  return (
    <>
      <Card
        bgcolor={bgColor}
        minWidth={"250px"}
        padding={0}
        maxWidth={"400px"}
      >
        <div className="flex flex-col gap-3 px-1 pt-3 pb-2 relative">
          <div className="flex justify-center px-2 gap-4 2xl:gap-1">
            <div className="min-w-[100px] max-w-[200px] col-span-4 flex flex-col gap-1 items-center">
              <div className="relative w-auto h-[64px] rounded-full ">
                <Image
                  src={
                    logo ||
                    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNYAyuu-blwzsEjTj92dldM2I2UvueiguRwA&s"
                  }
                  alt=""
                  width={64}
                  height={64}
                  className="w-[64px] h-[64px] object-cover rounded-full grayscale opacity-70"
                />
                <div className="absolute bottom-0 flex items-center justify-center rounded-full right-0 w-5 h-5 bg-white">
                  <CheckIcon variant="design" size={16} />
                </div>
              </div>
              {/* <div className=''> */}
              <div className="flex flex-col items-center">
                <p className="heading-small !font-semibold text-surface-gray-normal whitespace-nowrap">
                  {courseName}
                </p>
                <p className="body-small text-surface-gray-muted whitespace-nowrap">
                  {examType}
                </p>
              </div>
              {/* </div> */}
            </div>

            <div className="w-[200px] h-full">
              <div className="col-span-8 h-full flex flex-col justify-center gap-2">
                {examDate && (
                  <div className="body-small !font-normal flex gap-1 items-center mb-0.5">
                    <div className="flex items-center gap-2">
                      <CalendarIcon />
                      <p className="text-surface-gray-muted">
                        {t("examCard.date")}{" "}
                      </p>
                    </div>
                    <p className="text-surface-gray-normal">{examDate}</p>
                  </div>
                )}
                {examMode && (
                  <div className="body-small !font-normal flex gap-1 items-center">
                    <div className="flex items-center gap-2">
                      <WarningCirleIcon color={"#768EA7"} />
                      <p className="text-surface-gray-muted">
                        {t("examCard.mode")}
                      </p>
                    </div>
                    <p className="text-surface-gray-normal">{examMode}</p>
                  </div>
                )}
                {duration && (
                  <div className="body-small !font-normal flex gap-1 items-center">
                    <div className="flex items-center gap-2">
                      <ClockIcon />
                      <p className="text-surface-gray-muted">
                        {t("examCard.duration")}
                      </p>
                    </div>
                    <p className="text-surface-gray-normal">{duration}</p>
                  </div>
                )}
                {examData && (
                  <div className="body-small !font-normal flex gap-1 items-center">
                    <div className="flex items-center gap-2">
                      <ChartSuccessBarIcon />
                      <p className="text-surface-gray-muted">
                        {" "}
                        {t("examCard.cutoff")}
                      </p>
                    </div>
                    <p className="text-surface-gray-normal">{examData}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 px-2 py-1">
            <Button
              variant="outlined"
              fullWidth
              sx={{
                borderRadius: "50px",
              }}
              onClick={onClick}
            >
              <div className="body-medium !font-semibold">
               {t("examCard.ctaTrial",{days: 3})}
              </div>
            </Button>
          </div>
        </div>
      </Card>
      {/* <ContactUsModal isOpen={openModal} closeModal={() => setOpenModal(false)} /> */}
    </>
  );
}
