"use client";

import React from "react";
import VideoHeader from "./VideoHeader";
import VideoCard from "./VideoCard";
// import VideoProgress from "./VideoProgress";
import { usePreparationStore } from "../../store/usePreparationDataStore";
import { updateLearningProgress } from "@/lib/dashboard/userInteractions";
import { createLearningInteraction } from "@/lib/dashboard/todayGoals";
import { useQueryClient } from "@tanstack/react-query";
import Skeleton from "@clearcut/ui/skeleton";
import { trackEvent } from "@/lib/analytics/browser";
import { logger } from "@/lib/sentry/sentry-logger";
import { ContentItem, VideoContent } from "../../types/topic-content-type";
import useMainVideoPlayer from "../../hooks/useMainVideoPlayer";
import { useVideoPlayerStore } from "../../store/useVideoPlayerStore";
import { courseLanguageToLocale } from "@/utils/text/contentLocale";

export default function VideoWrapper() {
  const queryClient = useQueryClient();
  const {
    selectedTopic,
    markTopicFieldDone,
    course,
    selectedSectionId,
    selectedChapter,
    loading,
  } = usePreparationStore();

  const safeContent =
    (selectedTopic?.data?.find(
      (item) => item.type === "video",
    ) as VideoContent) ?? [];

  /**
   * 🎥 Resolve main video by the course's content language
   * 1. Exact language match (e.g. "mr" for a Marathi course)
   * 2. Hindi — same per-item fallback used by getLocalizedName() for
   *    chapter/topic names, so a Marathi course never shows blank just
   *    because a topic's Marathi video hasn't synced yet
   * 3. Whatever's first, so an English/Hindi-only topic still plays
   */
  const contentLocale = courseLanguageToLocale(course?.language);
  const videos = safeContent?.content ?? [];
  const mainVideo =
    videos.find((v) => v.language === contentLocale) ??
    (contentLocale !== "hi"
      ? videos.find((v) => v.language === "hi")
      : undefined) ??
    videos[0] ??
    null;
  const { video, setVideo } = useVideoPlayerStore();

  React.useEffect(() => {
    if (!mainVideo) return;
    setVideo(mainVideo);
  }, [mainVideo]);
  

  /**
   * 🎯 Mark video watched
   */
  const markVideoWatch = async () => {
    if (!selectedTopic || !mainVideo) return;

    await updateLearningProgress({
      course_id: course?.group_code!,
      section_id: selectedSectionId!,
      chapter_id: selectedChapter?.id!,
      topic_id: selectedTopic.id.toString(),
      video_watched: true,
    });

    createLearningInteraction({
      topic_id: Number(selectedTopic.id),
      interaction_type: "video_watched",
    })
      .then(() => queryClient.invalidateQueries({ queryKey: ["today-goals"] }))
      .catch((err) => {
        logger.error(err, {
          tags: { type: "background_sync", module: "main-video" },
          extra: {
            action: "createLearningInteraction",
            topicId: selectedTopic.id,
          },
        });
      });

    markTopicFieldDone(Number(selectedTopic.id), "videoWatched");

    trackEvent("Topic Status Changed", {
      topic_name: selectedTopic.name,
      new_status: "videoWatched",
      change_source: "manual_user_action",
    });

    trackEvent("Video Started", {
      content_id: mainVideo.id.toString(),
      chapter_name: selectedChapter?.name!,
      topic_name: selectedTopic?.name!,
      video_duration_seconds: 3041,
    });
  };

  /**
   * 🦴 1️⃣ Loading state
   */
  if (loading) {
    return (
      <div className="w-full flex justify-center">
        <div className="max-w-3xl w-full space-y-3">
          <Skeleton
            variant="rectangular"
            className="w-full aspect-video" borderRadius={12}
          />
          <div className="space-y-2 px-1">
            <Skeleton variant="text" width="60%" />
          </div>
        </div>
      </div>
    );
  }

  /**
   * 2️⃣ Not loading but no topic selected
   */
  if (!selectedTopic) return null;

  /**
   * 3️⃣ Not loading but no valid video available
   */
  if (!mainVideo) return null;

  /**
   * ✅ Render video
   */
  return (
    <div className="w-full flex justify-center">
      <div className="max-w-3xl w-full">
        <VideoCard onClick={markVideoWatch} url={mainVideo?.video_link ?? ""} />
        <VideoHeader data={mainVideo} />
        {/* <VideoProgress /> */}
      </div>
    </div>
  );
}
