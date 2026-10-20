/**
 * A question's shareable URL: its canonical chapter page plus the card's
 * existing `#q-<id>` anchor (the same place an old /question/<slug>-<id> URL
 * now 301s to). `chapterPath` is "<level>/subject/<subject>/<chapter>"; when
 * it is unknown, the page the visitor is on is used instead — it renders the
 * same card, so the anchor still lands on this question.
 */
export function questionShareUrl(opts: {
  origin: string;
  locale: string;
  exam?: string;
  chapterPath?: string;
  fallbackPath: string;
  questionId: number | string;
}): string {
  const origin = opts.origin.replace(/\/+$/, "");
  const localePrefix = opts.locale === "hi" ? "/hi" : "";
  const path = opts.exam && opts.chapterPath ? `${localePrefix}/${opts.exam}/${opts.chapterPath}` : opts.fallbackPath;
  return `${origin}${path}#q-${opts.questionId}`;
}

export function whatsAppShareUrl(message: string, url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${message}\n${url}`)}`;
}
