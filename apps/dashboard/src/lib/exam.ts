// ===============================
// API BASE
// ===============================

import { Exam } from "@/components/features/exam/types/exam";
import { apiFetch } from "./api/client";

// ===============================
// TYPES
// ===============================

export interface ExamApiResponse {
  status?: string;
  message?: string;
  data: Exam;
}

// ===============================
// GET EXAM
// ===============================

export async function getExamById(
  examId: string | number,
): Promise<ExamApiResponse> {
  return apiFetch<ExamApiResponse>(`/v2/exam/get-exam/${examId}`, {
    method: "GET",
  });
}
export async function examTimer(
  examId: string | number,
): Promise<ExamApiResponse> {
  return apiFetch<ExamApiResponse>(`/v2/exam/attempt/${examId}/heartbeat`, {
    method: "POST",
  });
}

// ===============================
// AUTO SAVE
// ===============================

export async function autoSaveAnswer(
  examId: string,
  questionId: number,
  option: string | null,
  review: boolean,
): Promise<void> {
  return apiFetch<void>(`/exam/${examId}/autosave`, {
    method: "POST",

    body: JSON.stringify({
      question_id: questionId,
      option,
      review,
    }),
  });
}

// ===============================
// SUBMIT EXAM
// ===============================

export async function submitExam(examId: string): Promise<void> {
  return apiFetch<void>(`/exam/${examId}/submit`, {
    method: "POST",
  });
}

// ===============================
// PROCTOR LOG
// ===============================

export async function sendProctorEvent(
  examId: string,
  type: string,
  meta: any = {},
): Promise<void> {
  return apiFetch<void>(`/exam/${examId}/proctor`, {
    method: "POST",

    body: JSON.stringify({
      type,
      meta,
      time: Date.now(),
    }),
  });
}



// ===============================
// SUBMIT ANSWER
// ===============================

export interface SubmitAnswerPayload {
  exam_id: string | number;
  question_id: number;
  user_option: "1" | "2" | "3" | "4";
  time_spent?: number;
}

export interface SubmitAnswerResponse {
  status: "success";
  message: string;
  data: {
    question_id: number;
    user_option: string;
    is_correct: boolean;
  };
}


export async function submitAnswer(
  payload: SubmitAnswerPayload
): Promise<SubmitAnswerResponse> {

  return apiFetch<SubmitAnswerResponse>(`/v2/exam/answer`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(payload),
  });
}


// ===============================
// CLEAR ANSWER
// ===============================

export interface ClearAnswerPayload {
  exam_id: string | number;
  question_id: number;
}

export async function clearAnswer(payload: ClearAnswerPayload): Promise<void> {
  return apiFetch<void>(`/v2/exam/clear-answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}


// ===============================
// MARK FOR REVIEW
// ===============================

export interface MarkForReviewPayload {
  exam_id: string | number;
  question_id: number;
  user_option?: "1" | "2" | "3" | "4" | null;
}

export async function markForReview(payload: MarkForReviewPayload): Promise<void> {
  return apiFetch<void>(`/v2/exam/mark-review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

