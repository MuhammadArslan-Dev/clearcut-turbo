import { useEffect, useRef, useState } from "react";

type ButtonPhase = "idle" | "icon" | "shimmer";

export default function useButtonArrowAnimation({
  data,
}: {
  data: string | number | boolean | null;
}) {
  const [buttonPhase, setButtonPhase] = useState<ButtonPhase>("idle");

  const started = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const languageSelected = data;

  useEffect(() => {
    if (!languageSelected) {
      setButtonPhase("idle");
      return;
    }

    const startAnimation = () => {
      if (started.current) return;
      started.current = true;

      const ICON_MS = 4500;
      const SHIMMER_MS = 2500;

      let phase: ButtonPhase = "icon";
      setButtonPhase("icon");

      const loop = () => {
        const duration = phase === "icon" ? ICON_MS : SHIMMER_MS;

        timeoutRef.current = setTimeout(() => {
          phase = phase === "icon" ? "shimmer" : "icon";
          setButtonPhase(phase);
          loop();
        }, duration);
      };

      loop();
      removeListeners();
    };

    const events = ["click", "scroll", "keydown", "touchstart"];

    const removeListeners = () =>
      events.forEach((event) =>
        window.removeEventListener(event, startAnimation)
      );

    events.forEach((event) =>
      window.addEventListener(event, startAnimation, { passive: true })
    );

    return () => {
      removeListeners();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [languageSelected]);

  return { buttonPhase };
}