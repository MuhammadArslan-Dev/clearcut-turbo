import React, { useEffect, useId, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Overlay } from "@clearcut/ui/overlay";

type ModelProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  isHeader?: boolean;
  title?: string;
  subtitle?: string;
  maxWidth?: string;
  /** Opt-in dialog semantics and keyboard handling: role="dialog", Escape
   * closes, focus moves into the panel and stays there on Tab, and returns
   * to whatever opened it on close. Off by default so existing callers keep
   * their current behaviour. */
  accessible?: boolean;
  /** Optional element shown before the header title (needs `isHeader`). */
  headerIcon?: React.ReactNode;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function useDialogA11y(
  panelRef: React.RefObject<HTMLDivElement | null>,
  isOpen: boolean,
  onClose: () => void,
  enabled: boolean,
) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!enabled || !isOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => panelRef.current?.focus());

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const outside = !panel.contains(active) || active === panel;
      if (e.shiftKey && (active === first || outside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || outside)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
      opener?.focus?.();
    };
  }, [enabled, isOpen, panelRef]);
}

function useDialogProps(accessible: boolean, hasSubtitle: boolean) {
  const titleId = useId();
  const subtitleId = useId();
  const panelProps = accessible
    ? {
        role: "dialog" as const,
        "aria-modal": true,
        "aria-labelledby": titleId,
        "aria-describedby": hasSubtitle ? subtitleId : undefined,
        tabIndex: -1,
      }
    : {};
  return { titleId, subtitleId, panelProps };
}

/**
 * CustomModal displays a centered modal with an overlay.
 */
export function CustomModal({
  isOpen = false,
  onClose = () => {},
  children,
  isHeader = false,
  title = "",
  subtitle = "",
  maxWidth = "max-w-sm",
  accessible = false,
  headerIcon,
}: ModelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogA11y(panelRef, isOpen, onClose, accessible);
  const { titleId, subtitleId, panelProps } = useDialogProps(accessible, Boolean(subtitle));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ✅ FIX: use onClose instead of closeModal */}
          <Overlay onClick={() => onClose()} variants="tinted" />
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-[var(--z-modal)]"
            initial={{ opacity: 0, scale: 1, y: -250 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1, y: -250 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            onClick={onClose} // 🔴 Add here
          >
            <div
              ref={panelRef}
              {...panelProps}
              className={`${maxWidth} bg-white rounded-lg p-0 shadow-xl w-full max-h-[90vh] overflow-hidden outline-none`}
              onClick={(e) => e.stopPropagation()} // ✅ prevent closing when clicking inside
            >
              {/* Fixed Header */}
              {isHeader && (
                <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 pt-3 pb-2 flex justify-between items-start">
                  {/* Title & Subtitle */}
                  <div className="flex items-start gap-3">
                    {headerIcon}
                    <div>
                      <h2 id={titleId} className="text-lg font-semibold text-gray-900">
                        {title}
                      </h2>
                      <p id={subtitleId} className="text-sm text-gray-600">{subtitle}</p>
                    </div>
                  </div>

                  {/* Close Button */}
                  <button
                    type="button"
                    aria-label="Close"
                    className="text-gray-600 hover:text-gray-800 cursor-pointer"
                    onClick={onClose}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </header>
              )}

              {/* Scrollable Content */}
              <div className="overflow-y-auto no-scrollbar max-h-[80vh]">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * CustomBottomSheet displays a bottom sheet that slides up.
 */
export function CustomBottomSheet({
  isOpen = false,
  onClose = () => {},
  children,
  isHeader = false,
  title = "",
  subtitle = "",
  maxWidth = "max-w-full",
  accessible = false,
  headerIcon,
}: ModelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogA11y(panelRef, isOpen, onClose, accessible);
  const { titleId, subtitleId, panelProps } = useDialogProps(accessible, Boolean(subtitle));

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <Overlay onClick={onClose} variants="tinted" />
          <motion.div
            className={`${maxWidth} fixed left-0 right-0 bottom-0 z-[var(--z-modal)]`}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div
              ref={panelRef}
              {...panelProps}
              className="bg-white rounded-t-[12px] shadow-xl w-full max-h-[90vh] overflow-auto outline-none"
            >
              {/* Fixed Header */}
              {isHeader && (
                <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 pt-3 pb-2 flex justify-between items-start">
                  {/* Title & Subtitle */}
                  <div className="flex items-start gap-3">
                    {headerIcon}
                    <div>
                      <h2 id={titleId} className="text-lg font-semibold text-gray-900">
                        {title}
                      </h2>
                      <p id={subtitleId} className="text-sm text-gray-600">{subtitle}</p>
                    </div>
                  </div>

                  {/* Close Button */}
                  <button
                    type="button"
                    aria-label="Close"
                    className="text-gray-600 hover:text-gray-800"
                    onClick={onClose}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </header>
              )}

              <div className="overflow-y-auto no-scrollbar">{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
