"use client";

import { useEffect } from "react";

/**
 * A link like /tools/resizer/ctet#photo-too-large scrolls to that row but a
 * <details> stays closed on its own. This opens the <details> whose id is
 * the URL hash, on load and on later hash changes (CC-159). Renders nothing.
 */
export default function OpenDetailsOnHash() {
  useEffect(() => {
    const open = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const el = document.getElementById(id);
      if (el instanceof HTMLDetailsElement) el.open = true;
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);
  return null;
}
