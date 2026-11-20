"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Button } from "@clearcut/ui/button";
import { apiFetch } from "@/lib/api/client";
import { trackEvent } from "@/lib/analytics/browser";

/** CC-174: the photo / signature a learner saved from the Tools image resizer. */
interface SavedToolImage {
  kind: "photo" | "signature";
  updated_at: string | null;
}

export const SAVED_TOOL_IMAGES_KEY = ["tools-saved-images"] as const;

/**
 * Profile → "Saved tool photos": shown only when the learner has saved something. One button
 * hard-deletes every saved image (file + row) through the same endpoint the tool page uses.
 */
export default function SavedToolPhotos() {
  const t = useTranslations("profile.savedToolPhotos");
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: SAVED_TOOL_IMAGES_KEY,
    queryFn: async () => (await apiFetch<{ data: SavedToolImage[] }>("/tools/saved-images")).data ?? [],
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  if (message && (!data || data.length === 0)) {
    return (
      <p role="status" className="mt-4 body-small text-surface-gray-muted p-1 md:px-5">
        {message}
      </p>
    );
  }
  if (!data || data.length === 0) return null;

  const kinds = data.map((i) => (i.kind === "photo" ? t("photo") : t("signature"))).join(" + ");

  const remove = async () => {
    setDeleting(true);
    setMessage(null);
    try {
      await apiFetch("/tools/saved-images", { method: "DELETE" });
      void trackEvent("Saved Images Deleted", { place: "dashboard_profile" });
      queryClient.setQueryData(SAVED_TOOL_IMAGES_KEY, []);
      setMessage(t("deleted"));
      setConfirming(false);
    } catch {
      setMessage(t("deleteFailed"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mt-4 w-full rounded-lg md:bg-white p-1 md:p-5" data-testid="saved-tool-photos">
      <p className="heading-small !font-semibold text-surface-gray-normal">{t("title")}</p>
      <p className="mt-1 body-small text-surface-gray-muted">{t("subtitle", { kinds })}</p>

      {confirming ? (
        <div className="mt-3 flex flex-col gap-2">
          <p className="body-small text-surface-gray-normal">{t("confirm")}</p>
          <div className="flex gap-2">
            <Button size="sm" color="danger" variant="outlined" sx={{ borderRadius: "50px" }} loading={deleting} disabled={deleting} onClick={remove}>
              {t("yes")}
            </Button>
            <Button size="sm" color="neutral" variant="outlined" sx={{ borderRadius: "50px" }} disabled={deleting} onClick={() => setConfirming(false)}>
              {t("no")}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          className="mt-3"
          size="sm"
          color="danger"
          variant="outlined"
          sx={{ borderRadius: "50px" }}
          startDecorator={<Trash2 size={16} />}
          onClick={() => setConfirming(true)}
        >
          {t("delete")}
        </Button>
      )}
      {message && (
        <p role="status" className="mt-2 body-small text-surface-gray-muted">
          {message}
        </p>
      )}
    </div>
  );
}
