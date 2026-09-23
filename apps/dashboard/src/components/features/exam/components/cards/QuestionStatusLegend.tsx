import { Card } from "@clearcut/ui/card";
import Text from "@clearcut/ui/text";
import clsx from "clsx";
import React from "react";

export default function QuestionStatusLegend() {
  return (
    <Card padding={0} borderRadius={50}>
      <div className="px-2 py-1 overflow-hidden rounded-full">
        <div className="flex items-center gap-3 py-1 px-4 -mx-2 overflow-scroll">
          <LegendItem text="Not Visited" />
          <LegendItem text="Answered" color="bg-[var(--icon-positive-subtle)]" />
          <LegendItem text="Not Answered" color="bg-[var(--icon-negative-normal)]" />
          <LegendItem text="To Review" color="bg-[var(--icon-notice-subtle)]" />
        </div>
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
    <div className="flex flex-col justify-center items-center">
      <div
        className={clsx(
          "rounded-full",
          color ?? "bg-[var(--background-gray-subtle)]",
          iconSize ?? " w-4 h-4",
        )}
      ></div>
      <Text as="p" variant="body-small" weight="normal" color="gray-subtle" className="whitespace-nowrap">
        {text}
      </Text>
    </div>
  );
};
