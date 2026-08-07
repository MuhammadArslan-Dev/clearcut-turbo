"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";

import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

import { motion, AnimatePresence } from "framer-motion";

import TopicListCard from "@/components/ui/cards/preparation/topic-card/topic-list-card";
import TopicListCardSkeleton from "@/components/ui/cards/preparation/topic-card/topic-list-card-skeleton";
import SectionHeaderCard from "@/components/ui/cards/preparation/chapter-list/SectionHeaderCard";
import { Card } from "@clearcut/ui/card";
import ProgressBar from "@/components/ui/ProgressBar";

import SectionsTab from "@/components/features/preparation/components/SectionsTab";
import PaperSwitch from "@/components/features/preparation/components/PaperSwitch";

import {
  CircleTickIcon,
  PenIcon,
  StarBadge,
  VideoCamIcon,
} from "@/components/ui/icons";

import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";
import { useIsMobile } from "@/hooks/useIsMobile";

import { usePreparationStore } from "@/components/features/preparation/store/usePreparationDataStore";
import { useChapterData } from "@/components/features/preparation/hooks/useChapterData";

import { Chapter, Topic } from "@/components/features/preparation/types/types";

import {
  getChapterProgress,
  getOverallChapterProgress,
  isTopicCompleted,
} from "@/components/features/preparation/util/progressTracker";

import { Skeleton } from "@/components/ui/skeleton";

/* ---------------- animations ---------------- */

const listContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
};

const listItem = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0 },
};

/* ---------------- component ---------------- */

