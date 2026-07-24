"use client";

import React from "react";
import Tabs from "./Tabs";
import Content from "./Content";
import { usePreparationStore } from "../../store/usePreparationDataStore";
import { MediaPlayerIcon, NoteIcon, PathIcon } from "@/components/ui/icons";
import { AnimatePresence, motion } from "framer-motion";
import { Skeleton } from "@mui/joy";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics/browser";
import { useVideoPlayerStore } from "../../store/useVideoPlayerStore";

type TabId = "notes" | "bonus-videos" | "trends" | "concepts";

export const GraphIcon = ({ color }: { color?: string }) => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15.333 3.33325C15.7012 3.33325 16 3.63205 16 4.00024V8.00024C16 8.36841 15.7012 8.66724 15.333 8.66724C14.9649 8.66711 14.667 8.36834 14.667 8.00024V5.60962L9.47168 10.8049C9.21133 11.0653 8.78867 11.0653 8.52832 10.8049L5.66699 7.94263L1.1377 12.4719C0.877401 12.7319 0.455581 12.7319 0.195312 12.4719C-0.0650371 12.2116 -0.0650371 11.7889 0.195312 11.5286L5.19531 6.52856C5.45559 6.26849 5.87739 6.26853 6.1377 6.52856L9 9.39087L13.7236 4.66724H11.333C10.9649 4.66711 10.667 4.36834 10.667 4.00024C10.667 3.63213 10.9649 3.33337 11.333 3.33325H15.333Z"
        fill={color || "#192839"}
      />
    </svg>
  );
};

export default function RelatedContentWrapper() {
  const { course, selectedTopic, selectedChapter, loading, selectedSection } =
    usePreparationStore();
  const tabsT = useTranslations("relatedContent.studyTabs.tabs");

  const safeContent = selectedTopic?.content ?? [];
  const safeData = selectedTopic?.data ?? [];
  const trends = selectedTopic?.trends ?? [];

  const language = React.useMemo(
    () => (course?.language === "english" ? "en" : "hi"),
    [course],
  );

  const { video } = useVideoPlayerStore();

  const bonusVideos = safeData.find((i) => i.type === "video")?.content ?? [];

  const concepts = React.useMemo(
    () => safeContent.filter((i) => i.content_flag === "concepts"),
    [safeContent],
  );

  const notes = safeData.find((i) => i.type === "note")?.content ?? [];
  const filterNotes = React.useMemo(() => {
    if (!notes?.length) return null;

    // Only apply language filter if section type is subject
    if (selectedSection?.type === "subject") {
      const languageNotes = notes.filter((note) => note?.language === language);
      return languageNotes[0]; 
    }

    return notes[0];
  }, [notes, language, selectedSection]);

  const hasNotes = !filterNotes ? false : true;
  const hasBonusVideos = bonusVideos?.length > 0;
  const hasTrends = trends.length > 0;
  const hasConcepts =
    (video && video?.video_concepts?.length > 0) || concepts.length > 0;

  type IconWithColor = React.ReactElement<{ color?: string }>;

  const availableTabs = React.useMemo(() => {
    const tabs: {
      id: TabId;
      label: string;
      icon: IconWithColor;
      iconPosition?: "left" | "right";
    }[] = [];

    if (hasTrends) {
      tabs.push({
        id: "trends",
        label: tabsT("trends"),
        icon: <PathIcon size={16} />,
      });
    }

    if (hasConcepts) {
      tabs.push({
        id: "concepts",
        label: tabsT("concepts"),
        icon: <GraphIcon />,
      });
    }

    if (hasNotes) {
      tabs.push({
        id: "notes",
        label: tabsT("notes"),
        icon: <NoteIcon size={16} />,
        iconPosition: "left",
      });
    }

    if (hasBonusVideos) {
      tabs.push({
        id: "bonus-videos",
        label: tabsT("bonusVideos"),
        icon: <MediaPlayerIcon size={16} mode="outline" variant="play" />,
      });
    }

    return tabs;
  }, [hasNotes, hasBonusVideos, hasTrends, hasConcepts, video]);

  const [tab, setTab] = React.useState<TabId | string | null>("concepts");

  React.useEffect(() => {
    if (!availableTabs.length) return;

    const exists = availableTabs.find((t) => t.id === tab);

    if (!exists) {
      setTab(availableTabs[0].id);
    }
  }, [availableTabs, tab, video]);

  // 1️⃣ Loading → show skeleton
  if (loading) {
    return (
      <div className="md:rounded-md overflow-hidden bg-white p-4 space-y-4">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              width={120}
              height={36}
              sx={{ borderRadius: 999 }}
            />
          ))}
        </div>

        <div className="space-y-3">
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="70%" />
          <Skeleton
            variant="rectangular"
            height={140}
            sx={{ borderRadius: 12 }}
          />
        </div>
      </div>
    );
  }

  // 2️⃣ Not loading + no topic → return null
  if (!selectedTopic) {
    return null;
  }

  // 3️⃣ Not loading + no available tabs → return null
  if (!availableTabs.length) {
    return null;
  }

  return (
    <div className="md:rounded-md overflow-hidden">
      <Tabs
        items={availableTabs.map((t) => ({
          ...t,
          icon: React.cloneElement(t.icon, {
            color: tab === t.id ? "var(--icon-gray-normal)" : "white",
          }),
        }))}
        tab={tab}
        setTab={(nextTab: string) => {
          trackEvent("Content Details Viewed", {
            chapter_name: selectedChapter?.name!,
            topic_name: selectedTopic?.name!,
            content_detail_type: nextTab,
          });
          setTab(nextTab as TabId);
        }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {tab === "notes" && <Content tab="notes" notes={notes} />}

          {tab === "bonus-videos" && (
            <Content tab="bonus-videos" bonusVideos={bonusVideos} />
          )}

          {tab === "trends" && <Content tab="trends" trends={trends} />}

          {tab === "concepts" && (
            <Content tab="concepts" concepts={video?.video_concepts} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
