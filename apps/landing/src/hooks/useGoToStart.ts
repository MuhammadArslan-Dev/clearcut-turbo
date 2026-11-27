"use client";

import { useCallback } from "react";
import { useRouter } from "@/i18n/navigation";

export type GoToStartOptions = {
  /** Which exam/course the page represents (e.g. "htet") — /start reads `?course=`. */
  course?: string;
  /** Attribution for the 'Authentication Initiated' event, which /start fires itself from these params. */
  element_location?: string;
  element_type?: string;
};

/**
 * Every landing CTA that used to open the login modal now sends the visitor to
 * /start (locale-aware: /start, /hi/start, /mr/start — the next-intl router adds
 * the prefix). /start fires 'Authentication Initiated' from `element_location` /
 * `element_type`, so the click is attributed exactly as before, without a
 * second event. utm_* params already on the URL are carried along.
 */
export default function useGoToStart() {
  const router = useRouter();

  return useCallback(
    ({ course, element_location, element_type }: GoToStartOptions = {}) => {
      const params = new URLSearchParams();
      if (typeof window !== "undefined") {
        new URLSearchParams(window.location.search).forEach((value, key) => {
          if (key.startsWith("utm_")) params.set(key, value);
        });
      }
      if (course) params.set("course", course);
      if (element_location) params.set("element_location", element_location);
      if (element_type) params.set("element_type", element_type);
      const qs = params.toString();
      router.push(qs ? `/start?${qs}` : "/start");
    },
    [router],
  );
}
