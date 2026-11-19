import type { QueryClient } from "@tanstack/react-query";
import { P_QUERY_KEY } from "@/components/features/preparation/hooks/usePreparationData";
import { RESUME_STATE_KEY } from "@/hooks/course/useResumeState";

/**
 * ONE place that keeps every cached view of "where the student is in a course" in step
 * (phase 107). The saved position (paper / section / chapter / topic) used to be copied
 * into responses cached for 5-30 minutes (`["preparation", course]` carries `paper_id` /
 * `section_id`, `["chapter", …]` carries `state`, the Learn resume bar has its own copy), and
 * nothing updated those copies when the student moved. Reopening the course in the same
 * session therefore restored the position from the FIRST fetch — and the page then saved that
 * stale position back over the real one.
 */
export interface CoursePosition {
  /** The course's `group_code` (what the resume row is keyed by). */
  groupCode: string;
  /** The id in the URL (`/preparation/{id}`) — the preparation query is keyed by it. */
  routeCourseId?: string;
  paperId?: number | string | null;
  sectionId?: number | string | null;
  chapterId?: number | string | null;
  topicId?: number | string | null;
}

// Cached payloads are patched field-by-field; their full types live with their own hooks.
type Rec = Record<string, unknown> & { state?: Record<string, unknown> };

/** The student's selection right now is the truth: write it into every cache that embeds it. */
export function patchCoursePosition(queryClient: QueryClient, pos: CoursePosition): void {
  const paper = pos.paperId != null ? String(pos.paperId) : null;
  const section = pos.sectionId != null ? String(pos.sectionId) : null;
  const chapter = pos.chapterId != null ? String(pos.chapterId) : null;
  const topic = pos.topicId != null ? Number(pos.topicId) : null;

  // Syllabus payload: which paper / section the course opens on.
  for (const id of new Set([pos.groupCode, pos.routeCourseId].filter(Boolean) as string[])) {
    queryClient.setQueryData<Rec>(P_QUERY_KEY(id), (old) =>
      old
        ? {
            ...old,
            paper_id: paper != null ? Number(paper) : old.paper_id,
            section_id: section != null ? Number(section) : old.section_id,
          }
        : old,
    );
  }

  // Chapters payload (per section): the chapter / topic the section opens on.
  queryClient.setQueriesData<Rec>({ queryKey: ["chapter", pos.groupCode] }, (old) =>
    old
      ? {
          ...old,
          state: {
            ...(old.state ?? {}),
            course_id: pos.groupCode,
            paper_id: paper,
            section_id: section,
            chapter_id: chapter,
            topic_id: topic,
          },
        }
      : old,
  );

  // Learn resume bar (names are refreshed by refreshCourseViews once the server has it).
  queryClient.setQueryData<Rec>(RESUME_STATE_KEY(pos.groupCode), (old) =>
    old ? { ...old, paper_id: paper, section_id: section, chapter_id: chapter, topic_id: topic } : old,
  );
}

/**
 * The server now holds the new position (and, through it, the paper the My Course card
 * shows — backend `LastActivePaper`): refetch what is derived from it.
 */
export function refreshCourseViews(queryClient: QueryClient, groupCode: string): void {
  queryClient.invalidateQueries({ queryKey: RESUME_STATE_KEY(groupCode) });
  // The card's paper and that paper's meter / progress. (Goals, streak and practice state
  // do not depend on the position, so they are left alone.)
  for (const key of [["my-courses"], ["courses-cutoff-meter"], ["cutoff-meter"], ["courses-progress-summary"]]) {
    queryClient.invalidateQueries({ queryKey: key });
  }
}
