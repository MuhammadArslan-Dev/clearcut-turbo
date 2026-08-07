"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { Overlay } from "./Overlay";
import { modalVariants } from "./Variants";
import { CrossIcon } from "@/components/ui/icons";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  isHeader?: boolean;
  title?: string;
  subtitle?: string;
  titleClass?: string;
  subtitleClass?: string;
  maxWidth?: string;
  maxHeight?: string;
};

export function Modal({
  isOpen,
  onClose,
  children,
  isHeader,
  title,
  subtitle,
  titleClass = "text-lg font-semibold",
  subtitleClass = "",
  maxWidth = "max-w-sm",
  maxHeight = "max-h-[90vh]",
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  return (
    isOpen && (
      <>
        <motion.div
          key="modal-root"
          className="fixed inset-0 z-[1000] flex items-center justify-center"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          <Overlay variants="modal" onClick={onClose} />

          <motion.div
            className={`${maxWidth} bg-white rounded-lg shadow-xl w-full ${maxHeight} overflow-hidden relative`}
            onClick={(e) => e.stopPropagation()}
          >
            {isHeader && (
              <header className="sticky top-0 z-10 bg-white border-b px-6 pt-3 pb-2 flex justify-between">
                <div>
                  <h2 className={clsx("text-gray-900", titleClass)}>{title}</h2>
                  <p className={clsx("text-sm text-gray-600", subtitleClass)}>
                    {subtitle}
                  </p>
                </div>
                <button onClick={onClose}>
                  <CrossIcon />
                </button>
              </header>
            )}

            <div className="overflow-y-auto no-scrollbar">{children}</div>
          </motion.div>
        </motion.div>
      </>
    )
  );
}
