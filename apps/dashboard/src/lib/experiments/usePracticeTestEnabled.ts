"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { isPracticeTestEnabled } from "./practiceTestFlag";

/**
 * `"loading"` until the flag is known, then `true` / `false` (phase 72). `false`
 * also covers "no logged-in user" and every failure, so callers only ever have
 * to handle: wait, show the practice test, or go to Preparation.
 */
export function usePracticeTestEnabled(): "loading" | boolean {
  const { user, loading } = useAuth();
  const uuid = user?.uuid ?? null;
  const [answer, setAnswer] = useState<{ uuid: string | null; enabled: boolean } | null>(null);

  useEffect(() => {
    if (loading) return;
    let active = true;
    void isPracticeTestEnabled(uuid).then((enabled) => {
      if (active) setAnswer({ uuid, enabled });
    });
    return () => {
      active = false;
    };
  }, [uuid, loading]);

  if (loading || answer === null || answer.uuid !== uuid) return "loading";
  return answer.enabled;
}
