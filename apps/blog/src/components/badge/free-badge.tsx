// import { logAmplitudeEvent } from "@/services/analytics";
// import { useAuthModal } from "@/store/authModalStore";
import Chip from "@mui/joy/Chip";
import { useTranslations } from "next-intl";
import Image from "next/image";
import React from "react";

type Props = {
  text?: string | React.ReactNode;
};

export default function FreeBadge({ text = "3 day FREE trial" }: Props) {
  // const { openModal } = useAuthModal();
  const t = useTranslations("CourseHeader");

  const badgeText = text || t("trialText");

  return (
    <Chip
      onClick={async () => {
        // openModal({ type: "login" });
        // await logAmplitudeEvent("Authentication Initiated", {
        //   initial_intent: "login",
        //   element_location: "3 day free trail badge",
        //   element_type: "badge",
        // });
      }}
      color="success"
      variant="outlined"
      size="lg"
      sx={{
        padding: "8px 12px",
        height: "40px",
        width: "100%",
        borderWidth: 2,
      }}
      startDecorator={
        <Image
          src="/images/discount-badge.webp"
          alt="Arrow Down"
          width={20}
          height={20}
        />
      }
    >
      <p className="body-medium !font-semibold"> {badgeText} </p>
    </Chip>
  );
}
