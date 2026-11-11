import { TopicProgress } from "../store/usePreparationDataStore";
import { Chapter } from "../types/types";

export function getOverallChapterProgress(
  chapters: Record<number, Chapter>,
  progressByTopicId: Record<number, TopicProgress>,
) {
  const chapterIds = Object.keys(chapters).map(Number);

  const totalChapters = chapterIds.length;

  const completedChapters = chapterIds.filter((chapterId) =>
    isChapterCompleted(chapterId, chapters, progressByTopicId),
  ).length;

  return {
    completedChapters,
    totalChapters,
  };
}

export function isChapterCompleted(
  chapterId: number,
  chapters: Record<number, Chapter>,
  progressByTopicId: Record<number, TopicProgress>,
) {
  const { completedTopics, totalTopics } = getChapterProgress(
    chapterId,
    chapters,
    progressByTopicId,
  );

  return totalTopics > 0 && completedTopics === totalTopics;
}

export function getChapterProgress(
  chapterId: number,
  chapters: Record<number, Chapter>,
  progressByTopicId: Record<number, TopicProgress>,
) {
  const chapter = chapters[chapterId];

  if (!chapter) {
    return { completedTopics: 0, totalTopics: 0 };
  }

  const topicIds = chapter.topics.map((t) => t.id);
  const totalTopics = topicIds.length;

  const completedTopics = topicIds.filter((topicId) =>
    isTopicCompleted(progressByTopicId[topicId]),
  ).length;

  return {
    completedTopics,
    totalTopics,
  };
}

export function isTopicCompleted(topic?: TopicProgress) {
  if (!topic) return false;

  // Progress Tracker v2: the server status already applies the per-topic
  // rule (only the activities a topic has; parents from their sub-topics).
  // On the legacy source "completed" means exactly the three flags below, so
  // this is unchanged there.
  if (topic.status === "completed") return true;

  return topic.videoWatched && topic.notesTaken && topic.miniTestDone;
}
