import removeMd from "remove-markdown";

/** Question/explanation markdown or HTML as a single line of plain text. */
export function toPlainText(markdownOrHtml: string): string {
  return removeMd(markdownOrHtml.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}
