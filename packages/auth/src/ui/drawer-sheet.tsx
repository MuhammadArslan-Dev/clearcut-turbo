"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Overlay } from "@clearcut/ui/overlay";
import { drawerVariants } from "./modal-variants";
import { useLockBodyScroll } from "@clearcut/hooks/use-lock-body-scroll";
import CrossIcon from "../icons/cross-icon";

type DrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  direction?: "left" | "right";
  isHeader?: boolean;
  title?: string;
  subtitle?: string;
  rounded?: string;
};

export function DrawerSheet({
  isOpen,
  onClose,
  children,
  direction = "right",
  isHeader,
  title,
  subtitle,
  rounded = "rounded-0",
}: DrawerProps) {
  useLockBodyScroll(isOpen);
  const ref = useRef<HTMLDivElement>(null);

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (!ref.current) return;

    const threshold = ref.current.offsetWidth * 0.3;

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
          ref={ref}
          className={clsx(
            "fixed top-0 z-[1000] h-full w-full max-w-full",
            direction === "right" ? "right-0" : "left-0",
          )}
          variants={drawerVariants[direction]}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{
            duration: 0.35,
            ease: "easeInOut",
          }}
          onDragEnd={handleDragEnd}
        >
          <div
            className={clsx(
              "bg-gray-100 shadow-xl h-full overflow-hidden",
              rounded,
            )}
          >
            {isHeader && (
              <header className="sticky top-0 bg-white border-b px-6 pt-3 pb-2 flex justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{title}</h2>
                  <p className="text-sm text-gray-600">{subtitle}</p>
                </div>
                <button onClick={onClose}>
                  <CrossIcon />
                </button>
              </header>
            )}

            <div className="h-full overflow-y-auto no-scrollbar">
              {children}
            </div>
          </div>
        </motion.div>
      </>
    )
  );
}
