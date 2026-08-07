import { apiFetch } from "../api/client";
import { Paper } from "@/components/features/preparation/types/types";

/* -------------------------------------------------------------------------- */
/*  Legacy types — still used by FullTest                                      */
/* -------------------------------------------------------------------------- */

export interface TestsList {
  id: number;
  uuid: string;
  identifier: string | number;
  navigation_id: string;
  exam_instance_id: string | number;
  stage_id: string;
  label_id: string;
  st_status: string;
  status: string;
  st_order: string;
  order: string;
  locked: boolean;
}

export interface Attempt {
  id: number;
  uuid: string;
  user_id: number;
  course_id: number | string;
  paper_id: number | string;
  section_id: number | string;
  test_id: number | string;
  type: string;
  test_type: string;
  status: string;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  unattempted: number;
}

export interface FullLengthTestListData {
  tests: Record<number, TestsList[]>;
  paper: Paper[];
  activePaper: Paper;
  attempts: any;
}

export interface FullLengthTestResponse {
  status: "success" | "error";
  message: string;
  data: FullLengthTestListData;
}

/* -------------------------------------------------------------------------- */
/*  New sectional-test API types  (v2/test/sectional/:id?paper_id=X)          */
/* -------------------------------------------------------------------------- */

export interface SectionalTestItem {
  id: number;
  uuid: string;
  test_number: number;
  number_of_questions: number;
  total_time: number; // seconds
  is_mandatory: boolean;
  status: string;
  metadata: {
    section_id: string;
    section_name: string;
  };
  is_attempted: boolean;
  attempt: any | null;
  locked?: boolean;
}

export interface ChapterItem {
  id: number;
  uuid: string;
  name: string;
  chapter_id: string;
  total_tests: number;
  attempted_count: number;
  mandatory_count: number;
  tests: SectionalTestItem[];
}

export interface SectionalSection {
  id: number;
  uuid: string;
  name: string;
  section_id: string;
  total_tests: number;
  attempted_count: number;
  mandatory_count: number;
  tests: SectionalTestItem[];
  chapters: ChapterItem[];
}

export interface SectionalTestV2Data {
  paper: Paper;
  papers: Paper[];
  sections: SectionalSection[];
}

export interface SectionalTestV2Response {
  status: "success" | "error";
  message: string;
  data: SectionalTestV2Data;
}

/* -------------------------------------------------------------------------- */
/*  API functions                                                               */
/* -------------------------------------------------------------------------- */

export async function getSectionsTestList(
  courseId?: number | string,
  paperId?: number | string | null,
): Promise<SectionalTestV2Response> {
  const url = paperId
    ? `/v2/test/sectional/${courseId}?paper_id=${paperId}`
    : `/v2/test/sectional/${courseId}`;
  return apiFetch<SectionalTestV2Response>(url, { method: "GET" });
}

export async function getChapterTestList(
  courseId?: number | string,
  paperId?: number | string | null,
): Promise<SectionalTestV2Response> {
  const url = paperId
    ? `/v2/test/sectional/${courseId}?paper_id=${paperId}`
    : `/v2/test/sectional/${courseId}`;
  return apiFetch<SectionalTestV2Response>(url, { method: "GET" });
}

export async function getFullLengthTestList(
  courseId?: number | string,
): Promise<FullLengthTestResponse> {
  return apiFetch<FullLengthTestResponse>(
    `/v2/test/list/${courseId}?type=full-length-test`,
    { method: "GET" },
  );
}

export async function createSectionsTest({
  testId,
  paperId,
  sectionId,
  courseId,
  testType,
}: {
  testId: number | string;
  paperId: number | string;
  sectionId: number | string;
  courseId: number | string;
  testType: string;
}): Promise<FullLengthTestCreateResponse> {
  return apiFetch<FullLengthTestCreateResponse>(
    `/v2/exam/create-exam?paperId=${paperId}&sectionId=${sectionId}&test_id=${testId}&examType=sectional-tests&courseId=${courseId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
  );
}

export async function createChapterTest({
  testId,
  paperId,
  chapterId,
  courseId,
}: {
  testId: number | string;
  paperId: number | string;
  chapterId: number | string;
  courseId: number | string;
}): Promise<FullLengthTestCreateResponse> {
  return apiFetch<FullLengthTestCreateResponse>(
    `/v2/exam/create-exam?paperId=${paperId}&chapterId=${chapterId}&test_id=${testId}&examType=chapter-test&courseId=${courseId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
  );
}

export type FullLengthTestCreateResponse = {
  data: Attempt;
  status: string;
  message: string;
};

export async function createFullLengthTest({
  testId,
  paperId,
  courseId,
}: {
  testId: number | string;
  paperId: number | string;
  sectionId?: number | string;
  courseId: number | string;
  testType: string;
}): Promise<FullLengthTestCreateResponse> {
  return apiFetch<FullLengthTestCreateResponse>(
    `/v2/exam/create-exam?paperId=${paperId}&test_id=${testId}&examType=full-length-papers&courseId=${courseId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
  );
}

export type AttemptsHistoryResponse = {
  data: any;
  status: string;
  message: string;
};

export async function getAttemptsHistory(
  queryParam?: string,
): Promise<AttemptsHistoryResponse> {
  return apiFetch<AttemptsHistoryResponse>(
    `/v2/exam/exam-attempts-list${queryParam ? `?${queryParam}` : ""}`,
    { method: "GET" },
  );
}
