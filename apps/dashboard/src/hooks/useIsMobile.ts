// src/hooks/useIsMobile.ts
'use client';

import {useEffect, useState} from 'react';

/**
 * Returns true when viewport width is below the given breakpoint.
 * Default: < 768px (roughly Tailwind's `md`).
 */
export function useIsMobile(maxWidth = 768) {
  const [isMobile, setIsMobile] = useState(false);

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