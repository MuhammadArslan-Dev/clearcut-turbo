"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Overlay } from "@clearcut/ui/overlay";
import Text from "@clearcut/ui/text";
import { Button } from "@clearcut/ui/button";

/** Shared confirm/alert modal for the Syllabus Tracker — replaces native
 * window.confirm/window.alert, which block the whole tab (and, for anyone
 * testing this with browser automation, freeze it outright) and look
 * completely unstyled next to the rest of this UI. Passing only `onConfirm`
 * (no `onCancel`) renders a single-button "alert" layout; passing both
 * renders a two-button "confirm" layout. */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
          <Overlay variants="tinted" onClick={() => (onCancel ?? onConfirm)()} />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="cc-syllabus-dialog-title"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="relative z-[var(--z-modal)] w-full max-w-sm rounded-2xl bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,0.18)]"
          >
            <Text id="cc-syllabus-dialog-title" as="h2" variant="body-large" weight="semibold" color="gray-normal">
              {title}
            </Text>
            <Text as="p" variant="body-small" color="gray-muted" className="mt-1.5">
              {description}
            </Text>
            <div className="mt-5 flex justify-end gap-2">
              {onCancel && (
                <Button variant="outlined" color="gray" size="sm" onClick={onCancel}>
                  {cancelLabel}
                </Button>
              )}
              <Button variant="solid" color={danger ? "danger" : "primary"} size="sm" onClick={onConfirm}>
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