export default function Sidebar() {
  const { set } = useQueryParams();
  const isMobile = useIsMobile();

  const topicContainerRef = useRef<HTMLDivElement | null>(null);
  const activeTopicRef = useRef<HTMLDivElement | null>(null);

  const {
    selectedSectionId,
    chapters,
    setChapters,
    setChapter,
    setTopic,
    selectedTopic,
    progressByTopicId,
  } = usePreparationStore();

  // Fetch chapters
  const { syllabus } = useChapterData(selectedSectionId);

  /* ---------------- SYNC CHAPTERS ---------------- */

  useEffect(() => {
    if (syllabus?.length) {
      setChapters(syllabus);
    }
  }, [syllabus, setChapters]);

  /* ---------------- RESET SCROLL ON SECTION CHANGE ---------------- */

  useEffect(() => {
    if (topicContainerRef.current) {
      topicContainerRef.current.scrollTo({
        top: 0,
        behavior: "auto",
      });
    }

    // Clear old active ref when section changes
    activeTopicRef.current = null;
  }, [selectedSectionId]);

  /* ---------------- AUTO CENTER (SMART + SAFE) ---------------- */

  useLayoutEffect(() => {
    if (!topicContainerRef.current || !activeTopicRef.current) return;

    const container = topicContainerRef.current;
    const active = activeTopicRef.current;

    // 🟢 Verify that active topic actually belongs to current section
    const existsInCurrentSection = chapters?.some((chapter) =>
      chapter.topics.some((topic) => topic.id === selectedTopic?.id),
    );

    if (!existsInCurrentSection) return;

    // 🟢 Wait one frame so new DOM + motion layout is settled
    const raf = requestAnimationFrame(() => {
      const containerRect = container.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();

      const currentScroll = container.scrollTop;

      const offset =
        activeRect.top -
        containerRect.top -
        containerRect.height / 2 +
        activeRect.height / 2;

      container.scrollTo({
        top: currentScroll + offset,
        behavior: "smooth",
      });
    });

    return () => cancelAnimationFrame(raf);
  }, [selectedTopic, chapters, selectedSectionId]);

  /* ---------------- DATA HELPERS ---------------- */

  const chaptersById = useMemo(() => {
    const map: Record<number, Chapter> = {};
    chapters?.forEach((chapter) => {
      map[chapter.id] = chapter;
    });
    return map;
  }, [chapters]);

  const { completedChapters, totalChapters } = useMemo(() => {
    return getOverallChapterProgress(chaptersById, progressByTopicId);
  }, [chaptersById, progressByTopicId]);

  /* ---------------- HANDLERS ---------------- */

  const handleTopicChange = useCallback(
    (chapter: Chapter, topic: Topic) => {
      setChapter(chapter);
      setTopic(topic);

      if (isMobile) {
        set({ topic: true }, { replace: false });
      }
    },
    [isMobile, set, setChapter, setTopic],
  );

  /* ---------------- RENDER ---------------- */

  return (
    <aside className="flex h-[calc(100%)] w-full 2md:w-[var(--preparation-sidebar-width)] flex-col md:p-2">
      <div className="h-full bg-[var(--background-gray-subtle)] md:bg-white shadow-sm space-y-4 pt-4 md:rounded-md">
        {/* Mobile header */}
        <div className="py-2 block md:hidden">
          <div className="flex justify-center">
            <PaperSwitch />
          </div>
          <SectionsTab layoutId={"section-tab-mobile"} />
        </div>

        {/* Progress summary */}
        <div className="px-4">
          <Card borderRadius="8px" padding={0}>
            <div className="bg-white px-4 py-2 space-y-2 rounded-md">
              <div className="flex justify-center gap-6">
                <ProgressBlock title="30 marks" subtitle="Out of 150" />
                <ProgressBlock
                  title={`${completedChapters} / ${totalChapters} chapters`}
                />
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <ProgressBar
                  showLabel={false}
                  completed={Number(completedChapters)}
                  total={Number(totalChapters)}
                />
              </motion.div>
            </div>
          </Card>
        </div>

        {/* Topics list */}
        <nav
          ref={topicContainerRef}
          className="h-[calc(100%-225px)] md:h-[calc(100%-90px)] flex-1 space-y-6 py-4 overflow-y-auto"
        >
          {!chapters && <TopicListSkeleton />}

          <AnimatePresence>
            {chapters?.map((chapter, chapterIndex) => {
              const chapterProgress = getChapterProgress(
                chapter.id,
                chaptersById,
                progressByTopicId,
              );

              return (
                <motion.div
                  key={chapter.id}
                  variants={listContainer}
                  initial="hidden"
                  animate="visible"
                >
                  <SectionHeaderCard
                    breadcrumb={`Section ${chapterIndex + 1} • ${
                      chapterProgress.completedTopics
                    } / ${chapterProgress.totalTopics}  Completed`}
                    title={chapter.name}
                    cursor="cursor-pointer"
                    titleClassName="!heading-small !font-semibold text-surface-gray-normal"
                    breadcrumbClassName="body-small text-surface-gray-muted"
                    radiusClassName="rounded-none"
                    containerClassName="px-4 py-3"
                  />

                  <div className="px-4 space-y-4">
                    {chapter.topics.map((topic, topicIndex) => {
                      const isActive = selectedTopic?.id === topic.id;
                      const topicProgress = progressByTopicId[topic.id];
                      const completed = isTopicCompleted(topicProgress);

                      return (
                        <motion.div
                          layout
                          key={topic.id}
                          variants={listItem}
                          initial="hidden"
                          animate="visible"
                          whileHover={{ scale: 1.01 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 22,
                          }}
                        >
                          {/* 🔥 stable ref node */}
                          <div ref={isActive ? activeTopicRef : null}>
                            <TopicListCard
                              cardBgColor="!px-0"
                              badge={
                                <div className="flex gap-2">
                                  <StarBadge />
                                  <p>{topic.difficulty_level}</p>
                                </div>
                              }
                              isActive={isActive}
                              titleClassName="!body-medium !font-normal text-surface-gray-subtle"
                              metaTextClassName="body-small !font-normal text-surface-gray-muted"
                              containerClassName="px-3 py-2 md:border"
                              counter={{
                                value: topicIndex + 1,
                                colorKey: completed ? "success" : "info",
                                variant: completed
                                  ? "filled"
                                  : isActive
                                    ? "progress"
                                    : "simple",
                              }}
                              features={[
                                {
                                  icon: topicProgress?.videoWatched ? (
                                    <CircleTickIcon
                                      size={16}
                                      variant="filled"
                                      value="true"
                                    />
                                  ) : (
                                    <VideoCamIcon variant="outline" size={16} />
                                  ),
                                  value: topicProgress?.videoWatched
                                    ? null
                                    : "Video",
                                },
                                {
                                  icon: (
                                    <PenIcon variant="book-pen" size={16} />
                                  ),
                                  value: "Notes",
                                },
                                {
                                  icon: <PenIcon size={16} />,
                                  value: "Mini-test",
                                },
                              ]}
                              time={{
                                color: "bg-yellow-100 text-black",
                                value: "15 min",
                              }}
                              title={topic.name}
                              onClick={() => handleTopicChange(chapter, topic)}
                              bgColor={
                                isActive
                                  ? "bg-[var(--color-brand)]/15 md:border-[var(--color-brand)]"
                                  : "bg-white md:border-[var(--border-gray-muted)]"
                              }
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </nav>
      </div>
    </aside>
  );
}

/* ---------------- helpers ---------------- */

const ProgressBlock = React.memo(
  ({ title, subtitle }: { title: string; subtitle?: string }) => {
    return (
      <div className="flex items-center gap-2">
        <div>{/* SVG preserved */}</div>
        <div className="text-center">
          <div className="body-large text-surface-gray-normal">{title}</div>
          {subtitle && (
            <p className="body-small text-surface-gray-muted">{subtitle}</p>
          )}
        </div>
      </div>
    );
  },
);

const TopicListSkeleton = React.memo(() => {
  return (
    <div className="px-4 space-y-4">
      <div className="flex flex-col gap-3">
        <Skeleton className="w-[150px] h-3.5" />
        <Skeleton className="w-[100px] h-5" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <TopicListCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
});
