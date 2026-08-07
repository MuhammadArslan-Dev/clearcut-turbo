// hooks/useLearningTimer.js
import { useEffect, useRef } from 'react';
import { logMinutes } from '../api/streak';

const FLUSH_INTERVAL = 60_000; // 1 minute
const IDLE_LIMIT = 2 * 60_000; // 2 minutes

export function useLearningTimer(enabled = true) {
  const startTimeRef = useRef(null);
  const accumulatedMsRef = useRef(0);
  const intervalRef = useRef(null);
  const idleTimeoutRef = useRef(null);

  const start = () => {
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }
  };

  const stop = () => {
    if (startTimeRef.current) {
      accumulatedMsRef.current += Date.now() - startTimeRef.current;
      startTimeRef.current = null;
    }
  };

  const flush = async () => {
    const minutes = Math.floor(accumulatedMsRef.current / 60000);

    if (minutes > 0) {
      accumulatedMsRef.current -= minutes * 60000;
      try {
        await logMinutes(minutes);
      } catch (e) {
        // swallow errors – don’t break UX
        console.error('Failed to log minutes', e);
      }
    }
  };

  const resetIdleTimer = () => {
    stop();
    start();

    clearTimeout(idleTimeoutRef.current);
    idleTimeoutRef.current = setTimeout(stop, IDLE_LIMIT);
  };

  useEffect(() => {
    if (!enabled) return;

    start();
    intervalRef.current = setInterval(flush, FLUSH_INTERVAL);

    const onVisibilityChange = () => {
      if (document.hidden) {
        stop();
        flush();
      } else {
        start();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('beforeunload', flush);
    ['mousemove', 'keydown', 'click'].forEach(e =>
      window.addEventListener(e, resetIdleTimer)
    );

    return () => {
      stop();
      flush();
      clearInterval(intervalRef.current);
      clearTimeout(idleTimeoutRef.current);

      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('beforeunload', flush);
      ['mousemove', 'keydown', 'click'].forEach(e =>
        window.removeEventListener(e, resetIdleTimer)
      );
    };
  }, [enabled]);
}
