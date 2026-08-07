"use client";

import React from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Overlay } from "./Overlay";
import { sheetVariants } from "./Variants";
import { useLockBodyScroll } from "./hook/useLockBodyScroll";
import { CrossIcon } from "@/components/ui/icons";

type BottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  headerClass?: string;
  isHeader?: boolean;
  title?: string;
  subtitle?: string;
  titleClass?: string;
  subtitleClass?: string;
  maxWidth?: string;
};

export function BottomSheet({
  isOpen,
  onClose,
  children,
  isHeader = false,
  headerClass,
  title = "",
  subtitle = "",
  titleClass = "text-lg font-semibold",
  subtitleClass = "",
  maxWidth = "max-w-full",
}: BottomSheetProps) {
  useLockBodyScroll(isOpen);

  if (!isOpen) return null;

  return (
    <>
      <Overlay onClick={onClose} />

      <motion.div
        className={clsx(
          "fixed bottom-0 left-0 right-0 z-[1000]",
          maxWidth
        )}
        variants={sheetVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.35, ease: "easeInOut" }}

        /* ✅ Swipe Down Support */
        drag="y"
        dragDirectionLock
        dragConstraints={{ top: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}

        onDragEnd={(event, info) => {
          const shouldClose =
            info.offset.y > 120 || info.velocity.y > 500;

          if (shouldClose) onClose();
        }}
      >
        <div className="bg-white rounded-t-[12px] shadow-xl w-full max-h-[90vh] overflow-hidden">

          {/* ⭐ Drag Handle */}
          <div className="flex justify-center py-2">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>

          {/* ⭐ Optional Header */}
          {isHeader && (
            <header
              className={clsx(
                "sticky top-0 z-10 bg-white border-b border-gray-200 px-6 pt-2 pb-2 flex justify-between items-start",
                headerClass
              )}
            >
              <div>
                <h2 className={clsx("text-gray-900", titleClass)}>
                  {title}
                </h2>

                {subtitle && (
                  <p
                    className={clsx(
                      "text-sm text-gray-600",
                      subtitleClass
                    )}
                  >
                    {subtitle}
                  </p>
                )}
              </div>

              <button
                className="text-gray-600 hover:text-gray-800"
                onClick={onClose}
                aria-label="Close"
              >
                <CrossIcon />
              </button>
            </header>
          )}

          {/* ⭐ Scrollable Content */}
          <div className="overflow-y-auto no-scrollbar max-h-[90vh]">
            {children}
          </div>
        </div>
      </motion.div>
    </>
  );
}