"use client";

import { useEffect } from "react";
import { usePathname } from "@/i18n/navigation";
import { useNavLoadingStore, clearNavPending } from "@/store/navigation/useNavLoadingStore";

/**
 * Mounted once at the app root (see the locale layout). Two pieces:
 *   1. A thin top progress bar — the "always get immediate visual feedback"
 *      signal, independent of which element was clicked.
 *   2. A transparent full-viewport click-shield — swallows further clicks
 *      while a navigation is in flight, so a second click (on this or any
 *      other link) can't fire a duplicate/overlapping navigation.
 * Both are driven by useNavLoadingStore, set by the wrapped Link/useRouter
 * in i18n/navigation.ts. This effect is what actually clears that state:
 * once the pathname changes, the navigation is done.
 */
export default function NavigationProgress() {
  const isPending = useNavLoadingStore((s) => s.isPending);
  const clear = useNavLoadingStore((s) => s.clear);
  const pathname = usePathname();

  useEffect(() => {
    clear();
    clearNavPending();
  }, [pathname, clear]);

  // Safety net: a navigation that never changes the pathname (a same-path
  // router.replace, a cancelled/failed request) would otherwise leave the
  // click-shield below up forever and freeze the whole page. Same 10s
  // guard markNavPending() already applies to the clicked element.
  useEffect(() => {
    if (!isPending) return;
    const t = setTimeout(() => {
      clear();
      clearNavPending();
    }, 10000);
    return () => clearTimeout(t);
  }, [isPending, clear]);

  if (!isPending) return null;

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[9998] h-[3px] overflow-hidden bg-[var(--color-brand)]/15">
        <div className="h-full w-1/3 animate-[nav-progress_1.1s_ease-in-out_infinite] bg-[var(--color-brand)]" />
      </div>
      {/* No onClick — an inert layer just absorbing pointer events. */}
      <div className="fixed inset-0 z-[9997] cursor-wait" aria-hidden />
    </>
  );
}
