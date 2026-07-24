"use client";
import React from "react";
import JoyButton, { ButtonProps as JoyButtonProps } from "@mui/joy/Button";

interface ButtonProps extends JoyButtonProps {
  children: React.ReactNode;
  rounded?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  borderWidth?: string;
  bgColor?: string;
  paddingY?: string;
}

export default function Button({
  children,
  onClick,
  variant = "solid",
  color = "primary",
  size = "md",
  loading = false,
  disabled = false,
  startDecorator,
  endDecorator,
  fullWidth = false,
  rounded,
  borderWidth,
  leftIcon,
  rightIcon,
  bgColor,
  paddingY,
  ...rest
}: ButtonProps) {
  return (
    <JoyButton
      onClick={onClick}
      variant={variant}
      color={color}
      size={size}
      loading={loading}
      disabled={disabled}
      startDecorator={startDecorator}
      endDecorator={endDecorator}
      fullWidth={fullWidth}
      sx={{
        borderRadius: rounded,
        borderWidth: borderWidth || "2px",
        backgroundColor: bgColor,
        paddingY,
        // width: fullWidth ? "100%" : "fit-content",
      }}
      {...rest}
    >
      <div className="flex gap-1 items-center justify-center">
        {leftIcon && <span>{leftIcon}</span>}
        <span>{children}</span>
        {rightIcon && <span>{rightIcon}</span>}
      </div>
    </JoyButton>
  );
}
