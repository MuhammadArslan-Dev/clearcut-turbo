import React, { memo, useCallback } from "react";
import clsx from "clsx";
import {
  CircleTickIcon,
  LockIcon,
  MediaPlayerIcon,
  StarBadge,
  VideoCamIcon,
} from "@/components/ui/icons";
import StatusChip from "../chapter-list/StatusChip";
import CounterCard from "../../CounterCard";

type CounterVariant = "filled" | "warning" | "simple" | "progress";
type CounterColorKey = "success" | "error" | "info" | "custom";

type MetaItem = {
  icon?: React.ReactNode;
  value?: string | number | null;
};

interface Props {
  counter?: {
    value?: string | number | React.ReactNode | null;
    variant?: CounterVariant;
    colorKey?: CounterColorKey;
    custom?: boolean;
  };

  features?: MetaItem[];

  title?: string | React.ReactNode;
  badge?: string | React.ReactNode;

  time?: {
    color?: string | null;
    value?: string | number | null;
  };

  player?: "filled" | "warning" | "simple";
  onClick?: () => void;

  cursor?:
    | "cursor-pointer"
    | "cursor-default"
    | "cursor-not-allowed"
    | "cursor-grab";

  bgColor?: string;
  cardBgColor?: string;
  isActive?: boolean;

  /** 🔥 New className controls */
  containerClassName?: string;
  cardClassName?: string;
  titleClassName?: string;
  metaTextClassName?: string;
}

/* ------------------ Stable defaults ------------------ */

const DEFAULT_TIME = { value: "12 min" };

const DEFAULT_FEATURES = [
  { icon: <VideoCamIcon />, value: "3 video(s)" },
  { icon: <StarBadge />, value: "Easy" },
];

const TopicListCard: React.FC<Props> = ({
  bgColor = "bg-gray-200",
  cardBgColor = "bg-white",
  cursor = "cursor-pointer",
  isActive,
  containerClassName,
  cardClassName,
  titleClassName = "body-medium !font-normal text-surface-gray-subtle",
  metaTextClassName,

  counter,
  title = "Using different types of lighting",
  badge,
  player,
  features = DEFAULT_FEATURES,
  onClick,
}) => {
  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  return (
    <div
      onClick={handleClick}
      className={clsx(
        "flex gap-3 rounded-md items-center p-1",
        cursor,
        bgColor,
        containerClassName,
      )}
    >
      {counter &&
        (counter?.custom ? (
          counter.value
        ) : (
          <div className="w-8 shrink-0">
            {counter?.variant === "filled" ||
            counter?.variant === "progress" ? (
              <CircleTickIcon {...counter} />
            ) : (
              <CounterCard
                textClass="!text-brand"
                width="w-8"
                height="h-8"
                borderColor="border-brand border-2"
                value={counter.value}
              />
            )}
          </div>
        ))}

      <div
        className={clsx("flex-1 gap-2 rounded-md", cardBgColor, cardClassName)}
      >
        {/* Title + Time */}
        <div className="flex items-center justify-between gap-2">
          <p className={clsx("", titleClassName)}>{title}</p>

          {badge && badge}
        </div>

        {/* Meta info */}
        {((features && features.length > 0) || player) && (
          <div
            className={clsx(
              "flex mt-1 items-center justify-between",
              !isActive && "md:hidden",
            )}
          >
            <div className="flex gap-3 text-sm text-gray-600">
              {features?.map((feature, index) => (
                <div key={index} className="flex items-center gap-1">
                  {feature.icon}
                  <span className={metaTextClassName}>{feature.value}</span>
                </div>
              ))}
            </div>

            {player && <MediaPlayerIcon size={20} variant={player} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(TopicListCard);
