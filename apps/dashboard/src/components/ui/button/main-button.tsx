"use client";
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

import useButtonArrowAnimation from "@/hooks/useButtonArrowAnimation";
import ButtonShimmerOverlay from "../button-shimmer-overlay";
import Button from "./Button";
import { ChevronIcon } from "../icons";

const MotionButton = motion(Button);

export const hoverScale = {
  whileHover: { scale: 1.005 },
  whileTap: { scale: 0.999 },
};

type MainButtonProps = {
  text?: React.ReactNode;
  gap?: number;
  showIcon?: boolean;
  pY?: string;
  size?: "sm" | "md" | "lg";
  rounded?: string;
  fullWidth?: boolean;
  variant?: "solid" | "outlined" | "plain" | "soft";
  color?: "primary" | "danger" | "success" | "warning" | "neutral" | "gray";
  bgColor?: string;
  showShimmer?: boolean;
  linkButton?: boolean;
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
};

/* ------------------ Helpers ------------------ */

const getPaddingY = (size: MainButtonProps["size"]) => {
  switch (size) {
    case "lg":
      return "13px";
    case "md":
      return "9px";
    case "sm":
    default:
      return "6px";
  }
};

/* ------------------ Sub Components ------------------ */

const AnimatedArrowIcon = ({
  phase,
  icon,
  disabled,
  loading,
}: {
  phase: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
}) => {
  const defaultIcon = (
    <ChevronIcon
      type="double"
      variant="right"
      size={24}
      color={disabled || loading ? "#0088ff30" : "white"}
    />
  );

  if (phase === "icon") {
    return (
      <motion.span
        className="flex items-center"
        animate={{ x: 6 }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      >
        {icon ?? defaultIcon}
      </motion.span>
    );
  }

  return <>{icon ?? defaultIcon}</>;
};

const ContentWrapper = ({
  gap,
  leftIcon,
  text,
  rightIcon,
}: {
  gap: number;
  leftIcon?: React.ReactNode;
  text: React.ReactNode;
  rightIcon?: React.ReactNode;
}) => (
  <div className="flex justify-center items-center" style={{ gap }}>
    {leftIcon && <span>{leftIcon}</span>}
    <span className="-mt-[1.5px]">{text}</span>
    {rightIcon}
  </div>
);

/* ------------------ Main Component ------------------ */

export default function MainButton({
  text = "Continue Free Preparation",
  gap = 8,
  showIcon = true,
  pY,
  size = "lg",
  rounded = "50px",
  fullWidth = false,
  variant = "solid",
  color = "primary",
  bgColor = "primary",
  showShimmer = false,
  linkButton = false,
  rightIcon,
  leftIcon,
  loading = false,
  disabled = false,
  className,
  onClick,
}: MainButtonProps) {
  const { buttonPhase } = useButtonArrowAnimation({
    data: showShimmer || null,
  });

  const paddingY = useMemo(() => (pY ? pY : getPaddingY(size)), [size, pY]);

  const handleClick = () => {
    if (!linkButton && onClick) {
      onClick();
    }
  };

  return (
    <div className={clsx("overflow-hidden", fullWidth && "w-full", className)}>
      <MotionButton
        size={size}
        paddingY={paddingY}
        rounded={rounded}
        variant={variant}
        color={color}
        disabled={disabled}
        loading={loading}
        fullWidth={fullWidth}
        onClick={handleClick}
        bgColor={bgColor}
        {...hoverScale}
      >
        {buttonPhase === "shimmer" && <ButtonShimmerOverlay />}

        <ContentWrapper
          gap={gap}
          leftIcon={leftIcon}
          text={text}
          rightIcon={
            showIcon && (
              <AnimatedArrowIcon
                phase={buttonPhase}
                icon={rightIcon}
                disabled={disabled}
                loading={loading}
              />
            )
          }
        />
      </MotionButton>
    </div>
  );
}
