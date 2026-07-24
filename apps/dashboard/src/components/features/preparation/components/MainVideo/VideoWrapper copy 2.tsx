"use client";

import React from "react";
import VideoHeader from "./VideoHeader";
import VideoCard from "./VideoCard";
// import VideoProgress from "./VideoProgress";
import { usePreparationStore } from "../../store/usePreparationDataStore";
import { updateLearningProgress } from "@/lib/dashboard/userInteractions";
import { Skeleton } from "@mui/joy";
import { trackEvent } from "@/lib/analytics/browser";

export default function VideoWrapper() {
  const {
    selectedTopic,
    markTopicFieldDone,
    course,
    selectedSectionId,
    selectedChapter,
    loading,
  } = usePreparationStore();

  const safeContent = selectedTopic?.content ?? [];

  /**
   * 🎥 Resolve main video safely
   * 1. Prefer main_video with valid link
   * 2. Fallback to supporting_video with valid link
   */
  const mainVideo = React.useMemo(() => {
    if (!safeContent.length) return null;

    const isValidLink = (link?: string) =>
      typeof link === "string" && link.trim().length > 0;

    const main = safeContent.find(
      (item) =>
        item.content_flag === "main_video" &&
        isValidLink(item.content_link),
    );

    if (main) return main;

    const supporting = safeContent.find(
      (item) =>
        item.content_flag === "supporting_video" &&
        isValidLink(item.content_link),
    );

    return supporting || null;
  }, [safeContent]);

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
            className="w-full aspect-video"
            sx={{ borderRadius: 12 }}
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
        <VideoCard
          onClick={markVideoWatch}
          url={mainVideo.content_link ?? ""}
        />
        <VideoHeader data={mainVideo} />
        {/* <VideoProgress /> */}
      </div>
    </div>
  );
}
