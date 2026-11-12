/**
 * The `scoring` block every test submit returns (backend ScoringService, phase 103):
 * daily, onboarding practice test, topic (mini) test, and the exam-series result
 * (chapter / sectional / full-length, there inside `result`). Marks follow the exam's
 * marking scheme; `cutoff` is the paper's pass share × this test's max marks, or
 * null when the exam has no documented pass mark (then no cutoff is shown).
 */
export interface TestScoring {
  correct: number;
  wrong: number;
  unanswered: number;
  total_questions: number;
  /** answered questions whose bank key is missing/invalid (never counted correct) */
  invalid_key: number;
  marks: number;
  max_marks: number;
  percentage: number;
  cutoff: number | null;
  cutoff_source: string | null;
  passed: boolean | null;
  marking_source: string | null;
  sections: {
    section_id: number | null;
    correct: number;
    wrong: number;
    unanswered: number;
    total_questions: number;
    marks: number;
    max_marks: number;
  }[];
}

/** The result-screen numbers (@clearcut/motion TestResult `data`) from a scoring block. */
export function scoringToResultData(s: TestScoring) {
  return {
    score: s.marks,
    maxScore: s.max_marks > 0 ? s.max_marks : 1,
    cutoff: s.cutoff,
    correct: s.correct,
    wrong: s.wrong,
    skipped: s.unanswered,
  };
}
