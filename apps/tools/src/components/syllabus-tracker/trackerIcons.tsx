"use client";

// Small inline icon set for the dashboard — subject icons are picked by
// keyword against a known, bounded vocabulary of subjects that actually show
// up across these teacher-eligibility exams (Math, Science, Environmental
// Studies, Social Studies, languages, Pedagogy, Arts, Music, PE, Home
// Science). This is safe to hardcode because that vocabulary is small and
// well-known for this exam domain — it is NOT an attempt to infer meaning
// from arbitrary chapter text, which stays purely decorative (see
// CHAPTER_TONES below).

export const BookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 6.5c-1.5-1-4-1.5-6-1v13c2 0 4.5.5 6 1.5M12 6.5c1.5-1 4-1.5 6-1v13c-2 0-4.5.5-6 1.5M12 6.5v14" />
  </svg>
);

export const BarChartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 20V10M12 20V4M18 20v-7" />
  </svg>
);

export const DocumentIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h9l3 3v15H6z" />
    <path d="M9 12h6M9 16h6" />
  </svg>
);

export const SqrtIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 14l2 2 3-8h13" />
  </svg>
);

export const FlaskIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3h6M10 3v6l-5.5 9a1.5 1.5 0 0 0 1.3 2.2h12.4a1.5 1.5 0 0 0 1.3-2.2L14 9V3" />
  </svg>
);

export const LeafIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 4 13c0-6 5-10 15-10 0 10-4 15-10 15Z" />
    <path d="M4 20c4-4 8-8 15-15" />
  </svg>
);

export const GlobeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.5 3.5 6 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-6-3.5-9s1-6.5 3.5-9Z" />
  </svg>
);

export const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="8" r="3" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <circle cx="17.5" cy="9" r="2.5" />
    <path d="M15.5 13.2c2.6.4 4.5 2.3 5 4.8" />
  </svg>
);

export const CapIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10L12 5 2 10l10 5 10-5Z" />
    <path d="M6 12.5V17c0 1.1 2.7 3 6 3s6-1.9 6-3v-4.5" />
  </svg>
);

export const PaletteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.4-.3-.4-.5-.9-.5-1.4 0-1.1.9-2 2-2h2.3c1.8 0 3.2-1.4 3.2-3.2C20.5 6.4 16.7 3 12 3Z" />
    <circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
    <circle cx="10.5" cy="7" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="7.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const MusicIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l11-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="17" cy="16" r="3" />
  </svg>
);

export const DumbbellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 9v6M2 10v4M20 9v6M22 10v4M7 12h10" />
    <path d="M7 9v6M17 9v6" />
  </svg>
);

export const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11l9-7 9 7" />
    <path d="M5 10v10h14V10" />
  </svg>
);

export const LayersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l9 5-9 5-9-5 9-5Z" />
    <path d="M3 13l9 5 9-5" />
  </svg>
);

export const ChatIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a7.5 7.5 0 0 1-11.6 6.3L4 19l1.3-4.2A7.5 7.5 0 1 1 21 11.5Z" />
  </svg>
);

export const LightbulbIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.5.4.8.9.8 1.6h5.4c0-.7.3-1.2.8-1.6A6 6 0 0 0 12 3Z" />
  </svg>
);

export const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7L12 3Z" />
  </svg>
);

export const LinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.5 1.5" />
    <path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.5-1.5" />
  </svg>
);

export const EditSquareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
    <path d="M18.4 2.6a2 2 0 1 1 2.8 2.8L12 14.6 8 15.6l1-4L18.4 2.6Z" />
  </svg>
);

export const KebabIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5" r="1.8" />
    <circle cx="12" cy="12" r="1.8" />
    <circle cx="12" cy="19" r="1.8" />
  </svg>
);

export const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
  </svg>
);

export const CheckIcon = ({ size = 12, strokeWidth = 3 }: { size?: number; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Every value here is an existing design-token pair, not a new hardcoded
 * colour — see the identical rationale on ExamPickerStep's TONES. */
export const TONES = [
  { bg: "var(--color-primary-subtle)", text: "var(--color-primary-strong)" },
  { bg: "var(--color-success-soft)", text: "var(--color-success-strong)" },
  { bg: "var(--color-warning-bg-soft)", text: "var(--color-warning-strong)" },
  { bg: "var(--color-danger-bg-soft)", text: "var(--color-danger-strong)" },
  { bg: "var(--color-gray-bg-soft)", text: "var(--color-gray-strong)" },
];

const SUBJECT_ICON_RULES: [RegExp, () => React.ReactNode][] = [
  [/environment/i, () => <LeafIcon />],
  [/math/i, () => <SqrtIcon />],
  [/science/i, () => <FlaskIcon />],
  [/social|civics|geography|history|political/i, () => <GlobeIcon />],
  [/child development/i, () => <UsersIcon />],
  [/pedagog|psychology/i, () => <CapIcon />],
  [/art|drawing|craft/i, () => <PaletteIcon />],
  [/music/i, () => <MusicIcon />],
  [/physical education|sports/i, () => <DumbbellIcon />],
  [/home science/i, () => <HomeIcon />],
  [/hindi|english|sanskrit|urdu|punjabi|language|literature/i, () => <BookIcon />],
];

/** Subject icon, picked by keyword against a small known vocabulary (see
 * module comment) — not derived from arbitrary/unverifiable content. Falls
 * back to a generic book for anything unrecognized. */
export function subjectIcon(subjectName: string): React.ReactNode {
  const match = SUBJECT_ICON_RULES.find(([re]) => re.test(subjectName));
  return match ? match[1]() : <BookIcon />;
}

/** Chapter-row icon+tone. Each glyph carries its OWN fixed tone (mostly
 * primary blue, with lightbulb/star/edit-square breaking the rhythm) rather
 * than icon and tone cycling independently — a glyph always reads the same
 * "temperature" wherever it shows up. There's no purple in the design-token
 * palette, so gray stands in for it rather than inventing a new colour.
 * Which glyph shows at a given position is still purely decorative, cycling
 * by index — there's no reliable way to categorize an arbitrary chapter
 * title. The one exception is "Pedagogy of X", an extremely common,
 * unambiguous chapter-naming convention across these teacher-eligibility
 * exams (matches the graduation cap already used for pedagogy elsewhere in
 * this app) — not a guess at arbitrary content. */
const CHAPTER_ICON_TONES: [() => React.ReactNode, (typeof TONES)[number]][] = [
  [() => <BookIcon />, TONES[0]],
  [() => <DocumentIcon />, TONES[0]],
  [() => <EditSquareIcon />, TONES[4]],
  [() => <LayersIcon />, TONES[0]],
  [() => <ChatIcon />, TONES[0]],
  [() => <LightbulbIcon />, TONES[1]],
  [() => <StarIcon />, TONES[4]],
  [() => <LinkIcon />, TONES[0]],
];

export function chapterIconAndTone(name: string, index: number) {
  if (/pedagog/i.test(name)) return { Icon: CapIcon, tone: TONES[0] };
  const [Icon, tone] = CHAPTER_ICON_TONES[index % CHAPTER_ICON_TONES.length];
  return { Icon, tone };
}
