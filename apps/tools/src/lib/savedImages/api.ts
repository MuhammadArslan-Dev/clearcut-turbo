// CC-174 (phase 121): the visitor's saved photo / signature on their account, and the
// tool-lead record. Plain fetch through authedRequest (no axios / auth bundle in the
// tool's initial load). Files are fetched through the short-lived signed URL the
// backend hands out; the URL holds no ids except the image's own uuid.
import { getAttribution } from "@clearcut/auth/attribution";
import { authedRequest } from "../api/authedRequest";
import { MAIN_BACKEND_URL } from "../api/mainBackend";

export type SavedImageKind = "photo" | "signature";

export interface SavedImage {
  kind: SavedImageKind;
  mime: string;
  width: number;
  height: number;
  size_bytes: number;
  updated_at: string | null;
  /** Relative signed URL ("/api/tools/saved-images/file/…?expires=…&signature=…"), valid ~5 minutes. */
  url: string;
  url_expires_in: number;
}

/** The signed URL resolved against the backend's own origin. */
export function absoluteFileUrl(relative: string): string {
  return new URL(relative, MAIN_BACKEND_URL).toString();
}

export function listSavedImages(): Promise<SavedImage[]> {
  return authedRequest<SavedImage[]>("/tools/saved-images");
}

export function uploadSavedImage(
  kind: SavedImageKind,
  file: Blob,
  context: { tool: string; exam?: string | null },
): Promise<SavedImage & { stored: boolean }> {
  const form = new FormData();
  form.append("kind", kind);
  form.append("consent", "1");
  form.append("file", file, kind === "signature" && file.type === "image/png" ? "signature.png" : `${kind}.jpg`);
  form.append("tool", context.tool);
  if (context.exam) form.append("exam", context.exam);
  return authedRequest("/tools/saved-images", { method: "POST", body: form });
}

/** `kind` omitted = delete every saved image (CC-174 "Delete my saved photos"). Hard delete on the server. */
export function deleteSavedImages(kind?: SavedImageKind): Promise<{ deleted: number }> {
  return authedRequest(`/tools/saved-images${kind ? `/${kind}` : ""}`, { method: "DELETE" });
}

/** Downloads the saved original. Throws on an expired / missing file (the caller re-lists and retries once). */
export async function fetchSavedImageBlob(image: SavedImage): Promise<Blob> {
  const res = await fetch(absoluteFileUrl(image.url), { credentials: "omit", referrerPolicy: "no-referrer" });
  if (!res.ok) throw new Error(`Saved image request failed (${res.status})`);
  return res.blob();
}

/** CC-155: records the verified visitor as a tool lead (tool, exam, UTM, referrer host). Never throws. */
export async function recordToolLead(context: { tool: string; exam?: string | null; download: boolean }): Promise<void> {
  try {
    const a = getAttribution();
    await authedRequest("/tools/leads", {
      method: "POST",
      body: JSON.stringify({
        tool: context.tool,
        exam: context.exam ?? null,
        download: context.download,
        referrer: a?.referrer ? `https://${a.referrer}` : null,
        utm_source: a?.utm?.source ?? null,
        utm_medium: a?.utm?.medium ?? null,
        utm_campaign: a?.utm?.campaign ?? null,
        utm_content: a?.utm?.content ?? null,
        utm_term: a?.utm?.term ?? null,
      }),
    });
  } catch {
    /* a lead record must never disturb a download */
  }
}
