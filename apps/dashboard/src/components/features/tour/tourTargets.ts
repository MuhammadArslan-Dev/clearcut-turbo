/**
 * Product tours find their elements through `data-tour="<id>"` attributes,
 * never through CSS classes or DOM shape, so a restyle can't silently break
 * a step.
 */
export const tourSelector = (id: string) => `[data-tour="${id}"]`;

/**
 * Spread on a loading skeleton (`<div {...TOUR_LOADING}>`): a tour doesn't
 * start while one is on screen, so it can't miss steps whose content is
 * still being fetched.
 */
export const TOUR_LOADING = { "data-tour-loading": "" } as const;

export const isTourContentLoading = () =>
  Array.from(document.querySelectorAll("[data-tour-loading]")).some(isOnScreen);

/**
 * Laid out, not hidden, and horizontally inside the viewport. The mobile
 * preparation layout keeps the chapter list and the topic view both mounted
 * and slides one off-screen with a transform, so `offsetParent` alone can't
 * tell. Below the fold is fine: the tour scrolls to it.
 */
export function isOnScreen(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  if (getComputedStyle(el).visibility === "hidden") return false;
  const viewportWidth = document.documentElement.clientWidth;
  return rect.left >= -1 && rect.right <= viewportWidth + 1;
}

/**
 * The on-screen element for a tour id. Some targets render twice (a mobile
 * and a desktop copy, or a header mirrored in a footer); only one is shown.
 */
export function findTourTarget(id: string): HTMLElement | null {
  const matches = Array.from(document.querySelectorAll<HTMLElement>(tourSelector(id)));
  return matches.find(isOnScreen) ?? null;
}
