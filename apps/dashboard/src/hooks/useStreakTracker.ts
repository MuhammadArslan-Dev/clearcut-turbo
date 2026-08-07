'use client';

import { logMinutes } from '@/lib/dashboard/streak';
import { useEffect, useRef } from 'react';

type Options = {
  intervalMinutes?: number; // default = 5
};

export function useStreakTracker({ intervalMinutes = 5 }: Options = {}) {
  const lastTracked = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const intervalMs = intervalMinutes * 60 * 1000;

    const sendBatch = () => {
      const now = Date.now();
      const diff = now - lastTracked.current;

      const minutes = Math.floor(diff / 60000);

      if (minutes > 0) {
        logMinutes(minutes);
        lastTracked.current = now;
      }
    };

    // Start interval batching
    intervalRef.current = setInterval(sendBatch, intervalMs);

    // Handle tab visibility
    const handleVisibility = () => {
      if (document.hidden) {
        sendBatch(); // send remaining before pause
      } else {
        lastTracked.current = Date.now(); // reset when back
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    // Cleanup
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);

      document.removeEventListener('visibilitychange', handleVisibility);

      // Final flush on unmount
      sendBatch();
    };
  }, [intervalMinutes]);
}