"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  return (
    isOpen && (
      <>
        <Overlay onClick={onClose} />

        <motion.div
          className={clsx("fixed bottom-0 left-0 right-0 z-[1000]", maxWidth)}
          variants={sheetVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.35, ease: "easeInOut" }}
        >
          <div className="bg-white rounded-t-[12px] shadow-xl w-full max-h-[90vh] overflow-hidden">
            {isHeader && (
              <header
                className={clsx(
                  "sticky top-0 z-10 bg-white border-b border-gray-200 px-6 pt-3 pb-2 flex justify-between items-start",
                  headerClass,
                )}
              >
                <div>
                  <h2 className={clsx("text-gray-900", titleClass)}>{title}</h2>
                  <p className={clsx("text-sm text-gray-600", subtitleClass)}>
                    {subtitle}
                  </p>
                </div>

                <button
                  className="text-gray-600 hover:text-gray-800"
                  onClick={onClose}
                >
                  <CrossIcon />
                </button>
              </header>
            )}

            <div className="overflow-y-auto no-scrollbar max-h-[90vh]">
              {children}
            </div>
          </div>
        </motion.div>
      </>
    )
  );
}
