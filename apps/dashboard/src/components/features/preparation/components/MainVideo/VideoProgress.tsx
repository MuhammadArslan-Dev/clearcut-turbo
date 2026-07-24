import ProgressBar from "@/components/ui/ProgressBar";
import React from "react";
import { useMainVideoProgressTrackerStore } from "../../store/useMainVideoProgressTracker";

export default function VideoProgress() {
  const { currentTime, duration, progressPercent } =
    useMainVideoProgressTrackerStore();

  const percent = duration
    ? Math.floor((currentTime / duration) * 100)
    : 0;
  return (
    <div className="h-10 px-3 pt-0.5 pb-2 bg-white space-y-1">
      <div className="flex justify-between body-medium text-surface-gray-muted">
        <p className="">Progress</p>
        <p>{percent} %</p>
      </div>
      <div>
        <ProgressBar height={6} showLabel={false} total={duration} completed={currentTime} />
      </div>
    </div>
  );
}
