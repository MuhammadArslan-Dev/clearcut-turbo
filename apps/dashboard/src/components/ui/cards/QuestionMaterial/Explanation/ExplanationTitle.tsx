import Text from "@clearcut/ui/text";
import React from "react";
import CounterCard from "../../CounterCard";
import { NumberCountIcon } from "@/components/ui/icons";
import clsx from "clsx";

type ExplanationTitleProps = {
  index: number;
  title: string;
  titleClass?: string;
  rounded?: string;
  padding?: string;
  border?: string;
  display?: string;
  bgColor?: string;
};

export default function ExplanationTitle({
  index,
  title = "Answer & Explanation",
  display,
  rounded,
  padding,
  border,
  bgColor,
  titleClass,
}: ExplanationTitleProps) {
  return (
    <div
      className={clsx(
        display ?? "flex justify-between items-center",
        rounded,
        padding,
        border,
        bgColor,
      )}
    >
      <Text
        as="p"
        variant="heading-medium"
        weight="semibold"
        color="gray-normal"
        className={titleClass}
      >
        {title}
      </Text>

      <div className="flex gap-1 items-center">
        <Text as="p" variant="body-small" weight="normal" color="gray-subtle">
          Correct Answer
        </Text>
        <CounterCard
          value={String.fromCharCode(65 + index)}
          border="border-none border-gray-400"
          rounded="rounded-sm"
          width="w-6"
          height="h-6"
          textClass="!text-[#0083ff]"
          bgColor="bg-[#006bd115]"
        />
       
      </div>
    </div>
  );
}
