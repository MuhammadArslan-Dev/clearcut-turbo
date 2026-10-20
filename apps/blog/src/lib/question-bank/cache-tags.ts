// Next data-cache tags on every backend read behind the question-bank pages
// (questions, the exam index, the sitemap's question index), so the backend's
// post-sync webhook (app/api/revalidate) can expire exactly that data:
// one exam's ("qb:ctet") or all of it ("qb").

export const QUESTION_TAG = "qb";

export function examQuestionTag(exam: string): string {
  return `${QUESTION_TAG}:${exam.toLowerCase()}`;
}

export function questionTags(exam: string): string[] {
  return [QUESTION_TAG, examQuestionTag(exam)];
}
