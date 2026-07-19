"use client";

import React from "react";
import Button from "@mui/joy/Button";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/lib/auth";

type buttonProps = {
  onClick?: () => void | Promise<void>;
  text?: string;
  isFull?: boolean;
  loading?: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
};
export default function RegisterButton({
  onClick = () => {}, // default: empty function
  text = "", // default text
  isFull = false, // default false
  loading = false, // default false
  disabled = false,
  size="lg",

}: buttonProps) {
  const t = useTranslations("Buttons");

  const buttonText = text ? text : t("register");
  const { goToLogin } = useAuthStore();

  return (
    <Button
      color="primary"
      size={size}
      fullWidth={isFull}
      disabled={disabled}
      loading={loading}
      sx={{ 
        borderRadius:'50px'
       }}
      onClick={() => goToLogin()}
    >
      {buttonText}
    </Button>
  );
}
