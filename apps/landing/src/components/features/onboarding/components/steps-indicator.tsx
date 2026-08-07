import React from "react";

export default function StepsIndicator({
  data,
  currentStep = 0,
}: {
  data: any[];
  currentStep?: number;
}) {
  return (
    <div className="flex gap-2 items-center w-full">
      <div className="flex gap-3 w-full">
        {data.map((step: any, index: number) => {
          const isCompleted = index < currentStep;
          return (
            <div
              key={step.id}
              className={`h-[3px] flex-1 rounded-full ${isCompleted ? "bg-brand" : "bg-gray-200"}`}
            />
          );
        })}
      </div>
    </div>
  );
}
