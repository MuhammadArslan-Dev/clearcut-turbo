// English <title> for /age-eligibility-calculator/<exam>. Targets the age-limit
// intent the page actually serves. It used to end in "Eligibility & Cutoff
// Date", which drew "<exam> cut off" (qualifying-marks) searches to a page
// that has no marks data.
export function ageCalculatorMetaTitle(shortName: string, year: number): string {
  return `${shortName} Age Calculator (${year}) - Age Limit & Eligibility Date | Clear Cutoff`;
}
