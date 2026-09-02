"use client";

import { motion } from "framer-motion";

// Shared entrance-animation primitives — every animated section in this app
// (hero headers, card grids) goes through these two instead of each file
// hand-rolling its own framer-motion variants, so the feel (timing, easing)
// stays consistent and a single tweak here updates everywhere.

/** Fades + slides a block in once, on mount. Use for hero/heading blocks. */
export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

/**
 * Wraps a grid of cards so its children reveal one-by-one as the grid
 * scrolls into view (`whileInView`, `once: true`) rather than all at once on
 * mount — the right choice here because exam/category grids run long enough
 * to still be off-screen when the page loads.
 */
export function StaggerGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children }: { children: React.ReactNode }) {
  return <motion.div variants={staggerItem}>{children}</motion.div>;
}
