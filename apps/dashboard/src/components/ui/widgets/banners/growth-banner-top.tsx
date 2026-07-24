"use client";
import { MUIColor, MUISize, MUIVariant } from "@/types/components/button";
import clsx from "clsx";
import React from "react";
import MainButton from "../../button/main-button";
import { ChevronIcon } from "../../icons";

type GrowthBannerTopProps = {
  bgColor?: string;
  rounded?: string;
  rightText?: {
    text: string | React.ReactNode;
    icon?: React.ReactNode;
    iconPosition?: "left" | "right";
    className?: string;
    onClick: () => void;
  };
  leftText?: {
    text: string | React.ReactNode;
    icon?: React.ReactNode;
    iconPosition?: "left" | "right";
    className?: string;
    onClick: () => void;
  };
  padding?: string;
  maxWidth?: string;
  gap?: string;
  buttons?: {
    text: string;
    color?: MUIColor;
    variant?: MUIVariant;
    size?: MUISize;
    rounded?: string;
    onClick?: () => void;
  }[];
};

export default function GrowthBannerTop({
  bgColor = "bg-brand-dark",
  rounded = "",
  maxWidth = "max-w-5xl",
  rightText = {
    text: "Upgrade to Pro",
    iconPosition: "right",
    className: "text-white",
    icon: <ChevronIcon size={16} />,
    onClick: () => {},
  },
  leftText = {
    text: "Upgrade to Pro",
    iconPosition: "right",
    className: "text-white",
    icon: <ChevronIcon size={16} />,
    onClick: () => {},
  },
  padding = "p-2",
  gap = "gap-1",
  buttons,
}: GrowthBannerTopProps) {
  return (
    <div
      className={clsx(
        "flex items-center justify-center",
        rounded,
        padding,
        bgColor ? bgColor : "bg-blue-100",
      )}
    >
      <div className={clsx("flex flex-col md:flex-row items-center justify-between w-full",maxWidth, gap)}>
        {/* right text */}
        {(leftText.text || leftText.icon) && (
          <div className={"flex items-center gap-1"} onClick={leftText.onClick}>
            {leftText.iconPosition === "left" && leftText.icon && (
              <span className="mr-2">{leftText.icon}</span>
            )}
            <span className={leftText.className}>{leftText.text}</span>
            {leftText.iconPosition === "right" && leftText.icon && (
              <span className="ml-2">{leftText.icon}</span>
            )}
          </div>
        )}
        {/* buttons go here */}
        {buttons && (
          <div className="flex md:flex-row flex-col justify-center gap-5">
            {buttons?.map((button, index) => (
              <MainButton
                key={index}
                rounded={button.rounded}
                text={button.text}
                color={button.color}
                variant={button.variant}
                size={button.size}
                onClick={button.onClick}
              />
            ))}
          </div>
        )}
        {(rightText.text || rightText.icon) && (
          <div
            className={"flex items-center gap-1"}
            onClick={rightText.onClick}
          >
            {rightText.iconPosition === "left" && rightText.icon && (
              <span className="mr-2">{rightText.icon}</span>
            )}
            <span className={rightText.className}>{rightText.text}</span>
            {rightText.iconPosition === "right" && rightText.icon && (
              <span className="ml-2">{rightText.icon}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
