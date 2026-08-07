"use client";

import {
  ChevronIcon,
  CircleTickIcon,
  VideoCamIcon,
} from "@/components/ui/icons";
import { Button } from "@clearcut/ui/button";
import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";
import { usePreparationStore } from "../../store/usePreparationDataStore";
import Text from "@clearcut/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckIcon, NoteIcon, MediaPlayerIcon } from "@/components/ui/icons";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { getMiniTestQuestions } from "@/lib/tests/getMiniTestQuestions";

export default function ChapterDetailHeader() {
  const { set } = useQueryParams();
  const t = useTranslations();

  const { selectedTopic, selectedChapter, progressByTopicId, course } =
    usePreparationStore();
  const topicProgress = progressByTopicId[selectedTopic?.id!];

  const { data: topicQuestionsCheck, isFetched: topicCheckFetched } = useQuery({
    queryKey: ["minitest-check", selectedTopic?.id],
    queryFn: async () => {
      const res = await getMiniTestQuestions(
        selectedTopic?.id,
        `?topicId=${selectedTopic?.id}&random=true&limit=1&courseId=${course?.group_code}`,
      );
      return res.data ?? [];
    },
    enabled: !!selectedTopic?.id,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const hasTopicTest = !topicCheckFetched || (topicQuestionsCheck?.length ?? 0) > 0;

  return (
    <div className="min-h-[60px] w-full bg-white flex items-center px-3 py-2 md:py-3 md:px-4">
      <div className="w-full flex flex-col md:flex-row md:justify-between md:items-center gap-2">
        {/* LEFT — Breadcrumb */}
        <div className="flex items-center gap-4 lg:max-w-[40%]">
          {/* Mobile back */}
          <div className="block md:hidden">
            <Button
              variant="soft"
              color="neutral"
              size="sm"
              sx={{
                borderRadius: "50px",
                padding: "8px 8px",
                height: "36px",
                width: "36px",
              }}
              onClick={() => set({ topic: "" }, { replace: false })}
            >
              <ChevronIcon variant="left" size={16} color="#192839" />
            </Button>
          </div>

          {selectedChapter?.name ? (
            <div className="break-all">
              {selectedChapter?.name ? (
                <Text variant="body-large" color="gray-muted">
                  {selectedChapter?.name}
                  {" > "}
                </Text>
              ) : (
                <Skeleton className="w-10 h-6" />
              )}

              {selectedTopic?.name ? (
                <Text variant="body-large" color="gray-normal">
                  {selectedTopic?.name}
                </Text>
              ) : (
                <Skeleton className="w-10 h-6" />
              )}
            </div>
          ) : (
            <div className="flex gap-1">
              <Skeleton className="w-10 h-6" />
              <Skeleton className="w-10 h-6" />
            </div>
          )}
        </div>

        {/* RIGHT — Study Path */}
        <div className="flex w-full md:w-auto justify-center items-center gap-2">
          <Text
            as="p"
            variant="body-medium"
            className="w-auto whitespace-nowrap"
            color="gray-normal"
          >
            Progress:
          </Text>

          <div className="flex items-center">
            {/* Video — only if topic has video content */}
            {selectedTopic?.data?.some(d => d.type === "video") && (
              <>
                <div className="flex items-center gap-1 md:gap-2">
                  {topicProgress?.videoWatched ? (
                    <CircleTickIcon size={16} variant="filled" value="true" />
                  ) : (
                    <VideoCamIcon variant="outline" size={20} />
                  )}
                  <Text variant="body-small" color="gray-muted">
                    {t("common.video")}
                  </Text>
                </div>
                <ChevronIcon color="var(--icon-gray-muted)" />
              </>
            )}
            {/* Notes */}
            <div className="flex items-center gap-1 md:gap-2">
              {topicProgress?.notesTaken ? (
                <CircleTickIcon size={16} variant="filled" value="true" />
              ) : (
                <NoteIcon size={16} color="var(--icon-gray-muted)" />
              )}
              <Text variant="body-small" color="gray-muted">
                {t("common.notes")}
              </Text>
            </div>
            {/* Topic Test — same live check as BottomBar, uses cached query result */}
            {hasTopicTest && (
              <>
                <ChevronIcon color="var(--icon-gray-muted)" />
                <div className="flex items-center gap-1 md:gap-2">
                  {topicProgress?.miniTestDone ? (
                    <CircleTickIcon size={16} variant="filled" value="true" />
                  ) : (
                    <MediaPlayerIcon
                      size={16}
                      mode="outline"
                      variant="play"
                      color="var(--icon-gray-muted)"
                    />
                  )}
                  <Text
                    variant="body-small"
                    className="whitespace-nowrap"
                    color="gray-muted"
                  >
                    {t("common.minitest")}
                  </Text>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
