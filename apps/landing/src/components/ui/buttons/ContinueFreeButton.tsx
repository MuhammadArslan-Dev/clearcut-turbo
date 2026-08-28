"use client";
import React, { useCallback } from "react";
import Button from "@clearcut/ui/button";
import { hoverScale } from "@/lib/animations";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/auth";
import ButtonShimmerOverlay from "./button-shimmer-overlay";
import useButtonArrowAnimation from "./useButtonArrowAnimation";
import { logAmplitudeEvent } from "@/services/analytics";
import { useTranslations } from "next-intl";

const MotionButton = motion(Button);

type EventType = "button" | "banner" | "card";

export default function ContinueFreeButton({
  text,
  marketing = "",
  course,
  showIcon = true,
  size = "lg",
  fullWidth = false,
  variant = "solid",
  color = "primary",
  showShimmer = false,
  linkButton = false,
  disabled,
  loading,
  event = { element_location: "header", element_type: "button" },
  onClick,
}: {
  text?: string | React.ReactNode;
  marketing?: string;
  /**
   * Which exam/course this button's page represents (e.g. "htet") — passed
   * through to the login modal so a new user's post-verify redirect can
   * preselect it in onboarding. Omit on pages with no specific course
   * context (header/footer CTAs, generic marketing sections).
   */
  course?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  variant?: "solid" | "outlined" | "plain" | "soft";
  color?: "primary" | "danger" | "neutral" | "gray" | "success" | "warning";
  showShimmer?: boolean;
  linkButton?: boolean;
  onClick?: () => void;
  event?: { element_location?: string; element_type?: EventType };
}) {
  const { goToLogin, setMarketing, setCourse } = useAuthStore();
  const t = useTranslations("common");
  const label = text ?? t("continueFree");

  const { buttonPhase } = useButtonArrowAnimation({ data: showShimmer || null });

  const buttonClickHandler =
    onClick ||
    useCallback(async () => {
      logAmplitudeEvent("Authentication Initiated", {
        element_location: event.element_location,
        element_type: event.element_type,
      });
      goToLogin();
      setMarketing(marketing || "");
      setCourse(course || "");
    }, []);

  const arrowIcon = (
    <svg width="12" height="16" viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M0.195254 3.19526C0.455603 2.93491 0.878264 2.93491 1.13861 3.19526L4.99994 7.05659C5.52064 7.57729 5.52064 8.42163 4.99994 8.94233L1.13861 12.8046C0.878264 13.065 0.455603 13.065 0.195254 12.8046C-0.0650791 12.5443 -0.0650901 12.1216 0.195254 11.8613L4.05756 7.99995L0.195254 4.13765C-0.0648142 3.87738 -0.0647266 3.45558 0.195254 3.19526ZM4.36225 3.19526C4.62259 2.93492 5.04428 2.93493 5.30463 3.19526L9.16693 7.05659C9.68761 7.57727 9.68757 8.42163 9.16693 8.94233L5.30463 12.8046C5.0443 13.0646 4.6225 13.0647 4.36225 12.8046C4.1019 12.5443 4.1019 12.1216 4.36225 11.8613L8.22455 7.99995L4.36225 4.13765C4.10196 3.87734 4.10205 3.45562 4.36225 3.19526Z"
        fill="white"
      />
    </svg>
  );

  return (
    <MotionButton
      size={size}
      rounded="50px"
      variant={variant}
      color={color}
      disabled={disabled}
      loading={loading}
      fullWidth={fullWidth}
      {...hoverScale}
      rightIcon={
        showIcon &&
        (buttonPhase === "icon" ? (
          <motion.span
            className="flex items-center"
            animate={{ x: 6 }}
            transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          >
            {arrowIcon}
          </motion.span>
        ) : (
          arrowIcon
        ))
      }
      onClick={() => { if (!linkButton) buttonClickHandler(); }}
    >
      {buttonPhase === "shimmer" && <ButtonShimmerOverlay />}
      <span className="relative z-[1]">{label}</span>
    </MotionButton>
  );
}
