"use client";
import React from "react";
// Primitive now comes from the shared package. Auth routing (goToLogin),
// i18n, and all props are preserved — only the MUI Joy primitive was replaced.
import Button from "@clearcut/ui/button";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/lib/auth";

type buttonProps = {
  onClick?: () => void;
  text?: string;
  isFull?: boolean;
  loading?: boolean;
  disabled?: boolean;
};

export default function LoginButton({
  onClick = () => {}, // default: empty function
  text = "", // default text
  isFull = false, // default false
  loading = false, // default false
  disabled = false,
}: buttonProps) {
  const t = useTranslations("Buttons");
  const { goToLogin } = useAuthStore();

  const buttonText = text ? text : t("login");

  return (
    <Button
      variant="plain"
      fullWidth={isFull}
      disabled={disabled}
      loading={loading}
      onClick={() => goToLogin()}
    >
      {buttonText}
    </Button>
  );
}
