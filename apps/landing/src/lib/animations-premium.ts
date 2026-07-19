import { Variants } from "framer-motion"

/* =========================================================
   GLOBAL SETTINGS
========================================================= */

export const EASE = [0.22, 1, 0.36, 1] as const // premium cubic-bezier

export const viewport = {
  once: true,
  margin: "-20px",
}

/* =========================================================
   HERO ANIMATIONS (Smooth + Expensive Feel)
========================================================= */

export const heroContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.18,
      delayChildren: 0.2,
    },
  },
}

export const heroItem: Variants = {
  hidden: { opacity: 0, y: 60 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.9,
      ease: EASE,
    },
  },
}

/* =========================================================
   PREMIUM REVEAL FACTORY
========================================================= */

export const revealPremium = ({
  x = 0,
  y = 60,
  duration = 0.8,
  delay = 0,
}: {
  x?: number
  y?: number
  duration?: number
  delay?: number
} = {}): Variants => ({
  hidden: {
    opacity: 0,
    x,
    y,
    filter: "blur(2px)",
  },
  show: {
    opacity: 1,
    x: 0,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration,
      delay,
      ease: EASE,
    },
  },
})

/* =========================================================
   STAGGER SECTIONS
========================================================= */

export const sectionStagger: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.1,
    },
  },
}

/* =========================================================
   CARD ANIMATIONS (Subtle Elevation)
========================================================= */

export const cardReveal: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: EASE,
    },
  },
}

/* =========================================================
   INTERACTIONS
========================================================= */

export const hoverCard = {
  whileHover: {
    y: -8,
    scale: 1.02,
    transition: { duration: 0.25, ease: EASE },
  },
}

export const hoverButton = {
  whileHover: {
    scale: 1.05,
  },
  whileTap: {
    scale: 0.96,
  },
}

/* =========================================================
   NAVBAR ANIMATION
========================================================= */

export const navItem: Variants = {
  hidden: { opacity: 0, y: -12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE },
  },
}

/* =========================================================
   MODAL / POPUP
========================================================= */

export const modalPremium: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 20 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASE },
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    y: 20,
    transition: { duration: 0.2 },
  },
}

/* =========================================================
   PAGE TRANSITION
========================================================= */

export const pageTransitionPremium: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.35 },
  },
}