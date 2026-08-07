import Math from "@/components/features/mathjax/Math";
import Text from "@clearcut/ui/text";
import TextMarkDown from "@/components/ui/widgets/TextMarkDown";
import clsx from "clsx";
import React from "react";

type ExaplanationProps = {
  explanation: any;
  rounded?: string;
  padding?: string;
  border?: string;
  display?: string;
  bgColor?: string;
  titleClass?: string;
  explanationClass?: string;
};

export default function Exaplanation({
  explanation,
  titleClass,
  explanationClass,
  rounded = "rounded-lg",
  padding = "p-3",
  border,
  display = "flex flex-col justify-center items-start gap-4",
  bgColor = "bg-[#006bd108]",
}: ExaplanationProps) {
  return (
    <div className={clsx(bgColor, padding, border, display, rounded)}>
      <Text
        as="p"
        variant="heading-small"
        weight="semibold"
        className={titleClass}
      >
        Explanation
      </Text>
      <Math content={explanation}>
        <Text
          as="div"
          variant="body-medium"
          weight="normal"
          color="gray-normal"
          className={clsx(explanationClass)}
        >
          <TextMarkDown>{explanation.replace(/^\s{4,}/gm, "")}</TextMarkDown>
        </Text>
      </Math>
    </div>
  );
}
