"use client";

// CC-174: the signed-in visitor's saved photo / signature. Loads only when there is a session
// (an anonymous visitor makes no request at all), and again after login / logout.
import { useCallback, useEffect, useRef, useState } from "react";
import { useHasSession } from "../toolsSession";
import { SessionExpiredError } from "../api/authedRequest";
import {
  deleteSavedImages,
  fetchSavedImageBlob,
  listSavedImages,
  uploadSavedImage,
  type SavedImage,
  type SavedImageKind,
} from "./api";
import { prepareOriginal } from "./prepareOriginal";

export type SaveStatus = "idle" | "saving" | "saved" | "failed";

export function useSavedImages(context: { tool: string; exam?: string | null }) {
  const hasSession = useHasSession();
  const [items, setItems] = useState<SavedImage[] | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const listRequest = useRef(0);

  const refresh = useCallback(async (): Promise<SavedImage[]> => {
    const id = ++listRequest.current;
    try {
      const list = await listSavedImages();
      if (id === listRequest.current) setItems(list);
      return list;
    } catch (err) {
      if (id === listRequest.current) setItems(err instanceof SessionExpiredError ? null : []);
      return [];
    }
  }, []);

  useEffect(() => {
    if (!hasSession) {
      listRequest.current++;
      setItems(null);
      return;
    }
    void refresh();
  }, [hasSession, refresh]);

  const find = useCallback((kind: SavedImageKind) => items?.find((i) => i.kind === kind) ?? null, [items]);

  /** The saved original as a File. A signed URL older than ~5 minutes is refreshed once. */
  const loadOriginal = useCallback(
    async (kind: SavedImageKind): Promise<File> => {
      let image = find(kind);
      if (!image) throw new Error("No saved image");
      let blob: Blob;
      try {
        blob = await fetchSavedImageBlob(image);
      } catch {
        image = (await refresh()).find((i) => i.kind === kind) ?? null;
        if (!image) throw new Error("No saved image");
        blob = await fetchSavedImageBlob(image);
      }
      const ext = blob.type === "image/png" ? "png" : "jpg";
      return new File([blob], `${kind}.${ext}`, { type: blob.type || "image/jpeg" });
    },
    [find, refresh],
  );

  /**
   * Stores the original (only ever called after OTP + consent, or for an account that already
   * consented). One retry on a network failure; a 4xx is not retried. Never throws.
   */
  const save = useCallback(
    async (kind: SavedImageKind, original: Blob): Promise<boolean> => {
      setSaveStatus("saving");
      let prepared: Blob;
      try {
        prepared = await prepareOriginal(original, kind);
      } catch {
        setSaveStatus("failed");
        return false;
      }
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          await uploadSavedImage(kind, prepared, context);
          setSaveStatus("saved");
          await refresh();
          return true;
        } catch (err) {
          const retryable = !(err instanceof SessionExpiredError) && !/\(4\d\d\)/.test(String((err as Error)?.message));
          if (!retryable || attempt === 1) break;
          await new Promise((r) => setTimeout(r, 800));
        }
      }
      setSaveStatus("failed");
      return false;
    },
    [context, refresh],
  );

  const removeAll = useCallback(async (): Promise<boolean> => {
    try {
      await deleteSavedImages();
      setItems([]);
      return true;
    } catch {
      return false;
    }
  }, []);

  return { hasSession, items, find, loadOriginal, save, saveStatus, removeAll, refresh };
}
