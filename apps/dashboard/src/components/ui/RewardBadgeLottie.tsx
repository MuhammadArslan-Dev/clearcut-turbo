"use client";

import { useEffect, useRef, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { loadLottieAsset } from "@/lib/lottie/loadLottieAsset";
import { whenIdleAfterLoad } from "@/lib/sentry/when-idle";

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
 *
 * Only rows near the screen run a player. Free credits unlock every test, so a
 * chapter list has hundreds of unlocked cards at once; hundreds of live
 * canvases and animation loops froze the page (cards would not open for
 * seconds). A row outside the viewport (+ a margin) keeps the empty box of the
 * same size and mounts its player when scrolled close.
 */
export default function RewardBadgeLottie({ size }: { size: number }) {
  const [data, setData] = useState<ArrayBuffer | null>(null);
  const [near, setNear] = useState(false);
  const boxRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { rootMargin: "300px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Decoration: fetched only once the page has loaded and the browser is
    // idle, so on a slow connection it no longer competes with the page's own
    // data (a Facebook in-app trace spent 19 s on it, CC-146).
    whenIdleAfterLoad(() => {
      if (cancelled) return;
      loadLottieAsset(REWARD_LOTTIE_SRC).then((buffer) => {
        if (!cancelled) setData(buffer);
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Same box while the animation loads, so the row doesn't shift when it appears.
  return (
    <span ref={boxRef} aria-hidden="true" className="inline-block shrink-0" style={{ width: size, height: size }}>
      {data && near && (
    <DotLottieReact
      style={{ width: size, height: size }}
      // Slice so each player gets its own ArrayBuffer, not the same shared
      // instance — cheap for a file this size, and avoids relying on the
      // parser never mutating/detaching a buffer it doesn't own.
      data={data.slice(0)}
      loop
      autoplay
    />
      )}
    </span>
  );
}
