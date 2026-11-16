/**
 * Decides how a question's MCQ options are laid out, from the length of their text.
 * Pure (no React), so the dashboard and the blog share one rule.
 *
 *  - "single":  at least one option is long -> ONE column at every width. A long option next to a short one
 *               leaves a ragged half-empty row, and the full width reads better.
 *  - "compact": every option is very short (a number, a word) -> 2 columns at every width, A B / C D.
 *  - "split":   everything in between -> 1 column on narrow screens, 2 columns from the caller's
 *               breakpoint up. This is what every screen did before this rule existed.
 *
 * The rule looks at the whole set of options, never at one option, so the four cards of a question always
 * share the same layout. Text is measured on the visible characters (markdown, HTML tags and LaTeX
 * delimiters are stripped); a line break always counts as long.
 */

export type OptionLike =
  | string
  | { text?: string | null; image?: string | null; img?: string | null }
  | null
  | undefined;

export type OptionsLayout = "single" | "compact" | "split";

/** More visible characters than this in any option -> single column. */
export const LONG_OPTION_CHARS = 28;
/** At most this many characters in every option (and no image) -> 2 columns even on a phone. */
export const COMPACT_OPTION_CHARS = 8;

const TAGS = /<[^>]*>/g;
const MARKUP = /[*_`$#>]|\\[()[\]]/g;

/** Visible length of an option's text (markdown / HTML / LaTeX delimiters removed). */
export function visibleTextLength(text: string): number {
  const plain = text.replace(TAGS, "").replace(MARKUP, "").replace(/\s+/g, " ").trim();
  return Array.from(plain).length;
}

function parts(option: OptionLike): { text: string; hasImage: boolean } {
  if (option == null) return { text: "", hasImage: false };
  if (typeof option === "string") return { text: option, hasImage: false };
  return { text: option.text ?? "", hasImage: Boolean(option.image || option.img) };
}

export function optionsLayout(options: readonly OptionLike[]): OptionsLayout {
  let longest = 0;
  let hasImage = false;
  let anyText = false;

  for (const option of options) {
    const { text, hasImage: withImage } = parts(option);
    if (withImage) hasImage = true;
    if (!text.trim()) continue;
    anyText = true;
    // A line break inside an option is a list / multi-line answer: always a full-width card.
    if (/\r|\n/.test(text.trim())) return "single";
    longest = Math.max(longest, visibleTextLength(text));
  }

  if (longest > LONG_OPTION_CHARS) return "single";
  if (anyText && !hasImage && longest <= COMPACT_OPTION_CHARS) return "compact";
  return "split";
}
