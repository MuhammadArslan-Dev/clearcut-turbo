import React from "react";
import clsx from "clsx";

import {
  ChartSuccessBarIcon,
  ChevronIcon,
  CircleTickIcon,
  FireIcon,
  LockIcon,
  PenIcon,
  WarningCircleIcon,
} from "@/components/ui/icons";
import SandTimerIcon from "@/components/ui/icons/sand-timer-icon";
import Text from "@clearcut/ui/text";
import StatusChip from "@/components/ui/cards/preparation/chapter-list/StatusChip";
import { Button } from "@clearcut/ui/button";
import CounterCard from "@/components/ui/cards/CounterCard";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useIsMobile } from "@/hooks/useIsMobile";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export type CounterVariant = "filled" | "warning" | "simple" | "progress";
export type CounterColorKey = "success" | "error" | "info" | "custom";

export type CounterProps = {
  size?: number;
  value?: string | number | React.ReactNode | null;
  variant?: CounterVariant;
  colorKey?: CounterColorKey;
  custom?: boolean;
};

export type MetricProps = {
  value?: string | number;
  className?: string;
  controlClassName?: string;
};
export type StartTestProps = {
  text?: string;
  isShow?: boolean;
  variant?: "plain" | "outlined" | "soft" | "solid";
  onClick: () => void;
};
export type ViewReportProps = {
  text?: string;
  isShow?: boolean;
  onClick: () => void;
};

export interface TestCardProps {
  title: React.ReactNode;
  chip?: React.ReactNode;

  counter?: CounterProps;

  score?: MetricProps;
  marks?: MetricProps;
  time?: MetricProps;

  announcement?: React.ReactNode;

  containerClassName?: string;
  cardBg?: string;
  labelClassName?: string;

  unlock?: StartTestProps;
  actions?: React.ReactNode;

  startTest?: StartTestProps;
  viewReport?: ViewReportProps;

