import { apiFetch } from "@/lib/api/client";
import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  examId: string;
  initialRemaining: number;
  onExpire?: () => void;
}

export default function useExamTimer({ examId, initialRemaining, onExpire }: Props) {
  const [remaining, setRemaining] = useState(initialRemaining);

  const intervalRef   = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef  = useRef<NodeJS.Timeout | null>(null);
  const hasSyncedRef  = useRef(false);
  const hasExpiredRef = useRef(false);
  const onExpireRef   = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const triggerExpire = useCallback(() => {
    if (hasExpiredRef.current) return;
    hasExpiredRef.current = true;
    if (intervalRef.current)  clearInterval(intervalRef.current);
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    setRemaining(0);
    onExpireRef.current?.();
  }, []);

  const doHeartbeat = useCallback(async () => {
    try {
      const data: any = await apiFetch(
        `/v2/exam/attempt/${examId}/heartbeat`,
        { method: "POST" }
      );

      if (!data) return;

      hasSyncedRef.current = true;

      if (data.status === "expired" || data.remaining_seconds === 0) {
        triggerExpire();
        return;
      }

      setRemaining((prev) => {
        const drift = Math.abs(prev - data.remaining_seconds);
        return drift > 3 ? data.remaining_seconds : prev;
      });
    } catch (error) {
      console.error("Heartbeat failed:", error);
    }
  }, [examId, triggerExpire]);

  useEffect(() => {
    doHeartbeat();
    heartbeatRef.current = setInterval(doHeartbeat, 60_000);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [doHeartbeat]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (remaining === 0 && hasSyncedRef.current) {
      triggerExpire();
    }
  }, [remaining, triggerExpire]);

  return remaining;
}
