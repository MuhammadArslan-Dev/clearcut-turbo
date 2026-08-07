import { Variants } from "framer-motion"

export const EASE = [0.22, 1, 0.36, 1] as const

export const viewport = {
  once: true,
  margin: "-120px",
}

/* SECTION CONTAINER */

export const storySection: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.18,
      delayChildren: 0.1,
    },
  },
}

/* HEADLINE */

export const storyHeadline: Variants = {
  hidden: { opacity: 0, y: 60 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: EASE },
  },
}

/* TEXT */

export const storyText: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE },
  },
}

/* IMAGE / VISUAL */

export const storyVisual: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
    filter: "blur(8px)",
  },
  show: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: EASE },
  },
}

/* CARDS */

export const storyCard: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: EASE },
  },
}