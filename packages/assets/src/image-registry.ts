/**
 * Shared shape/convention for each app's own image-path constants — not a
 * shared source of actual paths. Next.js can only serve static files from
 * an app's own `public/` folder, so `apps/blog` and `apps/landing` each
 * keep their own real asset paths in their own `src/constants/images.ts`;
 * this package just standardizes how that file is structured, so both
 * apps' registries look and behave the same way.
 */
export type ImageRegistry = {
  [key: string]: string | ImageRegistry;
};

/**
 * Identity helper that locks an image registry to `as const` semantics
 * (deep-readonly, literal string types) without every app needing to
 * remember the `as const` incantation on its own `IMAGES` object.
 *
 * Usage (inside an app, not this package):
 *   export const IMAGES = defineImages({
 *     logo: "/logo/clear_cutoff_logo.png",
 *     error404: "/logo/404-error.svg",
 *   });
 *   export type ImageKey = keyof typeof IMAGES;
 */
export function defineImages<const T extends ImageRegistry>(images: T): T {
  return images;
}
