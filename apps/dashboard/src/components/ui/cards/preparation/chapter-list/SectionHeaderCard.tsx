import React, { memo, useCallback } from "react";
import clsx from "clsx";

interface SectionHeaderCardProps {
  /** Small hierarchy text (e.g. Section 5 > 4 Tests) */
  breadcrumb?: string | React.ReactNode;

  /** Main heading */
  title: string | React.ReactNode;

  /** Optional left icon */
  leadingIcon?: React.ReactNode;

  /** Optional right icon */
  trailingIcon?: React.ReactNode;

  /** Click handler */
  onClick?: () => void;

  /** Cursor style */
  cursor?: "cursor-pointer" | "cursor-default";

  /** Layout / container */
  className?: string;
  containerClassName?: string;

  /** Style controls */
  bgClassName?: string;
  borderClassName?: string;
  radiusClassName?: string;

  /** Text styles */
  breadcrumbClassName?: string;
  titleClassName?: string;

  /** Icon styles */
  leadingIconClassName?: string;
  trailingIconClassName?: string;
}

const SectionHeaderCard: React.FC<SectionHeaderCardProps> = ({
  breadcrumb,
  title,
  leadingIcon,
  trailingIcon,
  onClick,

  cursor = "cursor-default",

  className,
  containerClassName = "px-4 py-3",

  bgClassName = "bg-white",
  borderClassName = "border border-gray-200",
  radiusClassName = "rounded-lg",

  breadcrumbClassName = "text-sm text-gray-500",
  titleClassName = "text-base font-semibold text-gray-900",

  leadingIconClassName = "mt-1 text-gray-600",
  trailingIconClassName = "text-gray-400",
}) => {
  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  return (
    <div
      onClick={()=>handleClick()}
      className={clsx(
        "w-full ",
        cursor,
        bgClassName,
        borderClassName,
        radiusClassName,
        containerClassName,
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left content */}
        <div className="flex items-start gap-3">
          {leadingIcon && (
            <div className={leadingIconClassName}>{leadingIcon}</div>
          )}

          <div className="space-y-0">
            {breadcrumb && <div className={breadcrumbClassName}>{breadcrumb}</div>}

            <h2 className={titleClassName}>{title}</h2>
          </div>
        </div>

        {/* Right icon */}
        {trailingIcon && (
          <div className={trailingIconClassName}>{trailingIcon}</div>
        )}
      </div>
    </div>
  );
};

export default memo(SectionHeaderCard);
