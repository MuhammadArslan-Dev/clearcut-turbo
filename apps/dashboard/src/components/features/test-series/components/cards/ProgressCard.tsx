import { FireIcon, SheildIcon, TrophyIcon } from "@/components/ui/icons";
import ProgressBar from "@/components/ui/ProgressBar";
import Text from "@clearcut/ui/text";
import clsx from "clsx";
import React from "react";

interface ProgressProps {
  title?: string;
  message?: string;
  total?: number;
  completed?: number;
  containerClasses?: string;
  icon?: React.ReactNode;
}

export default React.memo(function ProgressCard({
  title = "0/0 sectional tests",
  message,
  total = 0,
  completed = 0,

  containerClasses,
  icon,
}: ProgressProps) {
  return (
    <div
      className={clsx(
        "px-4 py-3 flex flex-col items-center justify-between gap-3 border border-[var(--icon-gray-muted)]/40 rounded-lg",
        containerClasses,
      )}
    >
      <div className="w-full flex flex-col gap-2">
        <ProgressTitle
          title={title}
          className="w-full justify-center "
          icon={
            <FireIcon
              variant="outline"
              size={24}
              color="var(--icon-gray-muted)"
            />
          }
        />
        <ProgressBar
          showLabel={false}
          completed={Number(completed)}
          total={Number(total)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex justify-center items-center gap-1">
          <TrophyIcon size={16} variant="outline" />
          <Text as="p" variant="body-small" weight="normal" color="gray-muted" className="whitespace-nowrap">
            {message}
          </Text>
        </div>
        {/* <div className="flex justify-center items-center gap-1">
          <SheildIcon
            mode="simple"
            color="var(--icon-gray-muted)"
            size={16}
            variant="outline"
          />
          <Text as="p" variant="body-small" weight="normal" color="gray-muted">
            Based on CTET PYQs (2015-2023)
          </Text>
        </div> */}
      </div>
    </div>
  );
});


const ProgressTitle = React.memo(
  ({
    title,
    subtitle,
    className,
    icon = (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M9 8.08392C8.16919 8.22435 7.37341 8.53889 6.66658 9.01118C5.67989 9.67047 4.91085 10.6075 4.45673 11.7039C4.0026 12.8003 3.88378 14.0067 4.11529 15.1705C4.3468 16.3344 4.91825 17.4035 5.75736 18.2426C6.59648 19.0818 7.66558 19.6532 8.82946 19.8847C9.99335 20.1162 11.1997 19.9974 12.2961 19.5433C13.3925 19.0892 14.3295 18.3201 14.9888 17.3334C15.4611 16.6266 15.7757 15.8308 15.9161 15H10C9.73479 15 9.48043 14.8946 9.2929 14.7071C9.10536 14.5196 9 14.2652 9 14V8.08392Z"
          fill="#192839"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M13.2929 2.29289C13.4804 2.10536 13.7348 2 14 2C16.1217 2 18.1566 2.84285 19.6569 4.34314C21.1571 5.84344 22 7.87827 22 10C22 10.5523 21.5523 11 21 11L14 11C13.7348 11 13.4804 10.8946 13.2929 10.7071C13.1054 10.5196 13 10.2652 13 10V3Z"
          fill="#192839"
        />
      </svg>
    ),
  }: {
    title: string;
    subtitle?: string;
    className?: string;
    icon?: React.ReactNode;
  }) => {
    return (
      <div className={clsx(className, "flex items-center gap-1")}>
        <div>
          {/* SVG preserved */}
          {icon ?? icon}
        </div>

        <div className="text-center">
          <div className="body-large text-surface-gray-normal">
            <Text variant="body-large" weight="normal" color="gray-subtle">
              {title}
            </Text>
          </div>
          {subtitle && (
            <p className="body-small text-surface-gray-muted whitespace-nowrap">{subtitle}</p>
          )}
        </div>
      </div>
    );
  },
);
