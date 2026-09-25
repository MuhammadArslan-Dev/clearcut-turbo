'use client';

import { logMinutes } from '@/lib/dashboard/streak';
import { isApiError } from '@/lib/api/api-error';
import { logger } from '@/lib/sentry/sentry-logger';
import { useEffect, useRef } from 'react';

type Options = {
  intervalMinutes?: number; // default = 5
};

export function useStreakTracker({ intervalMinutes = 5 }: Options = {}) {
  const lastTracked = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const intervalMs = intervalMinutes * 60 * 1000;

    const sendBatch = (keepalive = false) => {
      const now = Date.now();
      const diff = now - lastTracked.current;

      // Clamped to the backend's own `max:1440` validation rule (minutes in
      // a day). A backgrounded/suspended tab can leave `lastTracked` stale
      // for hours — JS timers don't run while suspended — so on resume this
      // would otherwise compute a huge one-off value the backend rejects
      // with a 422 (previously misreported as a 500; see StreakController).
      const minutes = Math.min(Math.floor(diff / 60000), 1440);

      if (minutes > 0) {
        lastTracked.current = now;
        logMinutes(minutes, { keepalive }).catch((err) => {
          // Fire-and-forget, so nothing else was handling this rejection —
          // it surfaced as an unhandled "API unreachable" on every offline
          // blip / navigation. A network failure just means these minutes
          // weren't delivered: hand them back so the next flush (if the
          // tracker is still mounted) sends them, instead of reporting an
          // error for something nobody can act on. Any real API failure
          // (4xx/5xx) is still reported.
          if (isApiError(err) && err.isNetworkError) {
            lastTracked.current -= minutes * 60000;
            return;
          }
          logger.error(err, { tags: { module: 'streak-tracker', endpoint: '/streak/log-minutes' } });
        });
      }
    };

    // Start interval batching
    intervalRef.current = setInterval(() => sendBatch(), intervalMs);

    // Handle tab visibility
    const handleVisibility = () => {
      if (document.hidden) {
        sendBatch(true); // send remaining before pause
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
      sendBatch(true);
    };
  }, [intervalMinutes]);
}