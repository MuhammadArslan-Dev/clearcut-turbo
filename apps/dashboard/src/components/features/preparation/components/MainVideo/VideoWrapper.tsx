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
import { isNetworkFailure } from "@/lib/api/api-error";
import { ContentItem, VideoContent } from "../../types/topic-content-type";
import useMainVideoPlayer from "../../hooks/useMainVideoPlayer";
import { useVideoPlayerStore } from "../../store/useVideoPlayerStore";
import { courseLanguageToLocale } from "@/utils/text/contentLocale";
import { PREP_TOUR } from "@/components/features/preparation/components/startGuideIds";
import { TOUR_LOADING } from "@/components/features/tour/tourTargets";

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

    // Fire-and-forget progress pings — video playback must keep working even
    // if the backend is down or slow for these.
    updateLearningProgress({
      course_id: course?.group_code!,
      section_id: selectedSectionId!,
      chapter_id: selectedChapter?.id!,
      topic_id: selectedTopic.id.toString(),
      video_watched: true,
    }).catch((err) => {
      if (isNetworkFailure(err)) {
        logger.breadcrumb("updateLearningProgress hit a network blip", {
          tags: { type: "background_sync", module: "main-video" },
          extra: { action: "updateLearningProgress", topicId: selectedTopic.id },
        });
        return;
      }
      logger.error(err, {
        tags: { type: "background_sync", module: "main-video" },
        extra: {
          action: "updateLearningProgress",
          topicId: selectedTopic.id,
        },
      });
    });

    createLearningInteraction({
      topic_id: Number(selectedTopic.id),
      interaction_type: "video_watched",
    })
      .then(() => queryClient.invalidateQueries({ queryKey: ["today-goals"] }))
      .catch((err) => {
        if (isNetworkFailure(err)) {
          logger.breadcrumb("createLearningInteraction hit a network blip", {
            tags: { type: "background_sync", module: "main-video" },
            extra: { action: "createLearningInteraction", topicId: selectedTopic.id },
          });
          return;
        }
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
   * 🦴 1️⃣ Loading state — also while no topic is selected yet. The store
   * turns `loading` off before the chapters/topic arrive, so this used to go
   * skeleton → nothing → video, collapsing and re-expanding the page. Note:
   * a course with no topics at all now keeps showing the skeleton.
   */
  if (loading || !selectedTopic) {
    return (
      <div {...TOUR_LOADING} className="w-full flex justify-center">
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
   * 3️⃣ Not loading but no valid video available
   */
  if (!mainVideo) return null;

  /**
   * ✅ Render video
   */
  return (
    <div className="w-full flex justify-center">
      <div data-tour={PREP_TOUR.video} className="max-w-3xl w-full">
        <VideoCard onClick={markVideoWatch} url={mainVideo?.video_link ?? ""} />
        <VideoHeader data={mainVideo} />
        {/* <VideoProgress /> */}
      </div>
    </div>
  );
}
