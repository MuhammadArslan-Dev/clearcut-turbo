/**
 * Consolidated during Phase 4 from byte-identical copies in apps/landing
 * and apps/blog.
 */

/**
 * Capitalize the first letter of a string.
 */
export function capitalizeFirst(text: string): string {
  if (!text) return "";
  return text.trim().charAt(0).toUpperCase() + text.trim().slice(1).toLowerCase();
}

/**
 * Capitalize every word (like names or titles).
 */
export function capitalizeWords(text: string): string {
  if (!text) return "";
  return text
    .trim()
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Convert text to uppercase.
 */
export function toUpper(text: string): string {
  return text?.trim().toUpperCase() || "";
}

/**
 * Convert text to lowercase.
 */
export function toLower(text: string): string {
  return text?.trim().toLowerCase() || "";
}
