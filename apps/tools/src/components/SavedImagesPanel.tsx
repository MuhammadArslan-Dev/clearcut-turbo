"use client";

import { useState } from "react";
import Button from "@clearcut/ui/button";
import Text from "@clearcut/ui/text";
import type { getDict } from "@/lib/dictionary";
import { absoluteFileUrl, type SavedImage } from "@/lib/savedImages/api";

type Copy = ReturnType<typeof getDict>["tool"]["savedImages"];

/**
 * CC-174: "Your saved photo / signature" on the upload step for a signed-in visitor who saved one.
 * One-click download for this exam, upload a new one, or delete everything (hard delete).
 * Presentational: the tool passes the actions. Loaded lazily, only for signed-in visitors.
 */
export default function SavedImagesPanel({
  copy,
  image,
  busy,
  error,
  onUseSaved,
  onUploadNew,
  onDeleteAll,
}: {
  copy: Copy;
  image: SavedImage;
  busy: boolean;
  error: string | null;
  onUseSaved: () => void;
  onUploadNew: () => void;
  onDeleteAll: () => Promise<boolean>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const label = image.kind === "photo" ? copy.photo : copy.signature;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border-gray-subtle)] bg-[var(--color-gray-bg-soft)] p-3" data-testid="saved-images-panel">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={absoluteFileUrl(image.url)}
          alt={label}
          referrerPolicy="no-referrer"
          className="h-16 w-16 shrink-0 rounded-lg border border-[var(--color-border-gray-subtle)] bg-white object-contain"
        />
        <div className="min-w-0">
          <Text as="p" variant="body-medium" weight="semibold" color="gray-normal">
            {copy.panelTitle}
          </Text>
          <Text as="p" variant="body-small" color="gray-muted">
            {copy.panelSubtitle}
          </Text>
        </div>
      </div>

      <Button fullWidth sx={{ borderRadius: "50px" }} onClick={onUseSaved} loading={busy} disabled={busy || deleting}>
        {busy ? copy.working : `${copy.useSaved} (${label})`}
      </Button>
      {error && (
        <p role="alert" className="body-small text-center text-red-600">
          {error}
        </p>
      )}

      {confirming ? (
        <div className="flex flex-col gap-2 rounded-lg border border-[var(--color-border-gray-subtle)] bg-white p-3">
          <Text as="p" variant="body-small" color="gray-normal">
            {copy.deleteConfirm}
          </Text>
          <div className="flex gap-2">
            <Button
              variant="outlined"
              color="danger"
              fullWidth
              sx={{ borderRadius: "50px" }}
              loading={deleting}
              disabled={deleting}
              onClick={async () => {
                setDeleting(true);
                const ok = await onDeleteAll();
                setDeleting(false);
                if (ok) setConfirming(false);
              }}
            >
              {copy.deleteYes}
            </Button>
            <Button variant="outlined" color="gray" fullWidth sx={{ borderRadius: "50px" }} disabled={deleting} onClick={() => setConfirming(false)}>
              {copy.deleteNo}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={onUploadNew} disabled={busy} className="body-small !font-semibold text-brand py-2">
            {copy.uploadNew}
          </button>
          <button type="button" onClick={() => setConfirming(true)} disabled={busy} className="body-small text-text-gray-muted underline py-2">
            {copy.deleteAll}
          </button>
        </div>
      )}
    </div>
  );
}
