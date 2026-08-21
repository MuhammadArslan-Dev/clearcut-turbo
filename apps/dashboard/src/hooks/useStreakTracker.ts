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

      // Clamped to the backend's own `max:1440` validation rule (minutes in
      // a day). A backgrounded/suspended tab can leave `lastTracked` stale
      // for hours — JS timers don't run while suspended — so on resume this
      // would otherwise compute a huge one-off value the backend rejects
      // with a 422 (previously misreported as a 500; see StreakController).
      const minutes = Math.min(Math.floor(diff / 60000), 1440);

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