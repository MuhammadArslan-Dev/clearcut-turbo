import { useEffect, useState } from "react";
import { VideoConcept, VideoContent } from "../types/topic-content-type";

export default function useMainVideoPlayer({ data }: { data: VideoContent }) {
  const [concept, setConcept] = useState<VideoConcept[]>([]);
  const [currentTime, setCurrentTime] = useState("0:00");

  const mainVideo = data?.content?.[0] ?? null;

  useEffect(() => {
    if (!mainVideo?.video_concepts) return;

    setConcept(mainVideo.video_concepts);
  }, [mainVideo]);

  return {
    mainVideo,
    concept,
    currentTime,
    setCurrentTime,
  };
}