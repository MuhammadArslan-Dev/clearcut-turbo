export const IMAGES = {
  error: {
    404: "/images/404.png",
    500: "/images/500.png",
    nointernet: "/images/no-internet.png",
  },

} as const;

export type ImageKey = keyof typeof IMAGES;

// Feature-based split
// export const AUTH_IMAGES = {};
// export const DASHBOARD_IMAGES = {};
