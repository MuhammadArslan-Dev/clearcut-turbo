// src/hooks/useIsMobile.ts
'use client';

import {useEffect, useState} from 'react';

/**
 * Returns true when viewport width is below the given breakpoint.
 * Default: < 768px (roughly Tailwind's `md`).
 */
export function useIsMobile(maxWidth = 768) {
  // Lazy-initialize from matchMedia instead of defaulting to `false` and
  // correcting in an effect. Every consumer of this hook lives inside a
  // route gated by ProtectedPage, which SSRs (and first hydrates) a
  // FullScreenLoader — these components only ever mount fresh on the client
  // once ProtectedPage swaps in real children post-hydration, so there is no
  // server-rendered markup to mismatch against. Computing the real value up
  // front avoids the false->true flip that was re-mounting entire
  // mobile/desktop layout branches (e.g. PreparationShell) after first
  // paint, which showed up as large Cumulative Layout Shift in the field.
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false; // SSR guard
    return window.matchMedia(`(max-width: ${maxWidth - 1}px)`).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return; // SSR guard

    const query = `(max-width: ${maxWidth - 1}px)`;
    const media = window.matchMedia(query);

    const handleChange = () => {
      setIsMobile(media.matches);
    };

    // Initial value
    handleChange();

    // Subscribe to changes
    if (media.addEventListener) {
      media.addEventListener('change', handleChange);
      return () => media.removeEventListener('change', handleChange);
    } else {
      // Older Safari
      media.addListener(handleChange);
      return () => media.removeListener(handleChange);
    }
  }, [maxWidth]);

  return isMobile;
}