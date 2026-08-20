import { defineImages } from "@clearcut/assets/image-registry";

export const IMAGES = defineImages({
  tick: {
    checked: {
      blue: "/images/tick-checked-blue.png",
      green: "/images/tick/tick-green-circle.png",
    },
    unchecked: "/images/tick-unchecked.png",
  },

  badge: {
    course: {
      green: {
        light: "/images/courseBadge/course-badge-green-light.svg",
        dark: "/images/courseBadge/course-badge-green-dark.svg",
      },
      gray: "/images/courseBadge/course-badge-gray.svg",
      blue: "/images/courseBadge/course-badge-blue.svg",
    },
  },

  logo: "/images/logo.png",
  hero: "/images/hero.jpg",
  avatar: "/images/avatar.png",
  guaranteeBadge: "/images/guarantee-badge-img.webp",
  languageIcon: "/images/language.svg",
  mainLogo: "/logos/main-logo.svg",
  heroImage: "/images/hero-img.webp",
  startIllustration: "/images/start-illustration-5.webp",
  howItWork: {
    step1: "/images/howitwork1.webp",
    step2: "/images/howitwork2.webp",
    step3: "/images/howitwork3.webp",
  },
});

export type ImageKey = keyof typeof IMAGES;

// Feature-based split
// export const AUTH_IMAGES = {};
// export const DASHBOARD_IMAGES = {};