  /** Free-trial reward nudge, shown as a small badge in the card's top-right corner. */
  showReward?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                              HELPER COMPONENTS                             */
/* -------------------------------------------------------------------------- */

function Metric({
  icon,
  metric,
}: {
  icon: React.ReactNode;
  metric?: MetricProps;
}) {
  if (!metric) return null;

  return (
    <div className={clsx("flex items-center gap-1", metric.controlClassName)}>
      {icon}
      <Text
        as="p"
        variant="body-small"
        color="gray-muted"
        className={metric.className}
      >
        {metric.value}
      </Text>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                MAIN COMPONENT                               */
/* -------------------------------------------------------------------------- */

export default function TestCard({
  title,
  chip,
  counter,
  unlock,
  score,
  marks,
  time,
  announcement,
  containerClassName,
  cardBg,
  labelClassName,
  startTest = {
    variant: "outlined",
    onClick: () => {},
  },
  viewReport = {
    onClick: () => {},
  },
  showReward,
}: TestCardProps) {
  const {
    size = 32,
    value = 1,
    variant = "simple",
    colorKey = "success",
    custom = false,
  } = counter || {};
  const isMobile = useIsMobile();

  // Desktop has two explicit buttons once a test is completed (Start Test/
  // Again + View Report in the Actions column), so tapping the card body
  // itself is a no-op there — you're expected to pick a button. Mobile
  // hides that column entirely and only surfaces View Report as its own
  // button, so the card itself has to stay the tap target for retaking,
  // same as it already is before the test is ever attempted.
  const cardClickable = !viewReport.isShow || isMobile;

  return (
    <div
      onClick={cardClickable ? () => startTest?.onClick() : () => {}}
      className={clsx(
        "relative rounded-md px-3 py-2",
        containerClassName,
        cardBg ?? "bg-white ",
      )}
    >
      {/* Free-trial reward nudge — corner badge, kept clear of the counter,
          title/chip row, and the desktop actions column below it. */}
      {showReward && (
        <div className="absolute -top-3 -right-2 pointer-events-none">
          <DotLottieReact
            style={{ width: 32, height: 32 }}
            src="/lotifiles/current-chapter.lottie"
            loop
            autoplay
          />
        </div>
      )}

      <div className="flex items-center gap-5">
        {/* Counter */}
        <div className="max-w-[30px]">
          {custom ? (
            value
          ) : variant === "simple" ? (
            <CounterCard
              textClass="!text-brand"
              width="w-8"
              height="h-8"
              borderColor="border-brand border-2"
              value={value}
            />
          ) : (
            <CircleTickIcon
              size={size}
              value={value}
              variant={variant}
              colorKey={colorKey}
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2">
          {/* Mobile: title left, chip pushed to the far right with a gap.
              When the corner reward badge is shown, the row is padded so the
              chip stops short of it instead of sitting underneath it.
              Desktop stays as-is — tight gap, no stretch. */}
          <div
            className={clsx(
              "flex items-center justify-between gap-2 md:justify-start",
              showReward && "pr-3 md:pr-0",
            )}
          >
            <Text
              as="h5"
              variant="body-medium"
              weight="normal"
              color="gray-subtle"
              className={clsx("whitespace-nowrap", labelClassName)}
            >
              {title}
            </Text>
            {chip && chip}
          </div>

          <div className="flex items-center gap-3">
            <Metric
              icon={<PenIcon size={16} variant="pen-scale" />}
              metric={marks}
            />
            <Metric icon={<SandTimerIcon size={16} />} metric={time} />
          </div>

          <div
            className={clsx(
              "flex items-start",
              score ? " justify-between" : " justify-end",
            )}
          >
            <Metric
              icon={<WarningCircleIcon color="#768EA7" size={16} />}
              metric={score}
            />
            {viewReport.isShow && (
              <div className="block md:hidden min-w-[50px] flex items-end">
                <div className="flex flex-col gap-2">
                  <Button
                    sx={{
                      borderRadius: "50px",
                    }}
                    variant="soft"
                    size="xs"
                    color="gray"
                    onClick={(e) => {
                      e.stopPropagation();
                      viewReport.onClick();
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="">
                        {viewReport.text ?? "View Report"}
                      </span>
                      <ChartSuccessBarIcon
                        color="var(--icon-gray-normal)"
                        width={12}
                        variant="graph-bar"
                      />{" "}
                    </div>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="hidden md:flex min-w-[100px] items-end">
          <div className="flex flex-col gap-2">
            {unlock?.isShow && (
              <div className="cursor-pointer" onClick={(e) => e.stopPropagation()}>
                <CounterCard
                  onClick={() => unlock?.onClick()}
                  width="w-[100px]"
                  height="h-8"
                  borderColor="border-[#0083ff] border-2"
                  value={
                    <div className="flex items-center gap-2">
                      {" "}
                      <Text
                        as="p"
                        variant="body-medium"
                        weight="normal"
                        color="primary-normal"
                      >
                        Unlock
                      </Text>
                      <LockIcon size={20} color="#0083ff" />
                    </div>
                  }
                />
              </div>
            )}
            {startTest.isShow && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  startTest.onClick();
                }}
                sx={{
                  borderRadius: "50px",
                  borderWidth: "2px",
                }}
                variant={startTest.variant ?? "outlined"}
                size="sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={clsx(
                      "whitespace-nowrap",
                       startTest.variant === "outlined" ? "text-brand" : "",
                    )}
                  >
                    {startTest.text ?? "Start Test"}
                  </span>
                  <ChevronIcon
                    size={20}
                    type="double"
                    color={
                      startTest.variant === "outlined" ? "#0083ff" : "white"
                    }
                    variant="right"
                  />{" "}
                </div>
              </Button>
            )}

            {viewReport.isShow && (
              <Button
                sx={{
                  borderRadius: "50px",
                }}
                variant="soft"
                size="xs"
                color="gray"
                onClick={(e) => {
                  e.stopPropagation();
                  viewReport.onClick();
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="">{viewReport.text ?? "View Report"}</span>
                  <ChartSuccessBarIcon
                    color="var(--icon-gray-normal)"
                    width={12}
                    variant="graph-bar"
                  />{" "}
                </div>{" "}
              </Button>
            )}
          </div>{" "}
        </div>
      </div>

      {/* Announcement */}
      {announcement && (
        <div className="flex justify-center items-center gap-1 mt-2">
          <FireIcon variant="red" size={16} />
          <Text
            as="p"
            variant="body-small"
            color="gray-normal"
            className={labelClassName}
          >
            {announcement}
          </Text>
          <FireIcon variant="red" size={16} />
        </div>
      )}
    </div>
  );
}
