import StatusChip from "@/components/ui/cards/preparation/chapter-list/StatusChip";
import { FireIcon, MediaPlayerIcon, StarBadge } from "@/components/ui/icons";
import React from "react";
import { Content } from "../../types/types";
import Text from "@clearcut/ui/text";
import { formatDurationSmart } from "@/utils/date/timeUtils";
import { usePreparationStore } from "../../store/usePreparationDataStore";

export default function VideoHeader({
  data,
}: {
  data?: Content | undefined | null;
}) {
  const { selectedTopic, selectedChapter, progressByTopicId } =
    usePreparationStore();
  const topicProgress = progressByTopicId[selectedTopic?.id!];

  return (
    <div className="h-10 bg-white px-4 py-2 flex justify-between">
      <div className="flex items-center gap-3">
        <div className="flex gap-1 items-center">
          <div className="w-4 h-4">
            <MediaPlayerIcon size={16} variant="play" />
          </div>
          <Text
            as="p"
            color="gray-muted"
            variant="body-small"
            weight="semibold"
          >
            {formatDurationSmart(data?.video_time ?? "00:00:00")}
          </Text>
        </div>

        <div className="flex items-center gap-1">
          <StarBadge size={20} />
          <Text
            as="p"
            variant="body-small"
            weight="bold"
            className="whitespace-nowrap !text-[#00a251]"
          >
            Easy
          </Text>
        </div>
      </div>
      <div>
        {topicProgress?.status ==='completed' ? (
          <StatusChip
            variant="outline"
            tone="success"
            className="!text-[var(--color-success)] !bg-[var(--color-success)]/9 !border-[var(--color-success)] body-small !font-semibold"
            label={"Completed"}
          />
        ) : topicProgress?.videoWatched ||
          topicProgress?.notesTaken ||
          topicProgress?.miniTestDone ? (
          <StatusChip
            variant="outline"
            tone="info"
            className="!text-brand !bg-brand/9 body-small !font-semibold"
            label={"In Progress"}
          />
        ) : (
          <StatusChip
            variant="outline"
            tone="info"
            className="!text-surface-gray-muted !bg-[#6c849d]/9 !border-surface-gray-muted body-small !font-semibold"
            label={"Not Started"}
          />
        )}
      </div>
    </div>
  );
}
