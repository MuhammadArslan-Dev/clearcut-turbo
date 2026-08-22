"use client";

import { Card } from "@clearcut/ui/card";
import {
  ArrowIcon,
  ChartSuccessBarIcon,
  ClockIcon,
  FireIcon,
  NoteIcon,
  SheildIcon,
  WarningCircleIcon,
} from "@/components/ui/icons";
import { Button } from "@clearcut/ui/button";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { TopicTrend } from "../../types/types";
import StatusChip from "@/components/ui/cards/preparation/chapter-list/StatusChip";
import Text from "@clearcut/ui/text";
import clsx from "clsx";
import VideoCard from "../MainVideo/VideoCard";
import { usePreparationModalStore } from "../../store/usePreparationModalStore";
import { motion } from "framer-motion";
import { usePreparationStore } from "../../store/usePreparationDataStore";
import { updateLearningProgress } from "@/lib/dashboard/userInteractions";
import { createLearningInteraction } from "@/lib/dashboard/todayGoals";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toLower } from "@clearcut/utils/text-format";
import Skeleton from "@clearcut/ui/skeleton";
import { trackEvent } from "@/lib/analytics/browser";
import { logger } from "@/lib/sentry/sentry-logger";
import PagesIcon from "@/components/ui/icons/page-icon";
import BellIcon from "@/components/ui/icons/Bell-icon";
import PieChartIcon from "@/components/ui/icons/pie-chart-icon";
import { GraphIcon } from "./RelatedContentWrapper";
import { useGetCurrentCourseStore } from "@/store/course/useGetCurrentCourseStore";
import { useVideoPlayerStore } from "../../store/useVideoPlayerStore";
import { getAuthTokenClient } from "@/lib/auth-token-client";
import { toast } from "react-toastify";
import {
  ContentItem,
  NoteItem,
  VideoConcept,
} from "../../types/topic-content-type";
import { useMainVideoProgressTrackerStore } from "../../store/useMainVideoProgressTracker";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface Props {
  tab: string;
  notes?: NoteItem[] | null;
  bonusVideos?: ContentItem[] | null;
  concepts?: VideoConcept[] | null;
  trend?: TopicTrend | null;
}

/* -------------------------------------------------------------------------- */
/*                                  MAIN                                      */
/* -------------------------------------------------------------------------- */

export default function Content({
  tab,
  notes,
  bonusVideos,
  concepts,
  trend,
}: Props) {
  const { open } = usePreparationModalStore();
  if (!tab) {
    return (
      <div className="bg-white p-4 space-y-3">
        <Skeleton variant="text" width="50%" />
        <Skeleton variant="rectangular" height={120} />
      </div>
    );
  }

  // if (tab === "notes") return <Trends onClick={() => open("previous-modal")} />;
  if (tab === "notes") return <Notes notes={notes} />;
  if (tab === "bonus-videos") return <BonusVideo videos={bonusVideos} />;
  if (tab === "trends")
    return <Trends trend={trend} onClick={() => open("previous-modal")} />;
  if (tab === "concepts") return <Concepts concepts={concepts} />;

  return null;
}

/* -------------------------------------------------------------------------- */
/*                               HELPERS                                      */
/* -------------------------------------------------------------------------- */

function isReactNativeWebView() {
  return typeof window !== "undefined" && !!(window as any).ReactNativeWebView;
}

