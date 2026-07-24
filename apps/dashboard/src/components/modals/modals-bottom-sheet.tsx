"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { CrossIcon } from "../ui/icons";

type OverlayProps = {
  onClick: () => void;
};

// Shared animation configs
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 0.5 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const sheetVariants = {
  hidden: { y: "100%" },
  visible: { y: 0 },
  exit: { y: "100%" },
};
const drawerVariantsLeft = {
  hidden: { x: "-100%" },
  visible: { x: 0 },
  exit: { x: "-100%" },
};
const drawerVariantsRight = {
  hidden: { x: "100%" },
  visible: { x: 0 },
  exit: { x: "100%" },
};

const overlayTransition = { duration: 0.2, ease: "easeInOut" };
const modalTransition = { duration: 0.25, ease: "easeInOut" };
const sheetTransition = { duration: 0.25, ease: "easeInOut" };

// Reusable overlay that fades in/out
const Overlay = ({ onClick }: OverlayProps) => (
  <motion.div
    className="fixed inset-0 bg-black bg-opacity-60 z-[999]"
    onClick={onClick}
    variants={overlayVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
    transition={{ duration: 0.2, ease: "easeInOut" }}
  />
);

type ModelProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  isHeader?: boolean;
  title?: string;
  titleClass?: string;
  subtitle?: string;
  subtitleClass?: string;
  maxWidth?: string;
  maxHeight?: string;
  rounded?: string;
  direction?: "left" | "right";
};

/**
 * Centered modal (desktop)
 */
export function CustomModal({
  isOpen = false,
  onClose = () => {},
  children,
  isHeader = false,
  title = "",
  titleClass = "text-lg font-semibold",
  subtitle = "",
  subtitleClass = "",
  maxWidth = "max-w-sm",
  maxHeight = "max-h-[90vh]",
}: ModelProps) {
  // useEffect(() => {
  //   const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
  //   window.addEventListener("keydown", handler);
  //   return () => window.removeEventListener("keydown", handler);
  // }, []);

  return (
    isOpen && (
      <motion.div
        key="modal-root"
        className="fixed inset-0 z-[1000] flex items-center justify-center"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        {/* Overlay */}
        <motion.div
          className="absolute inset-0 bg-black/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className={`${maxWidth} bg-white rounded-lg shadow-xl w-full ${maxHeight} overflow-hidden relative`}
          onClick={(e) => e.stopPropagation()}
        >
          {isHeader && (
            <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 pt-3 pb-2 flex justify-between items-start">
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

          <div className={`overflow-y-auto no-scrollbar ${maxHeight}`}>
            {children}
          </div>
        </motion.div>
      </motion.div>
    )
  );
}

/**
 * Bottom sheet (mobile)
 */
export function CustomBottomSheet({
  isOpen = false,
  onClose = () => {},
  children,
  isHeader = false,
  title = "",
  titleClass = "text-lg font-semibold",
  subtitle = "",
  subtitleClass = "",
  maxWidth = "max-w-full",
}: ModelProps) {
  // Lock body scroll while sheet is open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  return (
    isOpen && (
      <>
        <Overlay onClick={onClose} />
        <motion.div
          className={`max-w-full fixed left-0 right-0 bottom-0 z-[1000]`}
          variants={sheetVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.35, ease: "easeInOut" }}
        >
          <div className="bg-white rounded-t-[12px] shadow-xl w-full max-h-[90vh] overflow-auto">
            {isHeader && (
              <header className="sticky rounded-t-[12px] top-0 z-10 bg-white border-b border-gray-200 px-6 pt-3 pb-2 flex justify-between items-start">
                <div>
                  <h2 className={clsx(" text-gray-900", titleClass)}>
                    {title}
                  </h2>
                  <p className={clsx("text-sm text-gray-600", subtitleClass)}>
                    {subtitle}
                  </p>
                </div>
                <button
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
    )
  );
}
/**
 * Drawer sheet (mobile)
 */
export function DrawerSheet({
  isOpen = false,
  onClose = () => {},
  children,
  isHeader = false,
  title = "",
  titleClass = "text-lg font-semibold",
  subtitle = "",
  subtitleClass = "",
  maxWidth = "max-w-full",
  rounded = "rounded-0",
  direction = "right",
}: ModelProps) {
  // Lock body scroll while sheet is open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  const drawerRef = useRef<HTMLDivElement>(null);

  // Lock body scroll while sheet is open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
    if (!drawerRef.current) return;

    const drawerWidth = drawerRef.current.offsetWidth;
    const threshold = drawerWidth * 0.3;

    if (
      (direction === "right" && info.offset.x > threshold) ||
      (direction === "left" && info.offset.x < -threshold)
    ) {
      onClose();
    }
  };

  return (
    isOpen && (
      <>
        <Overlay onClick={onClose} />
        <motion.div
          ref={drawerRef}
          className={`${maxWidth} w-full fixed top-0 z-[1000] ${
            direction === "right" ? "right-0" : "left-0"
          }`}
          variants={
            direction === "left" ? drawerVariantsLeft : drawerVariantsRight
          }
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.35, ease: "easeInOut" }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={handleDragEnd}
        >
          <div
            className={clsx(
              "bg-gray-100 shadow-xl w-full h-[100vh] overflow-auto",
              rounded
            )}
          >
            {isHeader && (
              <header className="sticky rounded-t-[12px] top-0 z-10 bg-white border-b border-gray-200 px-6 pt-3 pb-2 flex justify-between items-start">
                <div>
                  <h2 className={clsx(" text-gray-900", titleClass)}>
                    {title}
                  </h2>
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

            <div className="overflow-y-auto h-full no-scrollbar">
              {children}
            </div>
          </div>
        </motion.div>
      </>
    )
  );
}
