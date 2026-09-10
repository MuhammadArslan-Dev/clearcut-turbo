// "Official Requirements" widget data — dimensions/file-size/format and
// administering-body name are plain facts; the generalRequirements/rulesText
// prose conveys the same factual content in original wording. Sourced from
// the clearcut-tools-backend API (see src/lib/api/toolsApi.ts) at build
// time, keyed by our own resizerExams.ts slug — an exam whose backend row
// has no officialRequirements in its data_json simply has no widget
// rendered (see ResizerSpokePage.tsx), rather than showing fabricated
// content. `thumb` is present only for exams that actually require a left
// thumb impression upload; the API doesn't model per-exam thumb dimensions
// yet, so this is always absent until that's added there.
export interface OfficialRequirementCard {
  widthPx: number;
  heightPx: number;
  minKB: number;
  maxKB: number;
  format: string;
  generalRequirements?: string;
  rulesLabel: string;
  rulesText: string;
}

export interface ExamOfficialRequirements {
  administeringBody: string;
  photo: OfficialRequirementCard;
  signature: OfficialRequirementCard;
  thumb?: OfficialRequirementCard;
}

import { getResizerData } from "./api/toolsApi";

export async function getOfficialRequirements(slug: string): Promise<ExamOfficialRequirements | undefined> {
  const { officialRequirements } = await getResizerData();
  return officialRequirements[slug];
}
