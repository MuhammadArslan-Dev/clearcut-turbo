"use client";
import { useEffect, useState } from "react";

export function useActiveStep(ids: string[]) {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
  const onScroll = () => {
    const mid = window.innerHeight / 5;

    let closest = ids[0];
    let minDist = Infinity;

    ids.forEach((id) => {
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

  window.addEventListener("scroll", onScroll);
  onScroll();

  return () => window.removeEventListener("scroll", onScroll);
}, [ids]);

  return active;
}