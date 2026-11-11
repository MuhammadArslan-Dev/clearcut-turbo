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
import { TOUR_LOADING } from "@/components/features/tour/tourTargets";
import { newClientEventId, reportTopicActivity } from "@/lib/dashboard/progressV2";
import {
  invalidateProgressQueries,
  useProgressCapabilities,
} from "../../hooks/useProgressCapabilities";

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
  const { caps } = useProgressCapabilities();

  React.useEffect(() => {
    if (!mainVideo) return;
    setVideo(mainVideo);
  }, [mainVideo]);

  /* ---------------- Progress Tracker v2 (backend capability) ----------------
   * "Watched" = >= 80% played or the ended event (decision D2), confirmed by
   * the server — never the Start click. Progress is sampled from the player's
   * existing 500 ms tick and sent at most every 30 s, plus once when the
   * threshold is crossed and once on end. */
  const sentAtRef = React.useRef(0);
  const sentPositionRef = React.useRef(0);
  const completedRef = React.useRef(false);
  React.useEffect(() => {
    sentAtRef.current = 0;
    sentPositionRef.current = 0;
    completedRef.current = false;
  }, [selectedTopic?.id]);

  const reportVideo = (
    activity: "video_started" | "video_progress" | "video_completed",
    position?: number,
    duration?: number,
  ) => {
    if (!selectedTopic || !course?.group_code) return;
    const topicId = Number(selectedTopic.id);
    const watchedDelta =
      position !== undefined
        ? Math.max(0, Math.min(600, Math.round(position - sentPositionRef.current)))
        : undefined;
    if (position !== undefined) sentPositionRef.current = position;
    reportTopicActivity({
      course_id: course.group_code,
      topic_id: topicId,
      activity,
      position: position !== undefined ? Math.round(position) : undefined,
      duration: duration !== undefined ? Math.round(duration) : undefined,
      watched_delta: watchedDelta,
      client_event_id: activity === "video_progress" ? undefined : newClientEventId(),
    })
      .then((r) => {
        if (r.video_completed && !completedRef.current) {
          completedRef.current = true;
          markTopicFieldDone(topicId, "videoWatched");
          trackEvent("Topic Status Changed", {
            topic_name: selectedTopic.name,
            new_status: "videoWatched",
            change_source: "manual_user_action",
          });
        }
        if (r.status_changed || r.video_completed) invalidateProgressQueries(queryClient);
      })
      .catch((err) => {
        if (isNetworkFailure(err)) {
          logger.breadcrumb("reportTopicActivity hit a network blip", {
            tags: { type: "background_sync", module: "main-video" },
            extra: { action: activity, topicId },
          });
          return;
        }
        logger.error(err, {
          tags: { type: "background_sync", module: "main-video" },
          extra: { action: activity, topicId },
        });
      });
  };

  const thresholdSentRef = React.useRef(false);
  React.useEffect(() => {
    thresholdSentRef.current = false;
  }, [selectedTopic?.id]);

  const onVideoProgress = (position: number, duration: number) => {
    if (!caps.topic_activity || completedRef.current || duration <= 0) return;
    // Crossing the threshold is sent exactly once (the 500 ms tick would
    // otherwise resend until the response lands); otherwise every 30 s.
    const crossed = position >= caps.video_complete_ratio * duration && !thresholdSentRef.current;
    // The player's tick keeps running while paused — only send real progress.
    const due = Date.now() - sentAtRef.current >= 30_000 && position > sentPositionRef.current + 1;
    if (!crossed && !due) return;
    if (crossed) thresholdSentRef.current = true;
    sentAtRef.current = Date.now();
    reportVideo("video_progress", position, duration);
  };

  const onVideoEnded = (duration: number) => {
    if (!caps.topic_activity || completedRef.current) return;
    reportVideo("video_completed", duration, duration);
  };

  /**
   * 🎯 Mark video watched
   */
  const markVideoWatch = async () => {
    if (!selectedTopic || !mainVideo) return;

    if (caps.topic_activity) {
      // v2: the click only means "started"; the server records it and the
      // Today Goals interaction itself (no second client call).
      reportVideo("video_started");
      trackEvent("Video Started", {
        content_id: mainVideo.id.toString(),
        chapter_name: selectedChapter?.name ?? "",
        topic_name: selectedTopic.name,
        video_duration_seconds: 3041,
      });
      return;
    }

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
      <div className="max-w-3xl w-full">
        <VideoCard
          onClick={markVideoWatch}
          onProgress={onVideoProgress}
          onEnded={onVideoEnded}
          url={mainVideo?.video_link ?? ""}
        />
        <VideoHeader data={mainVideo} />
        {/* <VideoProgress /> */}
      </div>
    </div>
  );
}
