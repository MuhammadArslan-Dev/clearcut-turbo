export function formatToSlug(str: string): string {
  return str
    .trim()                          // remove spaces from both ends
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")      // remove special chars except numbers
    .replace(/\s+/g, "-");           // replace spaces with underscore
}
export function unFormatSlug(slug: string): string {
  return slug
    .replace(/_/g, " ")             // underscores → spaces
    .replace(/-/g, " ")             // underscores → spaces
    .replace(/\b\w/g, (char) => char.toUpperCase()); // capitalize words
}