export async function downloadFromBackend(
  noteId: number,
  filename = "notes.pdf",
  onProgress?: (percent: number) => void,
) {
  const baseUrl =
    process.env.NEXT_PUBLIC_LARAVEL_MAIN_BACKEND ??
    "http://clearcutoff-main-backend.test/api";
  const authToken = getAuthTokenClient();

  console.log("Downloading note with ID:", noteId);
  console.log("Downloading note with authToken:", authToken);
  console.log("Downloading note with filename:", filename);

  if (isReactNativeWebView()) {
    if (!authToken) throw new Error("Not authenticated.");
    window.open(
      `${baseUrl}/v2/preparation/open-note/${noteId}?token=${encodeURIComponent(authToken)}&filename=${encodeURIComponent(filename)}`,
      "_blank",
    );
    return;
  }

  if (!authToken) throw new Error("Not authenticated.");
  const downloadUrl = `${baseUrl}/v2/preparation/download-note/${noteId}`;

  let simulated = 0;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  if (onProgress) {
    onProgress(0);
    intervalId = setInterval(() => {
      simulated += (88 - simulated) * 0.08;
      onProgress(Math.floor(simulated));
    }, 300);
  }

  try {
    const response = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!response.ok) throw new Error(`Download failed: ${response.status}`);

    const contentLength = response.headers.get("Content-Length");
    const total = contentLength ? parseInt(contentLength, 10) : null;
    const reader = response.body!.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        received += value.length;
        if (total && onProgress) {
          const realPct = Math.min(Math.round((received / total) * 100), 99);
          const display = Math.max(realPct, Math.floor(simulated));
          simulated = display;
          onProgress(display);
        }
      }
    }

    if (intervalId) clearInterval(intervalId);
    onProgress?.(100);

    const blob = new Blob(chunks, { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch (e) {
    if (intervalId) clearInterval(intervalId);
    throw e;
  }
}

/* -------------------------------------------------------------------------- */
/*                                  NOTES                                     */
/* -------------------------------------------------------------------------- */

export function Notes({ notes }: { notes?: NoteItem[] | null }) {
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const {
    selectedTopic,
    markTopicFieldDone,
    course,
    selectedSectionId,
    selectedChapter,
  } = usePreparationStore();

  const t = useTranslations("relatedContent.studyTabs");

  const handleDownload = async (note: NoteItem) => {
    if (!note) return;
    setDownloadProgress(0);
    try {
      const filename = `${selectedTopic?.name ?? "notes"}.pdf`;
      await downloadFromBackend(note.id, filename, (p) => setDownloadProgress(p));
      trackEvent("Notes Downloaded", {
        content_id: "Notes",
        chapter_name: selectedChapter?.name!,
        topic_name: selectedTopic?.name!,
      });
      markVideoWatch();
    } catch {
      toast.error("Failed to download notes. Please try again.");
    } finally {
      setDownloadProgress(null);
    }
  };

  const markVideoWatch = async () => {
    await updateLearningProgress({
      course_id: course?.group_code!,
      section_id: selectedSectionId!,
      chapter_id: selectedChapter?.id!,
      topic_id: selectedTopic?.id.toString()!,
      notes_taken: true,
    });

    createLearningInteraction({
      topic_id: Number(selectedTopic?.id),
      interaction_type: "notes_taken",
    })
      .then(() => queryClient.invalidateQueries({ queryKey: ["today-goals"] }))
      .catch((err) => {
        logger.error(err, {
          tags: { type: "background_sync", module: "related-content-notes" },
          extra: {
            action: "createLearningInteraction",
            topicId: selectedTopic?.id,
          },
        });
      });

    trackEvent("Topic Status Changed", {
      topic_name: selectedTopic?.name!,
      new_status: "notesTaken",
      change_source: "manual_user_action",
    });
    markTopicFieldDone(Number(selectedTopic?.id), "notesTaken");
  };

  const language = useMemo(
    () => (course?.language === "english" ? "en" : "hi"),
    [course],
  );

  const filterNotes = useMemo(() => {
    if (!notes?.length) return null;
    const languageNotes = notes.filter((note) => note?.language === language);
    return languageNotes[0] ?? notes[0];
  }, [notes, language]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white px-3 py-4"
    >
      <div className="flex flex-col gap-5 justify-between md:flex-row">
        {/* Left */}
        {/* md:w-[50%] -> md:w-full while the Quick Revision column is commented out */}
        <div className="space-y-4 md:w-full md:flex md:flex-col md:items-center">
          <Title
            title={t("notes.detailedTitle")}
            subtext={t("notes.detailedSubtitle")}
            className="md:text-center"
          />

          {!notes?.length ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8 px-4 text-center">
              <NoteIcon size={40} color="var(--icon-gray-muted)" />
              <div>
                <Text as="p" variant="body-large" weight="semibold" color="gray-subtle">
                  Notes Not Available
                </Text>
                <Text as="p" variant="body-small" color="gray-muted" className="mt-1">
                  Notes for this topic are being prepared. We&apos;ll notify you when they&apos;re ready.
                </Text>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center gap-2 justify-center"
            >
              <Card borderRadius={16} padding={0} width="260px">
                <div className="flex flex-col items-center gap-4 px-4 py-3">
                  <div className="flex gap-4 w-auto justify-center">
                    <div className="flex justify-center items-center">
                      <NoteIcon variant="pdf" size={44} />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-1 items-center">
                          <WarningCircleIcon color="#768EA7" />
                          <Text
                            as="p"
                            variant="body-small"
                            className="flex items-center gap-1"
                            color="gray-muted"
                          >
                            {t("notes.meta.language")}:{" "}
                            <StatusChip
                              variant="outline"
                              tone="info"
                              className="!text-brand !bg-brand/7 body-xsmall !font-normal !py-0.5"
                              label={filterNotes?.language === "en" ? "English" : "Hindi"}
                            />
                          </Text>
                        </div>
                        <div className="flex gap-1 items-center">
                          <PagesIcon variant="double" mode="simple" />
                          <Text as="p" variant="body-small" color="gray-muted">
                            {t("notes.meta.pages")}:{" "}
                            <Text variant="body-small" color="gray-normal">
                              6 {toLower(t("notes.meta.pages"))}
                            </Text>
                          </Text>
                        </div>
                        <div className="flex gap-1 items-center">
                          <ClockIcon />
                          <Text as="p" variant="body-small" color="gray-muted">
                            {t("notes.meta.updatedFor")}:{" "}
                            <Text variant="body-small" color="gray-normal">
                              {course?.exam?.short_name}
                            </Text>
                          </Text>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full px-6">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        onClick={() => handleDownload(filterNotes as NoteItem)}
                        disabled={downloadProgress !== null}
                        sx={{
                          padding: "2px 12px",
                          borderRadius: "50px",
                        }}
                        size="sm"
                        fullWidth
                        variant="outlined"
                      >
                        {downloadProgress !== null ? (
                          <div className="flex flex-col items-center gap-1 w-full py-0.5">
                            <div className="flex items-center gap-1.5">
                              <div className="w-3 h-3 border-2 border-[#0083ff] border-t-transparent rounded-full animate-spin" />
                              <Text as="p" color="primary-dark" weight="semibold" variant="body-small">
                                {downloadProgress}%
                              </Text>
                            </div>
                            <div className="w-full bg-blue-100 rounded-full h-1">
                              <div
                                className="bg-[#0083ff] h-1 rounded-full transition-all duration-200"
                                style={{ width: `${downloadProgress}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <Text
                              as="p"
                              color="primary-dark"
                              weight="semibold"
                              variant="body-small"
                            >
                              {t("notes.buttons.download")}
                            </Text>
                            <ArrowIcon variant="download" color="#0083ff" />
                          </div>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </Card>

              <div className="flex items-center gap-2">
                <WarningCircleIcon color="#768EA7" />
                <Text as="p" variant="body-small" color="gray-muted">
                  {t("notes.footerHint")}
                </Text>
              </div>
            </motion.div>
          )}
        </div>

        {/* Divider + Quick Revision Notes (Coming soon) — temporarily hidden.
            To restore: uncomment the block below and change the Left column's
            className back to "space-y-4 md:w-[50%] md:flex md:flex-col md:items-center".

        <div className="w-0.5 md:block hidden bg-gray-300"></div>

        <div className="md:w-[50%] space-y-4 md:flex md:flex-col md:items-center">
          <Title
            title={t("notes.quickTitle")}
            subtext={t("notes.quickSubtitle")}
            className="md:text-center"
          />

          <div className="h-full w-full flex flex-col items-center justify-center gap-2">
            <div className="max-w-[240px] w-full">
              <Button
                sx={{
                  padding: "2px 12px",
                  borderRadius: "50px",
                }}
                size="sm"
                fullWidth
                variant="outlined"
              >
                <div className="flex items-center gap-1">
                  <Text
                    as="p"
                    color="primary-dark"
                    weight="semibold"
                    variant="body-small"
                  >
                    {t("notes.buttons.notify")}
                  </Text>
                  <BellIcon size={12} />
                </div>
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <WarningCircleIcon color="#768EA7" />
              <Text as="p" variant="body-small" color="gray-muted">
                {t("notes.footerHint")}
              </Text>
            </div>
          </div>
        </div>
        */}
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  TRENDS                                    */
/* -------------------------------------------------------------------------- */

/** Drop trailing zeros: 30.00 -> "30", 4.67 -> "4.67". */
function fmtNum(n?: number | string | null): string | null {
  if (n === null || n === undefined || n === "") return null;
  const v = Number(n);
  if (Number.isNaN(v)) return null;
  return String(Number(v.toFixed(2)));
}

/** "High" -> 3, "Medium" -> 2, "Low" -> 1. */
function importanceToFires(importance?: string | null): number {
  const v = (importance ?? "").toLowerCase();
  if (v.includes("high")) return 3;
  if (v.includes("medium")) return 2;
  if (v.includes("low")) return 1;
  return 0;
}

export function Trends({
  trend,
  onClick,
}: {
  trend?: TopicTrend | null;
  onClick: () => void;
}) {
  const trends = useTranslations("relatedContent.studyTabs.trends");
  const { course } = usePreparationStore();

  const examShort = course?.exam?.short_name ?? "";
  const fires = importanceToFires(trend?.topic_importance);

  const min = fmtNum(trend?.weightage_marks_min);
  const max = fmtNum(trend?.weightage_marks_max);
  const marksLabel =
    min && max ? (min === max ? `${min} marks` : `${min}-${max} marks`) : "—";

  const lastAppeared = trend?.last_appeared_year
    ? `${examShort} ${trend.last_appeared_year}`.trim()
    : "—";

  const avg = fmtNum(trend?.avg_questions_per_instance);
  const totalExams = trend?.total_exams ?? null;

  const totalQuestions = trend?.total_questions_in_pyq ?? null;
  const viewLabel =
    totalQuestions != null
      ? `View ${examShort} Questions (${totalQuestions})`.trim()
      : `View ${examShort} Questions`.trim();

  const sourceLabel =
    trend?.source ?? (examShort ? `Based on ${examShort} PYQs` : "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white p-3 md:p-4"
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <Title
            title={trends("title")}
            subtext={trends("subtitle")}
            className="md:text-center"
          />

          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: {
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
            className="w-full h-full flex gap-4 lg:gap-6 flex-col lg:flex-row md:justify-between"
          >
            <div className="w-full flex flex-col gap-4">
              <div className="w-full flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 items-center">
                    <div>
                      <FireIcon
                        variant="outline"
                        color="var(--icon-gray-muted)"
                      />
                    </div>
                    <Text
                      as="p"
                      variant="body-large"
                      weight="normal"
                      color="gray-subtle"
                    >
                      Topic Importance
                    </Text>
                  </div>
                  <div className="flex items-center">
                    {[0, 1, 2].map((i) =>
                      i < fires ? (
                        <FireIcon key={i} variant="red" />
                      ) : (
                        <FireIcon
                          key={i}
                          variant="outline"
                          color="var(--icon-gray-subtle)"
                        />
                      ),
                    )}
                  </div>
                </div>
              </div>
              <div className="w-full flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 items-center">
                    <div>
                      <PieChartIcon
                        size={24}
                        variant="bordered"
                        color="var(--icon-gray-muted)"
                      />
                    </div>
                    <Text
                      as="p"
                      variant="body-large"
                      weight="normal"
                      color="gray-subtle"
                    >
                      Marks Asked
                    </Text>
                  </div>
                  <div className="flex items-center">
                    <Text
                      as="p"
                      variant="body-large"
                      weight="semibold"
                      color="gray-normal"
                    >
                      {marksLabel}
                    </Text>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-2 hidden md:block bg-[var(--border-gray-subtle)]" />
            <div className="w-full flex flex-col gap-4">
              <div className="w-full flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 items-center">
                    <div>
                      <ChartSuccessBarIcon
                        width={20}
                        variant="graph-line"
                        color="var(--icon-gray-muted)"
                      />
                    </div>
                    <Text
                      as="p"
                      variant="body-large"
                      weight="normal"
                      color="gray-subtle"
                    >
                      Last Appeared
                    </Text>
                  </div>
                  <div className="flex items-center">
                    <Text
                      as="p"
                      variant="body-large"
                      weight="semibold"
                      color="gray-normal"
                    >
                      {lastAppeared}
                    </Text>
                  </div>
                </div>
              </div>
              <div className="w-full flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-2 items-center">
                    <div>
                      <ClockIcon
                        size={20}
                        variant="left-rotate"
                        color="var(--icon-gray-muted)"
                      />
                    </div>
                    <Text
                      as="p"
                      variant="body-large"
                      weight="normal"
                      color="gray-subtle"
                    >
                      Questions (per exam)
                    </Text>
                  </div>
                  <div className="flex flex-col justify-center items-end">
                    <Text
                      as="p"
                      variant="body-large"
                      weight="semibold"
                      color="gray-normal"
                    >
                      {avg ? `${avg} per exam` : "—"}
                    </Text>
                    {totalExams ? (
                      <Text as="p" variant="body-small" color="gray-subtle">
                        (Based on {totalExams} exams)
                      </Text>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="button"
              variant="soft"
              color="gray"
              onClick={onClick}
              sx={{ borderRadius: "50px" }}
            >
              <div className="flex gap-2 items-center">
                <p>{viewLabel}</p>
                <ArrowIcon color="var(--icon-gray-normal)" variant="right" />
              </div>
            </Button>
          </motion.div>

          {sourceLabel ? (
            <div className="flex items-center gap-1">
              <SheildIcon
                size={16}
                color="#768EA7"
                mode="simple"
                variant="outline"
              />
              <Text color="gray-subtle" variant="body-small" weight="normal">
                {sourceLabel}
              </Text>
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               BONUS VIDEO                                  */
/* -------------------------------------------------------------------------- */

export function BonusVideo({ videos }: { videos?: ContentItem[] | null }) {
  const bVideo = useTranslations("relatedContent.studyTabs.bonusVideos");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white py-4"
    >
      <div className="space-y-4">
        <Title
          title={bVideo("title")}
          subtext={bVideo("subtitle")}
          className="px-3"
        />

        <div className="grid md:grid-cols-3 gap-4">
          {videos?.map((video, i) => (
            <motion.div key={i} whileHover={{ scale: 1.02 }}>
              <VideoCard url={video?.video_link!} />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                CONCEPTS                                    */
/* -------------------------------------------------------------------------- */

function convertToSeconds(time: string) {
  const parts = time.split(":").map(Number);

  if (parts.length === 2) {
    const [m, s] = parts;
    return m * 60 + s;
  }

  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }

  return 0;
}
export function Concepts({ concepts }: { concepts: VideoConcept[] }) {
  const { seekTo } = useVideoPlayerStore();
  const { currentTime } = useMainVideoProgressTrackerStore();

  const activeIndex = React.useMemo(() => {
    if (!concepts?.length) return -1;

    const times = concepts.map((c) => convertToSeconds(c.time));

    for (let i = 0; i < times.length; i++) {
      if (currentTime < times[i]) {
        return i - 1 >= 0 ? i - 1 : 0;
      }
    }

    return times.length - 1;
  }, [currentTime, concepts]);

  if (!concepts?.length) {
    return (
      <div className="bg-white p-4 space-y-3">
        <Text color="gray-subtle" variant="body-small" weight="normal">
          No concepts found
        </Text>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white p-3 md:p-4"
    >
      <div className="space-y-4">
        <Title
          title="Jump to exact concept in video"
          subtext="Click on any concept for faster learning and revision"
        />

        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.08,
              },
            },
          }}
          className="flex md:flex-row justify-between flex-col gap-2 md:gap-6 max-h-[400px] overflow-y-auto"
        >
          {[0, 1].map((col) => {
            const chunkSize = Math.ceil(concepts?.length / 2);

            return (
              <div key={col} className="space-y-2 w-full">
                {concepts
                  .slice(col * chunkSize, (col + 1) * chunkSize)
                  .map((item, i) => {
                    const globalIndex = col * chunkSize + i;
                    const isActive = globalIndex === activeIndex;

                    return (
                      <motion.div
                        key={i}
                        // ref={isActive ? activeRef : null}
                        variants={{
                          hidden: { opacity: 0, y: 8 },
                          show: { opacity: 1, y: 0 },
                        }}
                        onClick={() => seekTo(convertToSeconds(item.time))}
                        className={clsx(
                          "cursor-pointer flex flex-col gap-1 py-2 rounded-md transition-all",
                          "pl-3 pr-3",
                          isActive
                            ? "bg-brand/10 border-l-4 border-brand"
                            : "hover:bg-gray-50",
                        )}
                      >
                        <div className="flex gap-6 items-center">
                          <StatusChip
                            variant="outline"
                            tone="info"
                            className={clsx(
                              "!border-none px-3 py-1 body-medium !font-semibold",
                              "!text-brand !bg-brand/9",
                            )}
                            label={item.time}
                          />

                          <Text
                            as="p"
                            variant="body-medium"
                            color={"gray-normal"}
                            weight={"normal"}
                          >
                            {item.name}
                          </Text>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  TITLE                                     */
/* -------------------------------------------------------------------------- */

export function Title({
  title,
  subtext,
  className,
}: {
  title: string;
  subtext: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <Text as="h6" variant="body-large" color="gray-normal" weight="semibold">
        {title}
      </Text>

      <Text as="p" variant="body-small" weight="normal" color="gray-muted">
        {subtext}
      </Text>
    </div>
  );
}
