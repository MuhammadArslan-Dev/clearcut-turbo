/**
 * Below-the-fold section wrapper. Renders the section right away — on the
 * server too — inside the same plain wrapper div as before.
 *
 * It used to mount the section only once an IntersectionObserver saw it
 * (rendering an empty `fallbackHeight` box until then): the server HTML had
 * no content for these sections at all, `#pricing`-style anchors landed on
 * boxes whose height changed under them, and the box → real-height swap
 * shifted the page. `content-visibility: auto` was tried instead and dropped:
 * its paint containment clips shadows that reach past the section box (the
 * pricing card and the "How it works" step circles at 390px).
 *
 * `fallbackHeight` is kept so existing callers don't change; it is unused.
 */
export default function LazySection({
  children,
}: {
  children: React.ReactNode;
  fallbackHeight?: string;
}) {
  return <div>{children}</div>;
}
