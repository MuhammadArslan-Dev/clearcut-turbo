import { Card } from "@clearcut/ui/card";
import Text from "@clearcut/ui/text";
import clsx from "clsx";
import React from "react";

export default function QuestionStatusLegend() {
  return (
    <Card padding={0} borderRadius={16}>
      <div className="flex items-start justify-between gap-2 overflow-x-auto px-4 py-2">
        <LegendItem text="Not Visited" color="bg-gray-300" />
        <LegendItem text="Answered" color="bg-[var(--icon-positive-subtle)]" />
        <LegendItem text="Not Answered" color="bg-[var(--icon-negative-normal)]" />
        <LegendItem text="Marked for Review" color="bg-[var(--icon-notice-subtle)]" />
      </div>
    </Card>
  );
}

const LegendItem = ({
  text,
  color,
  iconSize,
}: {
  text?: string;
  color?: string;
  iconSize?: string;
}) => {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 text-center">
      <div
        className={clsx(
          "rounded-full",
          color ?? "bg-[var(--background-gray-subtle)]",
          iconSize ?? " w-[18px] h-[18px]",
        )}
      ></div>
      <Text as="p" variant="body-xsmall" weight="normal" color="gray-muted" className="whitespace-nowrap">
        {text}
      </Text>
    </div>
  );
};
