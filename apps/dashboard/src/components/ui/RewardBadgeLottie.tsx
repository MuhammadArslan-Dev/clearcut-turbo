"use client";

import { useEffect, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { loadLottieAsset } from "@/lib/lottie/loadLottieAsset";

const REWARD_LOTTIE_SRC = "/lotifiles/current-chapter.lottie";

/**
 * The free-trial "reward nudge" badge, rendered once per unlocked row in a
 * list (every topic in Sidebar.tsx, every test card in TestCard.tsx). Each
 * `<DotLottieReact src=... />` used to fetch the same tiny .lottie file over
 * the network independently — with dozens of unlocked rows on a single
 * preparation/test-series page, that meant dozens of concurrent requests for
 * one identical asset, queued behind the browser's per-host connection limit
 * and each competing for the same main thread to parse (Sentry traces showed
 * this as a 34-request "Autogrouped http.client" cluster with durations
 * climbing past 2s each, dominating the whole page navigation). Fetching
 * once through `loadLottieAsset` and handing every instance the decoded
 * bytes via `data` (instead of `src`) collapses that back to one request no
 * matter how many rows render.
 */
export default function RewardBadgeLottie({ size }: { size: number }) {
  const [data, setData] = useState<ArrayBuffer | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadLottieAsset(REWARD_LOTTIE_SRC).then((buffer) => {
      if (!cancelled) setData(buffer);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) return null;

  return (
    <DotLottieReact
      style={{ width: size, height: size }}
      // Slice so each player gets its own ArrayBuffer, not the same shared
      // instance — cheap for a file this size, and avoids relying on the
      // parser never mutating/detaching a buffer it doesn't own.
      data={data.slice(0)}
      loop
      autoplay
    />
  );
}
