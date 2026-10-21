"use client";
import { useEffect, useState } from "react";

export function useActiveStep(ids: string[]) {
  const [active, setActive] = useState(ids[0]);

  // Callers pass a fresh array each render (`steps.map(...)`); keying the
  // effect on the joined ids keeps the listener from being torn down and
  // re-added every time the active step changes.
  const idsKey = ids.join("|");

  useEffect(() => {
    const stepIds = idsKey.split("|");
    let frame = 0;

    const update = () => {
      frame = 0;
      const mid = window.innerHeight / 5;

      let closest = stepIds[0];
      let minDist = Infinity;

      stepIds.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top - mid);

        if (dist < minDist) {
          minDist = dist;
          closest = id;
        }
      });

      setActive(closest);
    };

    // Passive (never calls preventDefault) and at most once per frame —
    // several scroll events can land in one frame.
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [idsKey]);

  return active;
}
