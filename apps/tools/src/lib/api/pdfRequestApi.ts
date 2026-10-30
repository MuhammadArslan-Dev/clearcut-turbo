// "Download Image & Get Free PDF" (phase 71): once a visitor has verified their
// number, the tool tells clearcutoff-main-backend (POST /tools/pdf-requests,
// auth:sanctum) which tool/exam/preset it came from. The number itself is the
// session user's own and is never sent from here. A separate n8n workflow
// delivers the PDF on WhatsApp later.
//
// A lead must not be lost to a flaky network: one quick retry, and if that also
// fails the request waits in localStorage and is sent the next time a Tools page
// loads while logged in (flushPendingPdfRequest).
import { getToken } from "@clearcut/auth/token";
import type { Locale } from "../dictionary";
import { authedRequest } from "./authedRequest";

export interface PdfRequestContext {
  /** resizer | image-compressor | signature-compressor | add-name-date */
  tool: string;
  /** Exam slug when the page is an exam page. */
  exam?: string | null;
  /** Document type tile (photo, signature, …). */
  preset?: string | null;
  locale: Locale;
}

const PENDING_KEY = "cc-tools-pdf-request-v1";
const RETRY_DELAY_MS = 700;

/** The backend only accepts lower-case slugs (`[a-z0-9_-]{1,64}`). */
export function toSlug(value: string | null | undefined): string | undefined {
  const slug = (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return slug || undefined;
}

function readPending(): PdfRequestContext | null {
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PdfRequestContext) : null;
  } catch {
    return null;
  }
}

function writePending(ctx: PdfRequestContext | null) {
  try {
    if (ctx) window.localStorage.setItem(PENDING_KEY, JSON.stringify(ctx));
    else window.localStorage.removeItem(PENDING_KEY);
  } catch {
    /* private mode / blocked storage: the in-memory attempt above is all we have */
  }
}

async function send(ctx: PdfRequestContext) {
  await authedRequest<{ status: string; is_new: boolean }>("/tools/pdf-requests", {
    method: "POST",
    body: JSON.stringify({
      tool: toSlug(ctx.tool) ?? "resizer",
      exam: toSlug(ctx.exam),
      preset: toSlug(ctx.preset),
      locale: ctx.locale,
    }),
  });
}

/** Resolves true when the backend has the request, false when it was queued. */
export async function recordPdfRequest(ctx: PdfRequestContext): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await send(ctx);
      writePending(null);
      return true;
    } catch {
      if (attempt === 0) await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }
  writePending(ctx);
  return false;
}

/** Sends a request that could not be delivered earlier, once logged in again. */
export function flushPendingPdfRequest(): void {
  const pending = readPending();
  if (!pending || !getToken()) return;
  void recordPdfRequest(pending);
}
