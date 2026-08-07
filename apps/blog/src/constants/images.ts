import { defineImages } from "@clearcut/assets/image-registry";

export const IMAGES = defineImages({
  logo: "/logo/clear_cutoff_logo.png",
  error404: "/logo/404-error.svg",
});

export type ImageKey = keyof typeof IMAGES;
