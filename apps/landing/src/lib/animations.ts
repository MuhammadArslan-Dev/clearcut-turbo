import { Variants } from "framer-motion";

/* =========================================================
   REVEAL FACTORY (Most useful — replaces many variants)
========================================================= */

export const reveal = ({
  x = 0,
  y = 40,
  duration = 0.6,
  delay = 0,
}: {
  x?: number;
  y?: number;
  duration?: number;
  delay?: number;
} = {}): Variants => ({
  hidden: { opacity: 0, x, y },
  show: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      duration,
      delay,
      ease: "easeOut",
    },
  },
});

/* =========================================================
   BASIC PRESETS
========================================================= */

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.5 },
  },
};

export const fadeUp: Variants = reveal({ y: 40, duration: 0.4 });

export const slideLeft: Variants = reveal({ x: -60, y: 0 });
export const slideRight: Variants = reveal({ x: 60, y: 0 });

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4 },
  },
};

/* =========================================================
   STAGGER CONTAINERS
========================================================= */

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

export const stagger = (
  delayChildren = 0,
  staggerChildren = 0.12,
): Variants => ({
  hidden: {},
  show: {
    transition: {
      delayChildren,
      staggerChildren,
    },
  },
});

/* =========================================================
   INTERACTIONS (Hover / Tap)
========================================================= */

export const hoverScale = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.999 },
};

export const hoverLift = {
  whileHover: { y: -6 },
};

/* =========================================================
   MODAL / OVERLAY
========================================================= */

export const modal: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.25 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

/* =========================================================
   PAGE TRANSITIONS (Next.js)
========================================================= */

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3 },
  },
};

/* =========================================================
   VIEWPORT SETTINGS (Reusable)
========================================================= */

export const viewportOnce = {
  once: true,
  margin: "-100px",
};
